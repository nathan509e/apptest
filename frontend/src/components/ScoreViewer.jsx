import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Music, Settings2, ChevronDown, Play, Pause, Square, Save } from 'lucide-react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import AudioPlayer from '@isamu/osmd-audio-player';
import { transposeMusicXml, forceViolinInstrument, injectNoteNames } from '../utils/musicxml.js';
import { FIFTHS_TO_KEY, KEY_TO_FIFTHS, intervalFromKeys } from '../utils/theory.js';
import './ScoreViewer.css';

const KEYS_OPTIONS = [
  { label: "Dó Maior / Lá Menor", value: "C", fifths: 0 },
  { label: "Sol Maior / Mi Menor", value: "G", fifths: 1 },
  { label: "Ré Maior / Si Menor", value: "D", fifths: 2 },
  { label: "Lá Maior / Fá# Menor", value: "A", fifths: 3 },
  { label: "Mi Maior / Dó# Menor", value: "E", fifths: 4 },
  { label: "Si Maior / Sol# Menor", value: "B", fifths: 5 },
  { label: "Fá# Maior / Ré# Menor", value: "F#", fifths: 6 },
  { label: "Dó# Maior / Lá# Menor", value: "C#", fifths: 7 },
  { label: "Fá Maior / Ré Menor", value: "F", fifths: -1 },
  { label: "Si♭ Maior / Sol Menor", value: "Bb", fifths: -2 },
  { label: "Mi♭ Maior / Dó Menor", value: "Eb", fifths: -3 },
  { label: "Lá♭ Maior / Fá Menor", value: "Ab", fifths: -4 },
  { label: "Ré♭ Maior / Si♭ Menor", value: "Db", fifths: -5 },
  { label: "Sol♭ Maior / Mi♭ Menor", value: "Gb", fifths: -6 },
  { label: "Dó♭ Maior / Lá♭ Menor", value: "Cb", fifths: -7 },
].sort((a, b) => a.fifths - b.fifths);

export default function ScoreViewer({ scoreFile, onBack }) {
  const [originalXml, setOriginalXml] = useState('');
  const [currentXml, setCurrentXml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [originalFifths, setOriginalFifths] = useState(0);
  const [targetKey, setTargetKey] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioState, setAudioState] = useState('STOPPED');
  const [showNotes, setShowNotes] = useState(false);
  
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    audioPlayerRef.current.on('state-change', (state) => {
      setAudioState(state);
      setIsPlaying(state === 'PLAYING');
    });
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      let xml = e.target.result;
      xml = forceViolinInstrument(xml);
      setOriginalXml(xml);
      setCurrentXml(xml);
      
      const fifthsMatch = xml.match(/<fifths>(-?\d+)<\/fifths>/);
      const fifths = fifthsMatch ? parseInt(fifthsMatch[1], 10) : 0;
      setOriginalFifths(fifths);
      
      setIsLoading(false);
    };
    reader.readAsText(scoreFile);
  }, [scoreFile]);

  useEffect(() => {
    if (!currentXml || !containerRef.current) return;
    
    if (!osmdRef.current) {
      osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
        autoResize: true,
        drawTitle: false,
        backend: "svg",
      });
    }

    const loadAndRender = async () => {
      try {
        await osmdRef.current.load(currentXml);
        osmdRef.current.render();
        osmdRef.current.cursor.show();
        await audioPlayerRef.current.loadScore(osmdRef.current);
      } catch (err) {
        console.error("OSMD Load Error: ", err);
      }
    };
    
    loadAndRender();
  }, [currentXml]);

  const togglePlay = async () => {
    if (!audioPlayerRef.current) return;
    if (audioState === 'PLAYING') {
      audioPlayerRef.current.pause();
    } else {
      await audioPlayerRef.current.play();
    }
  };

  const stopAudio = async () => {
    if (!audioPlayerRef.current) return;
    await audioPlayerRef.current.stop();
  };

  const handleKeyChange = (e) => {
    const newKey = e.target.value;
    setTargetKey(newKey);
    
    if (!newKey) {
       applyTransposition(0, 0, showNotes);
       return;
    }

    const targetFifths = KEY_TO_FIFTHS[newKey];
    const fifthsDiff = targetFifths - originalFifths;
    
    const originalKeyStr = FIFTHS_TO_KEY[originalFifths] || "C";
    const semitones = intervalFromKeys(originalKeyStr, newKey);
    
    applyTransposition(semitones, fifthsDiff, showNotes);
  };

  const handleNotesToggle = (e) => {
    const checked = e.target.checked;
    setShowNotes(checked);
    
    const targetFifths = KEY_TO_FIFTHS[targetKey] || originalFifths;
    const fifthsDiff = targetKey ? targetFifths - originalFifths : 0;
    
    const originalKeyStr = FIFTHS_TO_KEY[originalFifths] || "C";
    const semitones = targetKey ? intervalFromKeys(originalKeyStr, targetKey) : 0;
    
    applyTransposition(semitones, fifthsDiff, checked);
  };

  const applyTransposition = (semitones, fifthsDiff, showNotesFlag = showNotes) => {
    if (!originalXml) return;
    let transposed = transposeMusicXml(originalXml, { semitones, fifthsDiff });
    if (showNotesFlag) {
      transposed = injectNoteNames(transposed);
    }
    setCurrentXml(transposed);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: scoreFile.name, xml: originalXml })
      });
      const data = await response.json();
      if (data.success) {
        alert("Partitura salva na sua biblioteca com sucesso!");
      } else {
        alert("Erro ao salvar: " + data.error);
      }
    } catch (err) {
      console.error("Erro ao salvar partitura", err);
      alert("Erro ao conectar com o servidor para salvar.");
    }
  };

  return (
    <div className="score-viewer fade-in">
      <div className="viewer-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>Voltar para Partituras</span>
        </button>
        <div className="file-info">
          <Music size={18} className="file-icon" />
          <h2>{scoreFile.name}</h2>
        </div>
        
        <div style={{ flex: 1 }} />
        
        <button className="toolbar-btn primary" onClick={handleSave} style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Save size={16} /> Salvar Partitura
        </button>
      </div>

      <div className="viewer-toolbar">
        <div className="toolbar-group">
          <span className="toolbar-label">Tom Alvo</span>
          <div className="target-key-wrapper">
            <select className="target-key-select" value={targetKey} onChange={handleKeyChange}>
              <option value="">Original</option>
              {KEYS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="select-icon" />
          </div>
        </div>
        
        <div className="toolbar-separator" />

        <div className="playback-controls">
          <div className="notes-toggle-wrapper">
            <input type="checkbox" id="show-notes-cb" checked={showNotes} onChange={handleNotesToggle} />
            <label htmlFor="show-notes-cb">NOTAS</label>
          </div>
          <div className="toolbar-separator-small" />
          <button className="toolbar-btn playback-btn" onClick={stopAudio} disabled={audioState === 'STOPPED'}>
            <Square size={16} fill={audioState !== 'STOPPED' ? "currentColor" : "none"} />
          </button>
          <button className="toolbar-btn primary playback-btn play-pause-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
        </div>

        <div className="toolbar-spacer" />

        <button className="toolbar-btn primary"><Settings2 size={16} /> Configurações de Partitura</button>
      </div>

      <div className="score-canvas-container" style={{ backgroundColor: '#fff', overflowY: 'auto' }}>
        {isLoading ? (
          <div className="score-canvas-mock" style={{backgroundColor: '#1a1a1c', border: 'none'}}>
            <p className="mock-text">Lendo arquivo MusicXML...</p>
            <div className="mock-spinner"></div>
          </div>
        ) : (
          <div ref={containerRef} style={{ width: '100%', minHeight: '800px' }}></div>
        )}
      </div>
    </div>
  );
}
