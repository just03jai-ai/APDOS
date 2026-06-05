"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status";
import { DataTable } from "./data-table";
import type { ConsoleArtifact } from "@/lib/platform/types";

const columns: ColumnDef<ConsoleArtifact>[] = [
  {
    accessorKey: "title",
    header: "Artifact",
    cell: ({ row }) => (
      <Link className="font-medium text-primary" href={`/artifacts/${encodeURIComponent(row.original.id)}`}>
        {row.original.title}
      </Link>
    )
  },
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "createdBy",
    header: "Created By"
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />
  },
  {
    header: "Source Skills",
    cell: ({ row }) => <Badge tone="info">{row.original.sourceSkillIds.length}</Badge>
  }
];

export function ArtifactsTable({ artifacts }: { artifacts: ConsoleArtifact[] }) {
  return <DataTable columns={columns} data={artifacts} />;
}
