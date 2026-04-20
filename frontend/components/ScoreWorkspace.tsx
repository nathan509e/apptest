"use client";

import { Download, Minus, Music2, Plus, RefreshCcw, Wand2 } from "lucide-react";
import { startTransition, useDeferredValue, useState } from "react";
import { getDownloadUrl, transposeScore, uploadScore } from "../lib/api";
import type { ScoreRecord } from "../types/score";
import { MidiPlayer } from "./MidiPlayer";
import { ScoreViewer } from "./ScoreViewer";
import { UploadDropzone } from "./UploadDropzone";

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

const TIMELINE = [
  {
    title: "Upload seguro",
    text: "Arquivos PDF ficam em armazenamento temporario e seguem para o pipeline de reconhecimento."
  },
  {
    title: "Reconhecimento OMR",
    text: "A API tenta Audiveris quando configurado e cai para um exemplo de desenvolvimento quando necessario."
  },
  {
    title: "Edicao e exportacao",
    text: "A partitura renderizada pode ser transposta e exportada como PDF, MIDI ou MusicXML."
  }
];

export function ScoreWorkspace() {
  const [score, setScore] = useState<ScoreRecord | null>(null);
  const [loadingLabel, setLoadingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fromKey, setFromKey] = useState("C");
  const [toKey, setToKey] = useState("D");

  const deferredMusicXml = useDeferredValue(score?.musicXml ?? null);

  async function handleUpload(file: File) {
    setError(null);
    setLoadingLabel("Convertendo PDF em MusicXML via OMR...");

    try {
      const result = await uploadScore(file);
      startTransition(() => {
        setScore({
          id: result.id,
          musicXml: result.musicXml,
          omrEngine: result.omrEngine
        });
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Erro ao processar o PDF.");
    } finally {
      setLoadingLabel(null);
    }
  }

  async function handleTranspose(payload: { semitones?: number; fromKey?: string; toKey?: string }, label: string) {
    if (!score) return;

    setError(null);
    setLoadingLabel(label);

    try {
      const result = await transposeScore(score.id, payload);
      startTransition(() => {
        setScore((current) =>
          current
            ? {
                ...current,
                musicXml: result.musicXml
              }
            : null
        );
      });
    } catch (transposeError) {
      setError(transposeError instanceof Error ? transposeError.message : "Erro ao transpor a partitura.");
    } finally {
      setLoadingLabel(null);
    }
  }

  return (
    <div className="workspace-grid">
      <aside style={{ display: "grid", gap: 22 }}>
        <section className="panel">
          <h2>Pipeline de leitura</h2>
          <p>Carregue uma partitura em PDF, converta para MusicXML editavel, transponha em segundos e exporte o resultado no formato que fizer sentido.</p>
          <UploadDropzone disabled={Boolean(loadingLabel)} onSelect={handleUpload} />

          {loadingLabel ? <div className="loading-bar" /> : null}
          {loadingLabel ? <p style={{ marginTop: 14 }}>{loadingLabel}</p> : null}
          {error ? <p style={{ marginTop: 14, color: "var(--danger)" }}>{error}</p> : null}
        </section>

        <section className="panel">
          <h3>Transposicao</h3>
          <p>Use semitons para ajustes rapidos ou selecione a mudanca de tonalidade diretamente.</p>

          <div className="toolbar" style={{ marginTop: 18 }}>
            <div className="toolbar-group">
              <button className="btn" type="button" disabled={!score || Boolean(loadingLabel)} onClick={() => handleTranspose({ semitones: -1 }, "Aplicando -1 semitom...")}>
                <Minus size={16} />
                -1
              </button>
              <button className="btn" type="button" disabled={!score || Boolean(loadingLabel)} onClick={() => handleTranspose({ semitones: 1 }, "Aplicando +1 semitom...")}>
                <Plus size={16} />
                +1
              </button>
              <button className="btn" type="button" disabled={!score || Boolean(loadingLabel)} onClick={() => handleTranspose({ semitones: 2 }, "Aplicando +2 semitons...")}>
                <Wand2 size={16} />
                +2
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar-group" style={{ width: "100%" }}>
              <select className="select" value={fromKey} onChange={(event) => setFromKey(event.target.value)}>
                {KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <select className="select" value={toKey} onChange={(event) => setToKey(event.target.value)}>
                {KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
              <button className="btn btn-accent" type="button" disabled={!score || Boolean(loadingLabel)} onClick={() => handleTranspose({ fromKey, toKey }, `Transpondo de ${fromKey} para ${toKey}...`)}>
                <RefreshCcw size={16} />
                Transpor tonalidade
              </button>
            </div>
          </div>
        </section>

        <section className="panel">
          <h3>Reproducao e exportacao</h3>
          <p>Ouca a melodia sintetizada diretamente no navegador e baixe os artefatos para DAWs, editores ou compartilhamento.</p>

          <div style={{ marginTop: 18 }}>
            <MidiPlayer musicXml={score?.musicXml ?? null} />
          </div>

          <div className="export-row">
            <a className="btn" href={score ? getDownloadUrl(score.id, "musicxml") : "#"} aria-disabled={!score}>
              <Download size={16} />
              MusicXML
            </a>
            <a className="btn" href={score ? getDownloadUrl(score.id, "midi") : "#"} aria-disabled={!score}>
              <Download size={16} />
              MIDI
            </a>
            <a className="btn" href={score ? getDownloadUrl(score.id, "pdf") : "#"} aria-disabled={!score}>
              <Download size={16} />
              PDF
            </a>
          </div>
        </section>

        <section className="panel">
          <h3>Fluxo do produto</h3>
          <div className="timeline">
            {TIMELINE.map((item) => (
              <div key={item.title} className="timeline-item">
                <strong>{item.title}</strong>
                <small>{item.text}</small>
              </div>
            ))}
          </div>
        </section>
      </aside>

      <section className="panel editor-shell">
        <div className="toolbar">
          <div className="status-chip">
            <Music2 size={14} />
            Score ID: <strong>{score?.id ?? "aguardando upload"}</strong>
          </div>
          <div className="status-chip">
            OMR: <strong>{score?.omrEngine ?? "nao iniciado"}</strong>
          </div>
        </div>
        <ScoreViewer musicXml={deferredMusicXml} />
      </section>
    </div>
  );
}
