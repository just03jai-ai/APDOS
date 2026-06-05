import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@apdos/agent-registry",
    "@apdos/artifacts",
    "@apdos/delivery-workflow",
    "@apdos/skill-governance",
    "@apdos/skill-registry",
    "@apdos/workflow-engine"
  ]
};

export default nextConfig;
