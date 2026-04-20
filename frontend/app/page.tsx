import { BarChart3, FileMusic, ScanSearch, WandSparkles } from "lucide-react";
import { ScoreWorkspace } from "../components/ScoreWorkspace";

const stats = [
  { value: "PDF -> XML", label: "pipeline de digitalizacao e leitura" },
  { value: "Tempo real", label: "transposicao por intervalo ou tonalidade" },
  { value: "3 formatos", label: "exportacao em PDF, MIDI e MusicXML" }
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">
              <WandSparkles size={14} />
              ScoreFlow Studio
            </div>
            <h1>Leitura e transposicao de partituras em um unico estudio web.</h1>
            <p>
              Uma experiencia inspirada em editores musicais modernos: envie PDFs, rode OMR, visualize a partitura renderizada,
              ajuste a tonalidade em poucos cliques e exporte para continuar no seu fluxo de composicao ou estudo.
            </p>

            <div className="hero-metrics">
              {stats.map((stat) => (
                <div key={stat.label} className="metric-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-preview">
            <div className="stack-preview">
              <div className="preview-lines">
                <div className="preview-bar" />
                <div className="preview-bar" style={{ width: "82%" }} />
                <div className="preview-bar" style={{ width: "90%" }} />
                <div className="preview-bar" style={{ width: "74%" }} />
              </div>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div className="glass-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <ScanSearch size={18} />
                OMR preparado para Audiveris e fallback local de desenvolvimento
              </div>
              <div className="glass-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <FileMusic size={18} />
                Visualizacao com OpenSheetMusicDisplay e player sintetizado
              </div>
              <div className="glass-card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "center" }}>
                <BarChart3 size={18} />
                Estrutura pronta para historico, login e compartilhamento
              </div>
            </div>
          </div>
        </div>
      </section>

      <ScoreWorkspace />
    </main>
  );
}
