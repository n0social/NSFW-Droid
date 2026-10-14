import { db } from "@/db";
import { adminAuditLog } from "@/db/schema";

export async function logAdminAction(input: {
  action: string;
  actor?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) {
  await db.insert(adminAuditLog).values({
    action: input.action,
    actor: input.actor ?? "admin",
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? null,
    ip: input.ip ?? null,
  });
}
