"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { DataTable } from "./data-table";
import type { ConsoleSkill } from "@/lib/platform/types";

const columns: ColumnDef<ConsoleSkill>[] = [
  {
    accessorKey: "name",
    header: "Skill",
    cell: ({ row }) => (
      <Link className="font-medium text-primary" href={`/skills/${encodeURIComponent(row.original.id)}`}>
        {row.original.name}@{row.original.version}
      </Link>
    )
  },
  {
    accessorKey: "category",
    header: "Category"
  },
  {
    accessorKey: "workflowStage",
    header: "Stage",
    cell: ({ row }) => row.original.workflowStage ?? "unmapped"
  },
  {
    accessorKey: "ownerAgent",
    header: "Owner"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: "Dependencies",
    cell: ({ row }) => <Badge>{row.original.dependencies.length}</Badge>
  }
];

export function SkillsTable({ skills }: { skills: ConsoleSkill[] }) {
  return <DataTable columns={columns} data={skills} />;
}
