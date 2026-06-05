"use client";

import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import type { ConsoleLineageEdge, ConsoleLineageNode } from "@/lib/platform/types";

export function ArtifactLineageFlow({
  nodes,
  edges
}: {
  nodes: ConsoleLineageNode[];
  edges: ConsoleLineageEdge[];
}) {
  const flowNodes: Node[] = nodes.map((node, index) => ({
    id: node.id,
    position: { x: index * 230, y: index % 2 === 0 ? 40 : 150 },
    data: {
      label: (
        <div className="min-w-44 rounded-lg border border-border bg-white px-4 py-3 text-left shadow-sm">
          <div className="text-xs font-medium uppercase text-muted-foreground">{node.type.replace(/_/g, " ")}</div>
          <div className="mt-1 text-sm font-semibold">{node.label}</div>
        </div>
      )
    },
    type: "default"
  }));
  const flowEdges: Edge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
    style: { stroke: "#0f766e", strokeWidth: 2 }
  }));

  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-border bg-white">
      <ReactFlow nodes={flowNodes} edges={flowEdges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
