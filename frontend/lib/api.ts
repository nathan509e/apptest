import type { ScoreRecord, ScoreResponse } from "../types/score";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function uploadScore(file: File): Promise<ScoreResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/scores/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Falha ao converter o PDF. Verifique o arquivo e tente novamente.");
  }

  return response.json();
}

export async function transposeScore(scoreId: string, payload: { semitones?: number; fromKey?: string; toKey?: string }) {
  const response = await fetch(`${API_URL}/api/scores/${scoreId}/transpose`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel transpor a partitura.");
  }

  return (await response.json()) as ScoreRecord;
}

export function getDownloadUrl(scoreId: string, format: "musicxml" | "midi" | "pdf") {
  return `${API_URL}/api/scores/${scoreId}/download/${format}`;
}
