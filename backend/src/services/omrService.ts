import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { env } from "../config/env.js";

function normalizeOmrOutput(xml: string) {
  return xml
    .replace(/\u0000/g, "")
    .replace(/<credit>[\s\S]*?<\/credit>/g, "")
    .trim();
}

async function runAudiveris(pdfPath: string, outputDir: string) {
  const args = [
    "-jar",
    env.audiverisJarPath,
    "-batch",
    "-export",
    "-output",
    outputDir,
    pdfPath
  ];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(env.javaBin, args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr || `Audiveris failed with exit code ${code}`));
    });
  });

  const files = await fs.readdir(outputDir);
  const xmlFile = files.find((file) => file.endsWith(".mxl") || file.endsWith(".musicxml") || file.endsWith(".xml"));

  if (!xmlFile) {
    throw new Error("Audiveris completed without MusicXML output");
  }

  return fs.readFile(path.join(outputDir, xmlFile), "utf-8");
}

export async function convertPdfToMusicXml(pdfPath: string, outputDir: string) {
  if (env.audiverisJarPath) {
    try {
      const xml = await runAudiveris(pdfPath, outputDir);
      return {
        xml: normalizeOmrOutput(xml),
        engine: "audiveris"
      };
    } catch (error) {
      console.warn("Audiveris failed, using fallback sample.", error);
    }
  }

  const fallback = await fs.readFile(path.resolve(env.omrFallbackSample), "utf-8");
  return {
    xml: normalizeOmrOutput(fallback),
    engine: "fallback-sample"
  };
}
