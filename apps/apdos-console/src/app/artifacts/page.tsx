import { ArtifactLineageFlow } from "@/components/console/artifact-lineage-flow";
import { PageHeader } from "@/components/console/shell";
import { ArtifactsTable } from "@/components/tables/artifacts-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPlatformSnapshot } from "@/lib/platform/adapters";

export default async function ArtifactsPage() {
  const snapshot = await getPlatformSnapshot();

  return (
    <div>
      <PageHeader title="Artifacts" description="Generated workflow artifacts and lineage from the Artifact Registry adapter." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Artifact Lineage" description="Goal, discovery, PRD, tech spec, and implementation plan relationships." />
          <CardContent>
            <ArtifactLineageFlow nodes={snapshot.lineage.nodes} edges={snapshot.lineage.edges} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Artifact Registry" description="Artifacts generated during the platform workflow run." />
          <CardContent>
            <ArtifactsTable artifacts={snapshot.artifacts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
