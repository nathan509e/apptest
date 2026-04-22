export const CHROMATIC_SCALE = [
  "C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"
];

export const FIFTHS_TO_KEY = {
  0: "C", 1: "G", 2: "D", 3: "A", 4: "E", 5: "B", 6: "F#", 7: "C#",
  "-1": "F", "-2": "Bb", "-3": "Eb", "-4": "Ab", "-5": "Db", "-6": "Gb", "-7": "Cb"
};

export const KEY_TO_FIFTHS = Object.fromEntries(
  Object.entries(FIFTHS_TO_KEY).map(([fifths, key]) => [key, parseInt(fifths, 10)])
);

const NORMALIZED_ENHARMONICS = {
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

export function normalizePitchClass(input) {
  const cleaned = input.trim().replace("♭", "b").replace("♯", "#");
  const canonical = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  const upper = canonical.toUpperCase();
  const mapped = NORMALIZED_ENHARMONICS[upper] ?? canonical;

  if (CHROMATIC_SCALE.includes(mapped)) {
    return mapped;
  }

  throw new Error(`Unsupported pitch class: ${input}`);
}

export function pitchClassToSemitone(pitch) {
  return CHROMATIC_SCALE.indexOf(normalizePitchClass(pitch));
}

export function semitoneToPitchClass(semitone) {
  const index = ((semitone % 12) + 12) % 12;
  return CHROMATIC_SCALE[index];
}

export function intervalFromKeys(fromKey, toKey) {
  let diff = pitchClassToSemitone(toKey) - pitchClassToSemitone(fromKey);
  while (diff > 6) diff -= 12;
  while (diff < -5) diff += 12;
  return diff;
}
