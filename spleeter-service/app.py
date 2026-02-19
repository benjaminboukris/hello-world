import os
import uuid
import zipfile
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from spleeter.separator import Separator

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = Path("/tmp/spleeter/input")
OUTPUT_DIR = Path("/tmp/spleeter/output")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_MODES = ["2stems", "4stems", "5stems"]


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/split", methods=["POST"])
def split():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    audio_file = request.files["file"]
    if audio_file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    stems = request.form.get("stems", "2stems")
    if stems not in SUPPORTED_MODES:
        return jsonify({"error": f"Invalid stems mode. Choose from {SUPPORTED_MODES}"}), 400

    job_id = str(uuid.uuid4())
    input_path = UPLOAD_DIR / f"{job_id}_{audio_file.filename}"
    audio_file.save(str(input_path))

    output_path = OUTPUT_DIR / job_id
    output_path.mkdir(parents=True, exist_ok=True)

    try:
        separator = Separator(f"spleeter:{stems}")
        separator.separate_to_file(
            str(input_path),
            str(output_path),
            filename_format="{instrument}.{codec}",
            synchronous=True,
        )
    except Exception as e:
        input_path.unlink(missing_ok=True)
        return jsonify({"error": str(e)}), 500
    finally:
        input_path.unlink(missing_ok=True)

    stem_files = list(output_path.rglob("*.wav")) + list(output_path.rglob("*.mp3"))

    if not stem_files:
        return jsonify({"error": "Spleeter produced no output files"}), 500

    zip_path = OUTPUT_DIR / f"{job_id}.zip"
    with zipfile.ZipFile(str(zip_path), "w") as zf:
        for stem_file in stem_files:
            zf.write(str(stem_file), stem_file.name)

    stems_list = [f.name for f in stem_files]

    return jsonify({
        "job_id": job_id,
        "stems": stems_list,
        "download_url": f"/download/{job_id}",
    })


@app.route("/download/<job_id>", methods=["GET"])
def download(job_id):
    zip_path = OUTPUT_DIR / f"{job_id}.zip"
    if not zip_path.exists():
        return jsonify({"error": "Job not found"}), 404

    return send_file(
        str(zip_path),
        mimetype="application/zip",
        as_attachment=True,
        download_name=f"stems_{job_id}.zip",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
