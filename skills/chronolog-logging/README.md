# FarMart Chronolog Logging Skill

A comprehensive custom skill for implementing structured logging using FarMart's chronolog library with OpenTelemetry distributed tracing.

## Overview

This skill was created by analyzing best practices from popular logging skills and tailoring them specifically to FarMart's ecosystem:

- **chronolog library**: `/Users/mehtabsinghgill/farmart/chronolog`
- **Backend app**: `/Users/mehtabsinghgill/farmart/farmart-app-backend`
- **Frontend app**: `/Users/mehtabsinghgill/farmart/farmartos-frontend`

## What This Skill Provides

- ✅ Quick start examples for Express/Node.js and React applications
- ✅ Package-specific usage guides (core, express, react packages)
- ✅ Best practices for structured logging with chronolog
- ✅ Distributed tracing patterns for cross-service communication
- ✅ SQS trace context propagation examples
- ✅ Common logging patterns (middleware, database, background jobs)
- ✅ PII handling and security guidelines
- ✅ Environment-specific configurations
- ✅ Troubleshooting guide

## Skills Used as Reference

This custom skill incorporates best practices from these installed skills:

1. **logging-best-practices** (227 installs)
   - Structured logging with JSON formats
   - Log levels (DEBUG, INFO, WARN, ERROR)
   - Contextual logging
   - PII handling
   - Centralized logging

2. **application-logging** (204 installs)
   - Structured logging across applications
   - Log aggregation
   - Centralized analysis
   - Winston integration patterns

## Key Differences from Generic Logging Skills

This skill is specifically tailored for FarMart's chronolog library:

1. **Custom API**: Uses chronolog's specific API (`chronolog.info()`, `chronolog.error()`, etc.)
2. **OpenTelemetry Integration**: Includes distributed tracing with `withSpan()`, `getTraceContext()`, etc.
3. **SQS Context Propagation**: Specific helpers for AWS SQS message queue tracing
4. **Three Package Support**: Covers core, express, and react packages
5. **FarMart Patterns**: Examples use actual FarMart service names and patterns

## Installation

The skill is already initialized in this directory. To use it:

```bash
# Option 1: Add to git and install from GitHub
git add .
git commit -m "feat: Add FarMart chronolog logging skill"
git push
npx skills add <your-repo-url>

# Option 2: Install locally (for testing)
npx skills add file:./farmart-chronolog-logging
```

## Usage

Once installed, Claude Code will automatically use this skill when you:

- Ask about logging in FarMart applications
- Need help with distributed tracing
- Want to implement logging best practices
- Need examples of chronolog usage

Example prompts:

- "Help me add logging to this Express endpoint using chronolog"
- "How do I propagate trace context through SQS messages?"
- "Show me the best way to log errors with chronolog"
- "Set up distributed tracing between two services"

## File Structure

```
farmart-chronolog-logging/
├── SKILL.md          # Main skill instructions for Claude Code
└── README.md         # This file - documentation for humans
```

## Updating the Skill

To update the skill, edit `SKILL.md` and:

1. Update the content with new patterns or best practices
2. Increment the version number at the bottom
3. Update the "Last Updated" date
4. Commit and push changes if using git-based distribution

## Best Practices Incorporated

### From logging-best-practices skill:
- Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
- Include contextual information (userId, requestId, etc.)
- Redact sensitive data (PII, passwords, tokens)
- Use structured logging (JSON)
- Implement centralized logging
- Set up distributed tracing

### From application-logging skill:
- Structured JSON logging
- Request ID tracking
- Log rotation
- Timestamps in ISO 8601 format
- Filter sensitive data
- Centralized log aggregation

### Specific to FarMart chronolog:
- Initialize chronolog once at startup
- Use OpenTelemetry for distributed tracing
- Propagate trace context through SQS
- Use `withSpan()` for manual tracing
- Use `runWithSQSContext()` for fire-and-forget operations
- Include business event tracking with `event_track()`

## Examples Included

The skill includes 20+ code examples covering:

1. Basic setup (Express and React)
2. Log level usage
3. Error logging with context
4. Distributed tracing across services
5. SQS trace propagation (producer & consumer)
6. Manual span creation
7. Fire-and-forget patterns
8. API request logging
9. Event tracking
10. Express middleware logging
11. Database query logging
12. Background job logging
13. React component logging
14. Error boundary logging (React)
15. Environment-specific configuration

## References

- FarMart chronolog library: https://github.com/FarMart-Engineering/chronolog
- OpenTelemetry: https://opentelemetry.io/
- W3C Trace Context: https://www.w3.org/TR/trace-context/

## Maintenance

**Maintainer**: FarMart Engineering
**Version**: 1.0.0
**Created**: 2026-04-13
**Last Updated**: 2026-04-13

## Contributing

To contribute improvements:

1. Review the existing SKILL.md content
2. Add new patterns or best practices
3. Test with Claude Code
4. Update version and date
5. Submit changes via git

## License

This skill is part of the FarMart engineering toolkit and follows the same license as the chronolog library (ISC).
