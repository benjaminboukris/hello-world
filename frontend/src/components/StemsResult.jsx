const STEM_ICONS = {
  vocals: "🎤",
  accompaniment: "🎸",
  drums: "🥁",
  bass: "🎵",
  piano: "🎹",
  other: "🎶",
};

const STEM_LABELS = {
  vocals: "Voix",
  accompaniment: "Accompagnement",
  drums: "Batterie",
  bass: "Basse",
  piano: "Piano",
  other: "Autre",
};

function getStemKey(filename) {
  const base = filename.toLowerCase().replace(/\.\w+$/, "");
  return base;
}

export default function StemsResult({ result, onReset }) {
  const { job_id, stems, download_url } = result;

  return (
    <div className="result-card">
      <div className="result-header">
        <span className="success-icon">✅</span>
        <h2>Séparation terminée !</h2>
        <p>{stems.length} stems extraits</p>
      </div>

      <div className="stems-list">
        {stems.map((stem) => {
          const key = getStemKey(stem);
          const icon = STEM_ICONS[key] || "🎵";
          const label = STEM_LABELS[key] || stem;

          return (
            <div key={stem} className="stem-item">
              <span className="stem-icon">{icon}</span>
              <span className="stem-name">{label}</span>
              <span className="stem-file">{stem}</span>
            </div>
          );
        })}
      </div>

      <a
        href={`/api/download/${job_id}`}
        className="download-btn"
        download={`stems_${job_id}.zip`}
      >
        ⬇️ Télécharger tous les stems (.zip)
      </a>

      <button className="reset-btn" onClick={onReset}>
        Séparer un autre fichier
      </button>
    </div>
  );
}
