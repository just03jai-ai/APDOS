import { notFound } from "next/navigation";
import { PageHeader } from "@/components/console/shell";
import { StageList } from "@/components/console/stage-list";
import { DetailList } from "@/components/console/detail-list";
import { StatusBadge } from "@/components/ui/status";
import { getWorkflow } from "@/lib/platform/adapters";

export default async function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workflow = await getWorkflow(id);

  if (!workflow) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={workflow.id} description={workflow.goal} />
      <div className="space-y-6">
        <DetailList
          title="Workflow Metadata"
          items={[
            { label: "Status", value: <StatusBadge status={workflow.status} /> },
            { label: "Stages", value: workflow.stages.length },
            { label: "Generated Artifacts", value: workflow.stages.flatMap((stage) => stage.artifactIds).length },
            { label: "Executed Skills", value: workflow.stages.flatMap((stage) => stage.executedSkills).length }
          ]}
        />
        <StageList stages={workflow.stages} />
      </div>
    </div>
  );
}
