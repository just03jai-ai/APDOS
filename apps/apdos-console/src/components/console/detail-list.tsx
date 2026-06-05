import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DetailList({
  title,
  description,
  items
}: {
  title: string;
  description?: string;
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-muted/30 p-4">
              <dt className="text-xs font-medium uppercase text-muted-foreground">{item.label}</dt>
              <dd className="mt-2 break-words text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
