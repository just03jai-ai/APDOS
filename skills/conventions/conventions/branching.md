# Branching conventions

Prefer branch names that are lowercase, descriptive, and ticket-linked.

## Preferred patterns

- `feature/ENG-123-short-description`
- `fix/ENG-123-short-description`
- `hotfix/ENG-123-short-description`
- `chore/ENG-123-short-description`
- `refactor/ENG-123-short-description`
- `docs/ENG-123-short-description`

## Rules

- include the ticket when available
- keep the slug short and descriptive
- use lowercase and kebab-case in the descriptive part
- do not use spaces, underscores, or vague names like `temp` or `changes`

## Do

- enforce branch patterns in CI when branch discipline matters
- make the convention easy to copy and remember

## Don’t

- require complicated branch names that nobody can memorize
- accept generic names that create poor history and PR context

---

**Version**: 1.0.0
**Last Updated**: 2026-04-22
