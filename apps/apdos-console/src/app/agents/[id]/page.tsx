import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/shell";
import { DetailList } from "@/components/console/detail-list";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { getAgent } from "@/lib/platform/adapters";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={agent.name} description={agent.description} />
      <DetailList
        title="Agent Metadata"
        items={[
          { label: "ID", value: agent.id },
          { label: "Version", value: agent.version },
          { label: "Status", value: <StatusBadge status={agent.status} /> },
          { label: "Owned Skills", value: agent.ownedSkills.length },
          { label: "Input Artifacts", value: renderBadges(agent.inputArtifacts) },
          { label: "Output Artifacts", value: renderBadges(agent.outputArtifacts) },
          {
            label: "Generated Artifacts",
            value: agent.generatedArtifacts.length > 0
              ? agent.generatedArtifacts.map((artifactId) => (
                  <Link key={artifactId} href={`/artifacts/${encodeURIComponent(artifactId)}`} className="mr-2">
                    <Badge>{artifactId}</Badge>
                  </Link>
                ))
              : "No artifacts generated in current snapshot"
          },
          { label: "Skills", value: renderBadges(agent.ownedSkills) }
        ]}
      />
    </div>
  );
}

function renderBadges(values: string[]) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => <Badge key={`${value}:${index}`}>{value}</Badge>)}
    </div>
  );
}
