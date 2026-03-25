import express from "express";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { createSocketServer } from "./rooms/CoworkingServer";

const port = Number(process.env.PORT) || 2567;
const app = express();
const httpServer = createServer(app);

// Socket.IO
createSocketServer(httpServer);

// Serve client build in production
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, "../../client/dist");

if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback — serve index.html for any non-file route
  app.get("/{*path}", (_req, res) => {
    res.sendFile(join(clientDist, "index.html"));
  });
  console.log(`📁 Serving client from ${clientDist}`);
}

httpServer.listen(port, () => {
  console.log(`🏢 Coco Working server listening on port ${port}`);
});
