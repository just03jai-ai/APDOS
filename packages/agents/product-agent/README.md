# Product Agent

The Product Agent creates PRD artifacts by resolving Product-owned skills from Skill Governance and executing them through Skill Runtime.

It does not hardcode skill names. The default governance metadata maps the `prd` workflow stage to the Product Agent, and the agent executes that stage through the shared runtime skill executor.
