import { AgentRegistry } from "../registry/agent-registry.js";
import { INITIAL_AGENT_DEFINITIONS } from "./seed-agents.js";

export function createSeededAgentRegistry(): AgentRegistry {
  return new AgentRegistry(INITIAL_AGENT_DEFINITIONS);
}
