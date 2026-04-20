"use client";

import { Pause, Play, Square } from "lucide-react";
import { XMLParser } from "fast-xml-parser";
import { useEffect, useRef, useState } from "react";
import * as Tone from "tone";

type MidiPlayerProps = {
  musicXml: string | null;
};

type ParsedNote = {
  note: string;
  duration: string;
  time: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => ["part", "measure", "note"].includes(name)
});

function durationToTone(duration: number) {
  if (duration >= 4) return "1n";
  if (duration === 3) return "2n.";
  if (duration === 2) return "2n";
  if (duration === 1) return "4n";
  return "8n";
}

function parseNotes(xml: string): ParsedNote[] {
  const parsed = parser.parse(xml) as Record<string, any>;
  const parts = parsed?.["score-partwise"]?.part;
  const normalizedParts = Array.isArray(parts) ? parts : parts ? [parts] : [];
  const notes: ParsedNote[] = [];
  let stepIndex = 0;

  normalizedParts.forEach((part) => {
    (part.measure ?? []).forEach((measure: Record<string, any>) => {
      (measure.note ?? []).forEach((note: Record<string, any>) => {
        if (note.rest || !note.pitch?.step) {
          stepIndex += 1;
          return;
        }

        const accidental = note.pitch.alter === 1 ? "#" : note.pitch.alter === -1 ? "b" : "";
        notes.push({
          note: `${note.pitch.step}${accidental}${note.pitch.octave}`,
          duration: durationToTone(Number(note.duration ?? 1)),
          time: `${stepIndex * 0.5}`
        });
        stepIndex += 1;
      });
    });
  });

  return notes;
}

export function MidiPlayer({ musicXml }: MidiPlayerProps) {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part<ParsedNote> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.02, decay: 0.08, sustain: 0.5, release: 1.2 }
    }).toDestination();

    return () => {
      partRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    partRef.current?.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);

    if (!musicXml || !synthRef.current) {
      setIsReady(false);
      return;
    }

    const notes = parseNotes(musicXml);
    const synth = synthRef.current;

    partRef.current = new Tone.Part((time, value) => {
      synth.triggerAttackRelease(value.note, value.duration, time);
    }, notes).start(0);

    Tone.Transport.bpm.value = 96;
    setIsReady(notes.length > 0);
  }, [musicXml]);

  async function startPlayback() {
    if (!isReady) return;
    await Tone.start();
    Tone.Transport.start();
    setIsPlaying(true);
  }

  function pausePlayback() {
    Tone.Transport.pause();
    setIsPlaying(false);
  }

  function stopPlayback() {
    Tone.Transport.stop();
    setIsPlaying(false);
  }

  return (
    <div className="toolbar-group">
      <button className="btn btn-primary" type="button" onClick={startPlayback} disabled={!isReady || isPlaying}>
        <Play size={16} />
        Reproduzir
      </button>
      <button className="btn" type="button" onClick={pausePlayback} disabled={!isPlaying}>
        <Pause size={16} />
        Pausar
      </button>
      <button className="btn btn-ghost" type="button" onClick={stopPlayback} disabled={!isReady}>
        <Square size={16} />
        Parar
      </button>
    </div>
  );
}
