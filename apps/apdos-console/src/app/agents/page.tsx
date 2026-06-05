import { PageHeader } from "@/components/console/shell";
import { AgentsTable } from "@/components/tables/agents-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPlatformSnapshot } from "@/lib/platform/adapters";

export default async function AgentsPage() {
  const snapshot = await getPlatformSnapshot();

  return (
    <div>
      <PageHeader title="Agents" description="Registered APDOS agents with owned skills and generated artifacts." />
      <Card>
        <CardHeader title="Agent Explorer" description="Agent metadata, owned skills, inputs, outputs, and workflow contribution." />
        <CardContent>
          <AgentsTable agents={snapshot.agents} />
        </CardContent>
      </Card>
    </div>
  );
}
