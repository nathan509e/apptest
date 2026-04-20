import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ROOT_DIR = path.join(os.tmpdir(), "scoreflow-studio");

export async function ensureTempRoot() {
  await fs.mkdir(ROOT_DIR, { recursive: true });
  return ROOT_DIR;
}

export async function createSessionDir() {
  await ensureTempRoot();
  const sessionDir = path.join(ROOT_DIR, randomUUID());
  await fs.mkdir(sessionDir, { recursive: true });
  return sessionDir;
}

export async function safeWriteFile(filePath: string, content: string | Uint8Array) {
  const resolved = path.resolve(filePath);
  const root = path.resolve(ROOT_DIR);

  if (!resolved.startsWith(root)) {
    throw new Error("Blocked write outside temp storage");
  }

  await fs.writeFile(resolved, content);
}
