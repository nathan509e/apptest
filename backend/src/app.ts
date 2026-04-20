import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { scoreRoutes } from "./routes/scoreRoutes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.frontendUrl
    })
  );
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true
    });
  });

  app.use("/api/scores", scoreRoutes);

  app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({
      error: error.message || "Unexpected server error"
    });
  });

  return app;
}
