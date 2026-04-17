# Contributing to equivault-mcp

Thanks for your interest in contributing. This guide covers the development workflow and conventions for this project.

## Quick start

```bash
git clone https://github.com/equivault/equivault-mcp.git
cd equivault-mcp
npm install
npm test
```

## Requirements

- Node.js ≥ 18
- An EquiVault API key (Professional tier or above) if you want to run the server end-to-end against the live API

## Project layout

```
src/
├── index.ts              # MCP server entry; registers all tool modules
├── client.ts             # Fetch-based EquiVault API client (get/post/put/delete)
├── errors.ts             # translateError + shared handleError
├── types.ts              # API response type definitions
└── tools/                # One module per tool category
    ├── companies.ts
    ├── financials.ts
    ├── profiles.ts       # 10 profile sections (registered from a single loop)
    ├── composite.ts      # analyze_company, company_deep_dive, morning_briefing, research_report
    └── …
tests/
├── client.test.ts
├── errors.test.ts
└── tools/<module>.test.ts
```

## Adding a new tool

1. Pick the right module (or create a new one if the tool doesn't fit an existing category).
2. **Add response types** to `src/types.ts` under a `// --- <Category> ---` divider.
3. **Write the failing test first** in `tests/tools/<module>.test.ts`. The `server.tool` mock extracts the handler via `args[args.length - 1]` — follow any existing test as a template.
4. **Implement** the tool in `src/tools/<module>.ts`. Every tool must:
   - Import `handleError` from `../errors.js` (never define a local copy).
   - Wrap the API call in try/catch and return `handleError(err)` on failure.
   - Use zod for `inputSchema`, with `.describe()` on every field.
5. **Register** the tool module in `src/index.ts` if it's a new module.
6. **Document** the tool in `README.md` under the appropriate "Tools" subsection.
7. **Update `CHANGELOG.md`** under `[Unreleased]`.

## Pattern for composite tools

Composite tools orchestrate multiple endpoints in parallel with graceful tier-gate degradation. Use `resolveOrGate<T>(promise)` from `src/tools/composite.ts`:

- On success → `{ available: true, data: T }`
- On `402` → `{ available: false, reason: string }`
- On any other error → rethrows

This means a tier-gated sub-section marks itself unavailable rather than failing the whole composite. Non-402 errors still bubble up and are turned into user-facing messages by `handleError`.

## Conventions

- **ESM imports:** Always use `.js` extension (e.g. `from "./client.js"`). TypeScript preserves these in the compiled output.
- **Logging:** Never use `console.log` — only `console.error`. Stdout is the JSON-RPC transport channel, any stray output corrupts the protocol. The eslint rule enforces this.
- **Error handling:** Business-logic errors go through `handleError(err)` (returns `isError: true` MCP response). Programming errors should throw — let the SDK surface them.
- **Commits:** Conventional commits style (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`).
- **PRs:** Keep each PR focused on one tool category or one refactor; a PR adding 3 unrelated tools should be 3 PRs.

## Testing

Run the full suite before opening a PR:

```bash
npm run typecheck   # must pass
npm run test        # must be 100% green (no skipped tests)
npm run build       # must produce an executable bin/index.js
```

Tests use vitest and mock both the MCP server and the HTTP client. We don't ship integration tests that hit the real EquiVault API — live-API validation is a manual step before releases.

## Releases

Releases are cut from the `main` branch:

1. Update `package.json` version (follow semver).
2. Move `[Unreleased]` items in `CHANGELOG.md` under a new version heading.
3. Commit: `chore: release vX.Y.Z — <summary>`.
4. Tag: `git tag vX.Y.Z && git push origin vX.Y.Z`.
5. The `Publish to npm` workflow runs automatically on tag push.

## Reporting issues

When reporting a bug, include:

- MCP client (Claude Desktop, Claude Code, other).
- Node version (`node --version`).
- `equivault-mcp` version.
- The tool name and arguments.
- Full error output (from `console.error` — enable MCP debug logging in your client).

## License

By contributing, you agree that your contributions are licensed under the MIT License (same as the project).
