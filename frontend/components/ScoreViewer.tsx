"use client";

import { useEffect, useRef } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";

type ScoreViewerProps = {
  musicXml: string | null;
};

export function ScoreViewer({ musicXml }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !musicXml) {
      return;
    }

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      drawTitle: true,
      backend: "svg"
    });

    osmd
      .load(musicXml)
      .then(() => osmd.render())
      .catch((error) => {
        console.error("OSMD render failed", error);
      });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [musicXml]);

  if (!musicXml) {
    return (
      <div className="empty-state">
        <div>
          <strong>Nenhuma partitura carregada</strong>
          <div className="subtle">Envie um PDF para iniciar o reconhecimento, a visualizacao e a transposicao.</div>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="score-canvas" />;
}
