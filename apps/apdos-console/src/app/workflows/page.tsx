import { PageHeader } from "@/components/console/shell";
import { WorkflowsTable } from "@/components/tables/workflows-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPlatformSnapshot } from "@/lib/platform/adapters";

export default async function WorkflowsPage() {
  const snapshot = await getPlatformSnapshot();

  return (
    <div>
      <PageHeader title="Workflows" description="Delivery workflow instances sourced from the Workflow Engine adapter." />
      <Card>
        <CardHeader title="Workflow Explorer" description="Inspect stage progress, generated artifacts, agents, and skills." />
        <CardContent>
          <WorkflowsTable workflows={snapshot.workflows} />
        </CardContent>
      </Card>
    </div>
  );
}
