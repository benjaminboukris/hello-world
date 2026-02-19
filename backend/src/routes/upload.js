const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const router = express.Router();

const SPLEETER_URL = process.env.SPLEETER_URL || "http://localhost:5001";
const MAX_FILE_SIZE_MB = 50;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/mp4", "audio/x-m4a"];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|flac|m4a)$/i)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Please upload an audio file (MP3, WAV, OGG, FLAC, M4A)."));
    }
  },
});

router.post("/split", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file uploaded." });
  }

  const stems = req.body.stems || "2stems";
  const validStems = ["2stems", "4stems", "5stems"];
  if (!validStems.includes(stems)) {
    return res.status(400).json({ error: `Invalid stems option. Choose from: ${validStems.join(", ")}` });
  }

  const form = new FormData();
  form.append("file", req.file.buffer, {
    filename: req.file.originalname,
    contentType: req.file.mimetype,
  });
  form.append("stems", stems);

  try {
    const response = await axios.post(`${SPLEETER_URL}/split`, form, {
      headers: form.getHeaders(),
      timeout: 5 * 60 * 1000, // 5 minutes timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    res.json(response.data);
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Spleeter service error";
    res.status(502).json({ error: message });
  }
});

router.get("/download/:jobId", async (req, res) => {
  const { jobId } = req.params;

  try {
    const response = await axios.get(`${SPLEETER_URL}/download/${jobId}`, {
      responseType: "stream",
      timeout: 60 * 1000,
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="stems_${jobId}.zip"`);
    response.data.pipe(res);
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Download failed";
    res.status(404).json({ error: message });
  }
});

module.exports = router;
