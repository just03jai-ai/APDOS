"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./data-table";
import { StatusBadge } from "@/components/ui/status";
import type { ConsoleWorkflow } from "@/lib/platform/types";

const columns: ColumnDef<ConsoleWorkflow>[] = [
  {
    accessorKey: "id",
    header: "Workflow",
    cell: ({ row }) => (
      <Link className="font-medium text-primary" href={`/workflows/${encodeURIComponent(row.original.id)}`}>
        {row.original.id}
      </Link>
    )
  },
  {
    accessorKey: "goal",
    header: "Goal"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: "Stages",
    cell: ({ row }) => row.original.stages.length
  }
];

export function WorkflowsTable({ workflows }: { workflows: ConsoleWorkflow[] }) {
  return <DataTable columns={columns} data={workflows} />;
}
