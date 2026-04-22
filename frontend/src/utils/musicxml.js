import { intervalFromKeys, normalizePitchClass, semitoneToPitchClass } from "./theory.js";

const NOTE_TO_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const SEMITONE_TO_NOTE = [
  { step: "C", alter: 0 }, { step: "C", alter: 1 },
  { step: "D", alter: 0 }, { step: "E", alter: -1 },
  { step: "E", alter: 0 }, { step: "F", alter: 0 },
  { step: "F", alter: 1 }, { step: "G", alter: 0 },
  { step: "A", alter: -1 }, { step: "A", alter: 0 },
  { step: "B", alter: -1 }, { step: "B", alter: 0 }
];

export function getTransposeInterval(options) {
  if (typeof options.semitones === "number") {
    return options.semitones;
  }
  if (options.fromKey && options.toKey) {
    return intervalFromKeys(options.fromKey, options.toKey);
  }
  return 0;
}

function transposePitch(step, alter, octave, interval) {
  const base = NOTE_TO_SEMITONE[step];
  if (typeof base !== "number") throw new Error(`Unsupported note step: ${step}`);

  const absolute = octave * 12 + base + alter + interval;
  const normalized = ((absolute % 12) + 12) % 12;
  const nextOctave = Math.floor(absolute / 12);
  const pitch = SEMITONE_TO_NOTE[normalized];

  if (!pitch) throw new Error(`Unsupported transposed pitch index: ${normalized}`);

  return {
    step: pitch.step,
    alter: pitch.alter,
    octave: nextOctave
  };
}

function updateTagContent(source, tag, value) {
  const pattern = new RegExp(`<${tag}>[^<]*</${tag}>`);
  return source.replace(pattern, `<${tag}>${value}</${tag}>`);
}

export function transposeMusicXml(xml, options) {
  const interval = getTransposeInterval(options);
  const fifthsDiff = options.fifthsDiff || 0;
  
  if (interval === 0 && fifthsDiff === 0) return xml;

  let updatedXml = xml;

  if (fifthsDiff !== 0) {
    updatedXml = updatedXml.replace(/<fifths>(-?\d+)<\/fifths>/g, (match, fifthsStr) => {
      const currentFifths = parseInt(fifthsStr, 10);
      return `<fifths>${currentFifths + fifthsDiff}</fifths>`;
    });
  }

  if (interval === 0) return updatedXml;

  return updatedXml.replace(/<pitch>([\s\S]*?)<\/pitch>/g, (match) => {
    const stepMatch = match.match(/<step>([A-G])<\/step>/);
    const alterMatch = match.match(/<alter>(-?\d+)<\/alter>/);
    const octaveMatch = match.match(/<octave>(-?\d+)<\/octave>/);

    if (!stepMatch || !octaveMatch) return match;

    const step = stepMatch[1];
    const alterText = alterMatch?.[1];
    const octaveText = octaveMatch[1];

    if (!step || !octaveText) return match;

    const alter = alterText ? parseInt(alterText, 10) : 0;
    const octave = parseInt(octaveText, 10);
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

export function forceViolinInstrument(xml) {
  if (/<midi-program>\d+<\/midi-program>/.test(xml)) {
    return xml.replace(/<midi-program>\d+<\/midi-program>/g, "<midi-program>41</midi-program>");
  }
  return xml.replace(/(<score-part[^>]*>)/g, "$1\n      <midi-instrument id=\"Midi-Violin\">\n        <midi-program>41</midi-program>\n      </midi-instrument>");
}

export function injectNoteNames(xml) {
  const STEP_TO_BR = {
    "C": "do", "D": "re", "E": "mi", "F": "fa", "G": "sol", "A": "la", "B": "si"
  };

  return xml.replace(/(<note\b[^>]*>)([\s\S]*?)<\/note>/g, (match, openTag, inner) => {
    if (/<rest\b[^>]*>/.test(inner)) return match;
    
    const stepMatch = inner.match(/<step>([A-G])<\/step>/);
    if (!stepMatch) return match;
    
    const step = stepMatch[1];
    let noteName = STEP_TO_BR[step];
    
    const alterMatch = inner.match(/<alter>(-?\d+)<\/alter>/);
    if (alterMatch) {
      const alter = parseInt(alterMatch[1], 10);
      if (alter === 1) noteName += "#";
      else if (alter === -1) noteName += "b";
    }

    const lyricXml = `\n        <lyric placement="above"><syllabic>single</syllabic><text>${noteName}</text></lyric>`;
    
    return `${openTag}${inner}${lyricXml}\n      </note>`;
  });
}
