import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/shell";
import { DetailList } from "@/components/console/detail-list";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { getSkill } from "@/lib/platform/adapters";

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = await getSkill(id);

  if (!skill) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={`${skill.name}@${skill.version}`} description={skill.description} />
      <DetailList
        title="Skill Metadata"
        items={[
          { label: "ID", value: skill.id },
          { label: "Status", value: <StatusBadge status={skill.status} /> },
          { label: "Category", value: skill.category },
          { label: "Owner Agent", value: skill.ownerAgent ?? "unmapped" },
          { label: "Workflow Stage", value: skill.workflowStage ?? "unmapped" },
          { label: "Execution Order", value: skill.executionOrder ?? "unmapped" },
          { label: "Input Artifacts", value: renderBadges(skill.inputArtifacts) },
          { label: "Output Artifacts", value: renderBadges(skill.outputArtifacts) },
          { label: "Dependencies", value: skill.dependencies.length > 0 ? renderBadges(skill.dependencies) : "None" }
        ]}
      />
    </div>
  );
}

function renderBadges(values: string[]) {
  return <div className="flex flex-wrap gap-2">{values.map((value) => <Badge key={value}>{value}</Badge>)}</div>;
}
