import { PageHeader } from "@/components/console/shell";
import { SkillsTable } from "@/components/tables/skills-table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPlatformSnapshot } from "@/lib/platform/adapters";

export default async function SkillsPage() {
  const snapshot = await getPlatformSnapshot();

  return (
    <div>
      <PageHeader title="Skills" description="Skill Registry entries enriched with Skill Governance ownership and workflow-stage metadata." />
      <Card>
        <CardHeader title="Skill Registry" description="Metadata, dependencies, workflow stage, owner agent, and artifact contracts." />
        <CardContent>
          <SkillsTable skills={snapshot.skills} />
        </CardContent>
      </Card>
    </div>
  );
}
