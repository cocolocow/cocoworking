import { createServer } from "http";
import { createSocketServer } from "./rooms/CoworkingServer";

const port = Number(process.env.PORT) || 2567;
const httpServer = createServer();
createSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`🏢 Coco Working server listening on port ${port}`);
});
