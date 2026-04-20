import {
  intervalFromKeys,
  normalizePitchClass,
  semitoneToPitchClass
} from "./theory";

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11
};

const SEMITONE_TO_NOTE = [
  { step: "C", alter: 0 },
  { step: "C", alter: 1 },
  { step: "D", alter: 0 },
  { step: "E", alter: -1 },
  { step: "E", alter: 0 },
  { step: "F", alter: 0 },
  { step: "F", alter: 1 },
  { step: "G", alter: 0 },
  { step: "A", alter: -1 },
  { step: "A", alter: 0 },
  { step: "B", alter: -1 },
  { step: "B", alter: 0 }
];

export type TransposeOptions = {
  semitones?: number;
  fromKey?: string;
  toKey?: string;
};

export function getTransposeInterval(options: TransposeOptions): number {
  if (typeof options.semitones === "number") {
    return options.semitones;
  }

  if (options.fromKey && options.toKey) {
    return intervalFromKeys(options.fromKey, options.toKey);
  }

  return 0;
}

function transposePitch(step: string, alter: number, octave: number, interval: number) {
  const base = NOTE_TO_SEMITONE[step];

  if (typeof base !== "number") {
    throw new Error(`Unsupported note step: ${step}`);
  }

  const absolute = octave * 12 + base + alter + interval;
  const normalized = ((absolute % 12) + 12) % 12;
  const nextOctave = Math.floor(absolute / 12);
  const pitch = SEMITONE_TO_NOTE[normalized];

  if (!pitch) {
    throw new Error(`Unsupported transposed pitch index: ${normalized}`);
  }

  return {
    step: pitch.step,
    alter: pitch.alter,
    octave: nextOctave
  };
}

function updateTagContent(source: string, tag: string, value: string | number): string {
  const pattern = new RegExp(`<${tag}>[^<]*</${tag}>`);
  return source.replace(pattern, `<${tag}>${value}</${tag}>`);
}

export function transposeMusicXml(xml: string, options: TransposeOptions): string {
  const interval = getTransposeInterval(options);

  if (interval === 0) {
    return xml;
  }

  return xml.replace(/<pitch>([\s\S]*?)<\/pitch>/g, (match) => {
    const stepMatch = match.match(/<step>([A-G])<\/step>/);
    const alterMatch = match.match(/<alter>(-?\d+)<\/alter>/);
    const octaveMatch = match.match(/<octave>(-?\d+)<\/octave>/);

    if (!stepMatch || !octaveMatch) {
      return match;
    }

    const step = stepMatch[1];
    const alterText = alterMatch?.[1];
    const octaveText = octaveMatch[1];

    if (!step || !octaveText) {
      return match;
    }

    const alter = alterText ? Number.parseInt(alterText, 10) : 0;
    const octave = Number.parseInt(octaveText, 10);
    const nextPitch = transposePitch(step, alter, octave, interval);

    let updated = updateTagContent(match, "step", nextPitch.step);
    updated = octaveMatch ? updateTagContent(updated, "octave", nextPitch.octave) : updated;

    if (nextPitch.alter === 0) {
      updated = updated.replace(/\s*<alter>-?\d+<\/alter>/, "");
    } else if (alterMatch) {
      updated = updateTagContent(updated, "alter", nextPitch.alter);
    } else {
      updated = updated.replace(
        /<step>[A-G]<\/step>/,
        `<step>${nextPitch.step}</step>\n        <alter>${nextPitch.alter}</alter>`
      );
    }

    return updated;
  });
}

export function transposeKeySignature(currentKey: string, options: TransposeOptions): string {
  const interval = getTransposeInterval(options);
  return semitoneToPitchClass(intervalFromKeys("C", normalizePitchClass(currentKey)) + interval);
}
