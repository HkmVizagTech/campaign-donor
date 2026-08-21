import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import { appEvents, AppEvent } from "../utils/events.js";

export function streamEvents(req: AuthRequest, res: Response): void {
  req.socket.setTimeout(0);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write("retry: 3000\n\n");

  const onUpdate = (event: AppEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
  appEvents.on("update", onUpdate);

  // Keep the connection alive through proxies that kill idle sockets
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    appEvents.off("update", onUpdate);
  });
}
