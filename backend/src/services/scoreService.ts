import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuid } from "uuid";
import { transposeMusicXml, type TransposeOptions } from "../../../utils/music/index.js";
import { convertMusicXmlToMidiBuffer } from "./converters/musicXmlToMidi.js";
import { exportMusicXmlAsPdf } from "./exports/exportPdf.js";
import { createSessionDir, safeWriteFile } from "./storage/tempStorage.js";
import { convertPdfToMusicXml } from "./omrService.js";

export type ScoreRecord = {
  id: string;
  sourcePdfPath: string;
  musicXmlPath: string;
  midiPath: string;
  exportedPdfPath: string;
  omrEngine: string;
};

const scoreRegistry = new Map<string, ScoreRecord>();

async function rebuildArtifacts(sessionDir: string, musicXml: string) {
  const musicXmlPath = path.join(sessionDir, "score.musicxml");
  const midiPath = path.join(sessionDir, "score.mid");
  const exportedPdfPath = path.join(sessionDir, "score.pdf");

  await safeWriteFile(musicXmlPath, musicXml);
  await safeWriteFile(midiPath, convertMusicXmlToMidiBuffer(musicXml));
  await safeWriteFile(exportedPdfPath, await exportMusicXmlAsPdf(musicXml));

  return { musicXmlPath, midiPath, exportedPdfPath };
}

export async function createScoreFromPdf(file: Express.Multer.File) {
  const scoreId = uuid();
  const sessionDir = await createSessionDir();
  const pdfPath = path.join(sessionDir, "source.pdf");

  await safeWriteFile(pdfPath, file.buffer);

  const omrResult = await convertPdfToMusicXml(pdfPath, sessionDir);
  const artifacts = await rebuildArtifacts(sessionDir, omrResult.xml);

  const record: ScoreRecord = {
    id: scoreId,
    sourcePdfPath: pdfPath,
    omrEngine: omrResult.engine,
    ...artifacts
  };

  scoreRegistry.set(scoreId, record);

  return {
    id: scoreId,
    omrEngine: record.omrEngine,
    musicXml: omrResult.xml
  };
}

export async function getScoreOrThrow(scoreId: string) {
  const record = scoreRegistry.get(scoreId);
  if (!record) {
    throw new Error("Score not found");
  }

  return record;
}

export async function readMusicXml(scoreId: string) {
  const record = await getScoreOrThrow(scoreId);
  return fs.readFile(record.musicXmlPath, "utf-8");
}

export async function transposeScore(scoreId: string, options: TransposeOptions) {
  const record = await getScoreOrThrow(scoreId);
  const currentXml = await fs.readFile(record.musicXmlPath, "utf-8");
  const transposedXml = transposeMusicXml(currentXml, options);
  const artifacts = await rebuildArtifacts(path.dirname(record.musicXmlPath), transposedXml);

  scoreRegistry.set(scoreId, { ...record, ...artifacts });

  return {
    id: scoreId,
    musicXml: transposedXml
  };
}

export async function getDownload(scoreId: string, format: "musicxml" | "midi" | "pdf") {
  const record = await getScoreOrThrow(scoreId);
  const mapping = {
    musicxml: {
      path: record.musicXmlPath,
      mime: "application/vnd.recordare.musicxml+xml",
      name: `${scoreId}.musicxml`
    },
    midi: {
      path: record.midiPath,
      mime: "audio/midi",
      name: `${scoreId}.mid`
    },
    pdf: {
      path: record.exportedPdfPath,
      mime: "application/pdf",
      name: `${scoreId}.pdf`
    }
  } as const;

  return mapping[format];
}
