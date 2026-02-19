import uuid
import zipfile
import subprocess
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_DIR = Path("/tmp/stemapp/input")
OUTPUT_DIR = Path("/tmp/stemapp/output")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Demucs model per stem mode
STEMS_MODES = {
    "2stems": {"model": "htdemucs", "two_stems": "vocals"},
    "4stems": {"model": "htdemucs", "two_stems": None},
    "5stems": {"model": "htdemucs_6s", "two_stems": None},
}


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
    if stems not in STEMS_MODES:
        return jsonify({"error": f"Invalid stems mode. Choose from {list(STEMS_MODES.keys())}"}), 400

    job_id = str(uuid.uuid4())
    input_path = UPLOAD_DIR / f"{job_id}_{audio_file.filename}"
    audio_file.save(str(input_path))

    output_path = OUTPUT_DIR / job_id
    output_path.mkdir(parents=True, exist_ok=True)

    config = STEMS_MODES[stems]
    cmd = [
        "python3", "-m", "demucs",
        "--out", str(output_path),
        "--name", config["model"],
        "--mp3",
    ]
    if config["two_stems"]:
        cmd += ["--two-stems", config["two_stems"]]
    cmd.append(str(input_path))

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            return jsonify({"error": result.stderr or "Demucs separation failed"}), 500
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Separation timed out (>10 min)"}), 504
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        input_path.unlink(missing_ok=True)

    stem_files = list(output_path.rglob("*.mp3")) + list(output_path.rglob("*.wav"))

    if not stem_files:
        return jsonify({"error": "No output files produced"}), 500

    zip_path = OUTPUT_DIR / f"{job_id}.zip"
    with zipfile.ZipFile(str(zip_path), "w") as zf:
        for stem_file in stem_files:
            zf.write(str(stem_file), stem_file.name)

    return jsonify({
        "job_id": job_id,
        "stems": [f.name for f in stem_files],
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
