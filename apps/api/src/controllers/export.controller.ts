import { Request, Response, NextFunction } from "express";
import * as exportService from "../services/export.service.js";

export async function exportCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const response = req.query.response as string | undefined;
    const format = (req.query.format as string) === "csv" ? "csv" : "xlsx";

    const { buffer, contentType, filename } = await exportService.exportCampaignData({
      campaignId: String(req.params.id),
      response,
      format,
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}
