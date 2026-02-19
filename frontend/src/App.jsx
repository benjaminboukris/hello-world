import { useState } from "react";
import AudioUploader from "./components/AudioUploader.jsx";
import StemsResult from "./components/StemsResult.jsx";

const STEMS_OPTIONS = [
  { value: "2stems", label: "2 stems", description: "Vocals + Accompaniment" },
  { value: "4stems", label: "4 stems", description: "Vocals + Drums + Bass + Other" },
  { value: "5stems", label: "5 stems", description: "Vocals + Drums + Bass + Piano + Other" },
];

export default function App() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleSplit = async (file, stems) => {
    setError(null);
    setResult(null);
    setLoading(true);
    setProgress("Envoi du fichier...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("stems", stems);

    try {
      setProgress("Séparation des stems en cours (cela peut prendre plusieurs minutes)...");
      const response = await fetch("/api/split", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la séparation");
      }

      setResult(data);
      setProgress(null);
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setProgress(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Audio Stem Splitter</h1>
        <p className="subtitle">Séparez votre audio en stems individuels avec Spleeter</p>
      </header>

      <main className="app-main">
        {!result ? (
          <AudioUploader
            stemsOptions={STEMS_OPTIONS}
            onSplit={handleSplit}
            loading={loading}
            progress={progress}
            error={error}
          />
        ) : (
          <StemsResult result={result} onReset={handleReset} />
        )}
      </main>

      <footer className="app-footer">
        <p>Propulsé par <a href="https://github.com/deezer/spleeter" target="_blank" rel="noreferrer">Spleeter</a> de Deezer</p>
      </footer>
    </div>
  );
}
