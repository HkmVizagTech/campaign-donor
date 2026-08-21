import { Donor } from "../models/Donor.js";
import { Campaign } from "../models/Campaign.js";
import { CampaignRecipient } from "../models/CampaignRecipient.js";
import { ImportBatch } from "../models/ImportBatch.js";
import { ResponseHistory } from "../models/ResponseHistory.js";
import { AuditLog } from "../models/AuditLog.js";
import { logger } from "../utils/logger.js";
import { emitAppEvent } from "../utils/events.js";

export async function resetAllData(adminId: string) {
  const [donorsDeleted, campaignsDeleted, recipientsDeleted, importBatchesDeleted, responseHistoryDeleted, auditLogsDeleted] =
    await Promise.all([
      Donor.countDocuments(),
      Campaign.countDocuments(),
      CampaignRecipient.countDocuments(),
      ImportBatch.countDocuments(),
      ResponseHistory.countDocuments(),
      AuditLog.countDocuments(),
    ]);

  // AdminUser is deliberately untouched — logins must survive a reset
  await Promise.all([
    Donor.deleteMany({}),
    Campaign.deleteMany({}),
    CampaignRecipient.deleteMany({}),
    ImportBatch.deleteMany({}),
    ResponseHistory.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  const summary = {
    donorsDeleted, campaignsDeleted, recipientsDeleted,
    importBatchesDeleted, responseHistoryDeleted, auditLogsDeleted,
  };

  // Written after the wipe so it's the one record that survives it
  await AuditLog.create({
    adminId,
    action: "data_reset",
    entity: "system",
    entityId: adminId,
    metadata: summary,
  });

  logger.warn("[Admin] Full data reset performed", { adminId, ...summary });
  emitAppEvent({});

  return summary;
}
