import { Activity, Bot, Boxes, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { RuntimeMonitorSnapshot } from "@/lib/platform/types";

export function RuntimeMonitor({ monitor }: { monitor: RuntimeMonitorSnapshot }) {
  const items = [
    { label: "Active workflow", value: monitor.activeWorkflow, icon: Workflow },
    { label: "Active stage", value: monitor.activeStage, icon: Activity },
    { label: "Active agent", value: monitor.activeAgent, icon: Bot },
    { label: "Active skill", value: monitor.activeSkill, icon: Boxes }
  ];

  return (
    <Card>
      <CardHeader title="Runtime Monitor" description="Current execution focus from the APDOS mock platform adapter." />
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/35 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <item.icon className="h-4 w-4 text-primary" />
              {item.label}
            </div>
            <div className="mt-2 break-words text-sm font-semibold">{item.value}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
