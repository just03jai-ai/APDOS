import { ArtifactLineageFlow } from "@/components/console/artifact-lineage-flow";
import { MetricGrid } from "@/components/console/metric-grid";
import { RuntimeMonitor } from "@/components/console/runtime-monitor";
import { StageList } from "@/components/console/stage-list";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/console/shell";
import { getPlatformSnapshot } from "@/lib/platform/adapters";

export default async function DashboardPage() {
  const snapshot = await getPlatformSnapshot();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Operational summary for APDOS workflows, agents, skills, approvals, and generated artifacts."
        action={<ButtonLink href={`/workflows/${encodeURIComponent(snapshot.workflow.id)}`}>Open Workflow</ButtonLink>}
      />
      <div className="space-y-6">
        <MetricGrid metrics={snapshot.metrics} />
        <RuntimeMonitor monitor={snapshot.runtimeMonitor} />
        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <StageList stages={snapshot.workflow.stages} />
          <Card>
            <CardHeader title="Artifact Lineage" description="Goal to implementation plan flow rendered from artifact parents." />
            <CardContent>
              <ArtifactLineageFlow nodes={snapshot.lineage.nodes} edges={snapshot.lineage.edges} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
