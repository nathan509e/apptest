export const CHROMATIC_SCALE = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B"
] as const;

export type PitchClass = (typeof CHROMATIC_SCALE)[number];

const NORMALIZED_ENHARMONICS: Record<string, PitchClass> = {
  CB: "B",
  "B#": "C",
  DB: "C#",
  "D#": "Eb",
  FB: "E",
  "E#": "F",
  GB: "F#",
  "G#": "Ab",
  AB: "Ab",
  "A#": "Bb",
  BB: "Bb"
};

export function normalizePitchClass(input: string): PitchClass {
  const cleaned = input.trim().replace("♭", "b").replace("♯", "#");
  const canonical = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const upper = canonical.toUpperCase();
  const mapped = NORMALIZED_ENHARMONICS[upper] ?? canonical;

  if ((CHROMATIC_SCALE as readonly string[]).includes(mapped)) {
    return mapped as PitchClass;
  }

  throw new Error(`Unsupported pitch class: ${input}`);
}

export function pitchClassToSemitone(pitch: string): number {
  return CHROMATIC_SCALE.indexOf(normalizePitchClass(pitch));
}

export function semitoneToPitchClass(semitone: number): PitchClass {
  const index = ((semitone % 12) + 12) % 12;
  const pitch = CHROMATIC_SCALE[index];

  if (!pitch) {
    throw new Error(`Invalid semitone index: ${semitone}`);
  }

  return pitch;
}

export function transposePitchClass(pitch: string, interval: number): PitchClass {
  const semitone = pitchClassToSemitone(pitch);
  return semitoneToPitchClass(semitone + interval);
}

export function intervalFromKeys(fromKey: string, toKey: string): number {
  return pitchClassToSemitone(toKey) - pitchClassToSemitone(fromKey);
}
