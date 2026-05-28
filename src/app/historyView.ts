export const DEFAULT_HISTORY_LIMIT = 20;

export function statusLabel(status: string): string {
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  if (status === "skipped_duplicate") return "Duplicate";
  return "Pending";
}

export function statusClass(status: string): string {
  if (status === "sent") return "pill active";
  if (status === "failed") return "pill error";
  return "pill";
}
