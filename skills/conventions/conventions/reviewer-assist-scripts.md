# Reviewer-assist scripts

These scripts are **suggestive, not blocking**. Their job is to help reviewers and authors spot when new code feels too different from the surrounding codebase, especially when AI generated a large portion of the change.

## Why this matters

The goal is not to punish originality or detect plagiarism for its own sake.

The goal is to reduce reviewer friction by answering questions like:
- what existing file is this change most similar to?
- does this file look like a natural extension of the codebase?
- did AI produce something structurally valid but stylistically foreign?
- should this have reused an existing abstraction instead of creating a parallel one?

## Techniques used by code plagiarism and clone detectors

### 1. Text normalization
- strip comments
- normalize whitespace
- replace literals and strings
- lowercase where appropriate

Useful for catching exact and near-exact copies after superficial edits.

### 2. Token-based similarity
- tokenize source code
- build k-grams or shingles
- compare overlap

Common metrics:
- Jaccard similarity
- containment
- cosine similarity over token vectors

### 3. Fingerprinting and winnowing
- hash token windows
- keep a sparse set of representative fingerprints
- compare those fingerprints instead of the full token stream

This is the classic family behind tools like MOSS-style clone detection. It is more robust than raw text matching and often better than naive Jaccard over all shingles.

### 4. AST-based matching
- parse code into syntax trees
- compare tree shapes or normalized subtrees
- ignore variable renaming and formatting differences

Useful for detecting structural similarity even when surface syntax changes.

### 5. Program dependence / semantic approaches
- compare control flow
- compare data flow
- compare call structure or dependence graphs

Useful for higher-order clones where the code was rewritten but still does the same thing.

### 6. Embedding-based similarity
- embed code snippets into vector space
- compare semantic closeness with cosine similarity or nearest-neighbor search

Useful for suggestive ranking, but usually noisier and less deterministic than parser-based methods.

## Clone categories to know

Most clone-detection systems think in variations of these categories:
- **Type 1**: exact copy except whitespace/comments
- **Type 2**: renamed variables/literals but same structure
- **Type 3**: near-miss clones with inserted/removed lines
- **Type 4**: semantic clones that do the same thing with different structure

For reviewer-assist scripts, Type 2 and Type 3 are usually the sweet spot.

## Techniques used by tools like SonarQube

SonarQube is not just one algorithm. It combines several static-analysis techniques.

### 1. Rule-based static analysis
- parse source files
- apply language-specific rules
- flag bugs, code smells, maintainability issues, and insecure patterns

### 2. Semantic analysis
- build a symbol table and type model
- resolve identifiers, scope, and types
- reason about APIs and misuse patterns

### 3. Control-flow and data-flow analysis
- understand paths through the code
- reason about nullability, unreachable code, inconsistent returns, etc.

### 4. Taint analysis and security path analysis
- track untrusted input through the program
- identify flows into dangerous sinks
- useful for SQL injection, XSS, SSRF, command execution, and similar issues

### 5. Symbolic execution / path-sensitive checks
- reason about possible runtime states
- identify impossible branches, always-true conditions, or risky path combinations

### 6. Duplication detection
- token-based duplicate block detection
- often closer to clone detection than style analysis

### 7. Metrics and heuristics
- cognitive complexity
- cyclomatic complexity
- file size and method length
- nesting depth and maintainability heuristics

## What to use for AI-generated code consistency

For your use case, the best solution is **not** a strict plagiarism detector.

Instead, use a layered reviewer-assist approach:

### Layer 1: hard guardrails
- formatter
- linter
- runtime/tooling checks
- security checks

These remain blocking.

### Layer 2: clone and similarity hints
- nearest-neighbor file retrieval
- duplicate or near-clone detection
- staged-file similarity report

These should usually be non-blocking.

### Layer 3: style-drift analysis
- compare staged files to the nearest in-repo reference file
- prefer references from the same directory, feature area, or module subtree
- surface a few style deltas
- print suggestions instead of failing the push

## Good suggestive signals for AI-written code

### Structural similarity
- nearest same-extension reference file
- fingerprint overlap
- containment score
- path or module proximity so suggestions come from the most relevant neighborhood

### Style similarity
- quote preference
- semicolon usage
- import style
- function declaration vs arrow function preference
- average line length
- Python type-hint presence
- `logging` vs `print`
- docstring presence

### Codebase convention alignment
- naming style
- error-handling pattern
- logging pattern
- test idioms
- framework-specific conventions

## Recommended behavior

### Suggestive script
Use a script like:
- `suggest-staged-style-drift.mjs`

It should:
- find the nearest reference file in the repo
- prefer nearby files in the same directory subtree over distant matches elsewhere
- compute a few style metrics
- print a short report
- exit `0` by default

### Where to run it
- `pre-push` for small and medium repos
- CI comment/report for larger repos
- optionally as `pnpm run suggest:style-drift`

## What not to do

- do not block commits solely because code style differs from a nearby file
- do not treat similarity as proof of plagiarism
- do not rely on LLM embeddings alone for enforcement
- do not overwhelm authors with dozens of style metrics

## Best practical recommendation

Use three buckets:

### Blocking
- security
- lockfile/tooling drift
- format/lint

### Warning-level / suggestive
- near-clone detection
- staged-file similarity
- style-drift report against nearest reference file

### Reviewer-facing only
- larger architectural suggestions
- “this looks unlike neighboring modules” hints
- “consider reusing X instead of forking Y” hints

---

**Version**: 1.1.0
**Last Updated**: 2026-04-22
