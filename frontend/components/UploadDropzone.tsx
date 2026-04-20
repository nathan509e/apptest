"use client";

import { FileUp, FileMusic, Sparkles } from "lucide-react";
import { useState } from "react";

type UploadDropzoneProps = {
  disabled?: boolean;
  onSelect: (file: File) => void;
};

export function UploadDropzone({ disabled, onSelect }: UploadDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  return (
    <label className={`dropzone${dragging ? " dragging" : ""}`}>
      <input
        type="file"
        accept="application/pdf"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelect(file);
          }
        }}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
      />

      <div style={{ display: "grid", gap: 16 }}>
        <div className="status-chip">
          <Sparkles size={14} />
          Pipeline: PDF, OMR, MusicXML, MIDI
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="glass-card" style={{ padding: 14 }}>
            <FileUp size={22} />
          </div>
          <div>
            <strong>Arraste um PDF de partitura ou clique para escolher</strong>
            <div className="subtle">Aceita arquivos ate 20 MB. O sistema processa via OMR e abre a edicao em seguida.</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="status-chip">
            <FileMusic size={14} />
            Exporta MusicXML, MIDI e PDF
          </div>
          <div className="status-chip">
            Tempo medio de OMR: 5-20s
          </div>
        </div>
      </div>
    </label>
  );
}
