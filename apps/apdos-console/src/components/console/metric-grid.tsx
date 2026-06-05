import { Card } from "@/components/ui/card";
import type { ConsoleMetric } from "@/lib/platform/types";

export function MetricGrid({ metrics }: { metrics: ConsoleMetric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="p-5">
          <div className="text-sm font-medium text-muted-foreground">{metric.label}</div>
          <div className="mt-3 text-3xl font-semibold">{metric.value}</div>
          <div className="mt-2 text-sm text-muted-foreground">{metric.detail}</div>
        </Card>
      ))}
    </div>
  );
}
