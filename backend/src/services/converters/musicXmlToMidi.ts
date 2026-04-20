import { XMLParser } from "fast-xml-parser";
import MidiWriter from "midi-writer-js";

type MusicXmlPartwise = {
  "score-partwise"?: {
    part?: {
      measure?: Array<{
        note?: Array<{
          rest?: unknown;
          duration?: number | string;
          pitch?: {
            step?: string;
            alter?: number | string;
            octave?: number | string;
          };
        }>;
      }>;
    } | Array<{
      measure?: Array<{
        note?: Array<{
          rest?: unknown;
          duration?: number | string;
          pitch?: {
            step?: string;
            alter?: number | string;
            octave?: number | string;
          };
        }>;
      }>;
    }>;
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => ["part", "measure", "note"].includes(name)
});

const ALTER_TO_ACCIDENTAL: Record<number, string> = {
  [-1]: "b",
  0: "",
  1: "#"
};

function durationToFigure(duration: number) {
  if (duration >= 4) return "1";
  if (duration === 3) return "2d";
  if (duration === 2) return "2";
  if (duration === 1) return "4";
  return "8";
}

export function convertMusicXmlToMidiBuffer(xml: string) {
  const parsed = parser.parse(xml) as MusicXmlPartwise;
  const track = new MidiWriter.Track();
  track.setTempo(96);

  const parts = parsed["score-partwise"]?.part;
  const normalizedParts = Array.isArray(parts) ? parts : parts ? [parts] : [];

  normalizedParts.forEach((part) => {
    const measures = part.measure ?? [];

    measures.forEach((measure) => {
      (measure.note ?? []).forEach((note) => {
        if (note.rest || !note.pitch?.step || note.pitch.octave === undefined) {
          return;
        }

        const alter = Number.parseInt(String(note.pitch.alter ?? 0), 10);
        const accidental = ALTER_TO_ACCIDENTAL[alter] ?? "";
        const pitch = `${note.pitch.step}${accidental}${note.pitch.octave}`;
        const duration = durationToFigure(Number.parseInt(String(note.duration ?? 1), 10));

        track.addEvent(
          new MidiWriter.NoteEvent({
            pitch: [pitch],
            duration
          })
        );
      });
    });
  });

  const writer = new MidiWriter.Writer([track]);
  return Buffer.from(writer.buildFile());
}
