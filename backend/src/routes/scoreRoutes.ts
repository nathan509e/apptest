import express from "express";
import multer from "multer";
import {
  createScoreFromPdf,
  getDownload,
  readMusicXml,
  transposeScore
} from "../services/scoreService.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024
  },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new Error("Only PDF uploads are allowed"));
      return;
    }

    callback(null, true);
  }
});

router.post("/upload", upload.single("file"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "PDF file is required" });
      return;
    }

    const result = await createScoreFromPdf(request.file);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:scoreId", async (request, response, next) => {
  try {
    const musicXml = await readMusicXml(request.params.scoreId);
    response.json({
      id: request.params.scoreId,
      musicXml
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:scoreId/transpose", async (request, response, next) => {
  try {
    const result = await transposeScore(request.params.scoreId, {
      semitones: request.body.semitones,
      fromKey: request.body.fromKey,
      toKey: request.body.toKey
    });

    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:scoreId/download/:format", async (request, response, next) => {
  try {
    const format = request.params.format as "musicxml" | "midi" | "pdf";

    if (!["musicxml", "midi", "pdf"].includes(format)) {
      response.status(400).json({ error: "Unsupported format" });
      return;
    }

    const file = await getDownload(request.params.scoreId, format);
    response.setHeader("Content-Type", file.mime);
    response.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    response.sendFile(file.path);
  } catch (error) {
    next(error);
  }
});

export { router as scoreRoutes };
