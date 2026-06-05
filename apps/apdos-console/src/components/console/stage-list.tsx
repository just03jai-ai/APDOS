import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import type { ConsoleWorkflowStage } from "@/lib/platform/types";

export function StageList({ stages }: { stages: ConsoleWorkflowStage[] }) {
  return (
    <Card>
      <CardHeader title="Workflow Explorer" description="Stage status, assigned agent, executed skills, and generated artifacts." />
      <CardContent className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{stage.name}</h3>
                  <StatusBadge status={stage.status} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{stage.assignedAgent ?? "unassigned"}</div>
              </div>
              <Badge tone="info">{stage.artifactIds.length} artifacts</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Executed Skills</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stage.executedSkills.length > 0 ? (
                    stage.executedSkills.map((skill) => <Badge key={skill}>{skill}</Badge>)
                  ) : (
                    <span className="text-sm text-muted-foreground">No skill execution recorded</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground">Generated Artifacts</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stage.artifactIds.map((artifactId) => (
                    <Link key={artifactId} href={`/artifacts/${encodeURIComponent(artifactId)}`}>
                      <Badge tone="neutral">{artifactId}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
