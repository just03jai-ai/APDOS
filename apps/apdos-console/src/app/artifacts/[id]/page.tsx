import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/shell";
import { DetailList } from "@/components/console/detail-list";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { getArtifact } from "@/lib/platform/adapters";

export default async function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artifact = await getArtifact(id);

  if (!artifact) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={artifact.title} description={artifact.description} />
      <DetailList
        title="Artifact Metadata"
        items={[
          { label: "ID", value: artifact.id },
          { label: "Type", value: artifact.type },
          { label: "Status", value: <StatusBadge status={artifact.status} /> },
          { label: "Created By", value: artifact.createdBy },
          { label: "Source Agent", value: artifact.sourceAgent ?? "not recorded" },
          { label: "Source Skills", value: artifact.sourceSkillIds.length > 0 ? renderBadges(artifact.sourceSkillIds) : "No skill source recorded" },
          {
            label: "Parents",
            value: artifact.parentIds.length > 0
              ? artifact.parentIds.map((parentId) => (
                  <Link key={parentId} href={`/artifacts/${encodeURIComponent(parentId)}`} className="mr-2">
                    <Badge>{parentId}</Badge>
                  </Link>
                ))
              : "No parent artifacts"
          }
        ]}
      />
    </div>
  );
}

function renderBadges(values: string[]) {
  return <div className="flex flex-wrap gap-2">{values.map((value) => <Badge key={value}>{value}</Badge>)}</div>;
}
