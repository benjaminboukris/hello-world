import { useState, useRef } from "react";

export default function AudioUploader({ stemsOptions, onSplit, loading, progress, error }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedStems, setSelectedStems] = useState("2stems");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (file && file.type.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a)$/i.test(file?.name || "")) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    onSplit(selectedFile, selectedStems);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="uploader-card">
      <form onSubmit={handleSubmit}>
        {/* Drop zone */}
        <div
          className={`drop-zone ${dragOver ? "drag-over" : ""} ${selectedFile ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
            className="hidden-input"
            onChange={(e) => handleFileChange(e.target.files[0])}
          />
          {selectedFile ? (
            <div className="file-info">
              <span className="file-icon">🎵</span>
              <span className="file-name">{selectedFile.name}</span>
              <span className="file-size">{formatSize(selectedFile.size)}</span>
            </div>
          ) : (
            <div className="drop-placeholder">
              <span className="upload-icon">📁</span>
              <p>Glissez un fichier audio ici</p>
              <p className="hint">ou cliquez pour sélectionner</p>
              <p className="formats">MP3 · WAV · OGG · FLAC · M4A (max 50 MB)</p>
            </div>
          )}
        </div>

        {/* Stems selector */}
        <div className="stems-selector">
          <label className="selector-label">Mode de séparation</label>
          <div className="stems-options">
            {stemsOptions.map((opt) => (
              <label
                key={opt.value}
                className={`stems-option ${selectedStems === opt.value ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name="stems"
                  value={opt.value}
                  checked={selectedStems === opt.value}
                  onChange={() => setSelectedStems(opt.value)}
                />
                <span className="stems-label">{opt.label}</span>
                <span className="stems-desc">{opt.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-box">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Progress */}
        {loading && progress && (
          <div className="progress-box">
            <div className="spinner"></div>
            <span>{progress}</span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="submit-btn"
          disabled={!selectedFile || loading}
        >
          {loading ? "Séparation en cours..." : "Séparer les stems"}
        </button>
      </form>
    </div>
  );
}
