"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { DataTable } from "./data-table";
import type { ConsoleAgent } from "@/lib/platform/types";

const columns: ColumnDef<ConsoleAgent>[] = [
  {
    accessorKey: "name",
    header: "Agent",
    cell: ({ row }) => (
      <Link className="font-medium text-primary" href={`/agents/${encodeURIComponent(row.original.id)}`}>
        {row.original.name}
      </Link>
    )
  },
  {
    accessorKey: "description",
    header: "Description"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: "Owned Skills",
    cell: ({ row }) => <Badge tone="info">{row.original.ownedSkills.length}</Badge>
  },
  {
    header: "Artifacts",
    cell: ({ row }) => <Badge tone="neutral">{row.original.generatedArtifacts.length}</Badge>
  }
];

export function AgentsTable({ agents }: { agents: ConsoleAgent[] }) {
  return <DataTable columns={columns} data={agents} />;
}
