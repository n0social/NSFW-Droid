import { getMaintenanceNotice } from "@/lib/maintenance-notice";

export async function MaintenanceNoticeBanner() {
  const notice = await getMaintenanceNotice();
  if (!notice.active || !notice.message) {
    return null;
  }

  const untilLabel = notice.until
    ? new Date(notice.until).toLocaleString("en-GB", {
        timeZone: "UTC",
        dateStyle: "medium",
        timeStyle: "short",
        timeZoneName: "short",
      })
    : null;

  return (
    <div
      role="status"
      className="border-b border-amber-500/40 bg-amber-950/90 px-4 py-2 text-center text-sm text-amber-100"
    >
      <p className="font-semibold">{notice.message}</p>
      {untilLabel ? (
        <p className="mt-0.5 text-xs text-amber-200/90">Notice active until {untilLabel}</p>
      ) : null}
    </div>
  );
}
