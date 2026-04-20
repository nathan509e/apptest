import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  port: Number.parseInt(process.env.BACKEND_PORT ?? "4000", 10),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  javaBin: process.env.JAVA_BIN ?? "java",
  audiverisJarPath: process.env.AUDIVERIS_JAR_PATH ?? "",
  omrFallbackSample: process.env.OMR_FALLBACK_SAMPLE ?? path.resolve(process.cwd(), "../examples/sample.musicxml")
};
