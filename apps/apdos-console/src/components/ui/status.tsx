import { Badge } from "./badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes("completed") || normalized.includes("available") || normalized.includes("approved")
      ? "success"
      : normalized.includes("pending") || normalized.includes("running")
        ? "warning"
        : normalized.includes("failed") || normalized.includes("blocked")
          ? "danger"
          : "neutral";

  return <Badge tone={tone}>{status}</Badge>;
}
