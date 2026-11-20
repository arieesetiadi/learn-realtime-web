<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Token Efficiency

Optimize every turn for the smallest amount of context that still produces a correct change. Wasteful reads are the main cause of slow, expensive, error-prone sessions.

### Reading

- Search before you read. Use `grep`/`glob` to locate the exact symbol, route, or component, then read only the matching files. Do not read a directory "to get oriented" when a search answers the question.
- Read once. Never re-read a file, and never read a file whose content is already in context — including files you just wrote or edited.
- Read narrow. Prefer `read` with `offset`/`limit` on large files, and only the relevant range. Skip unrelated sections of files you do open.
- Never read generated or vendored paths: `node_modules/**`, `.next/**`, `package-lock.json`, `tsconfig.tsbuildinfo`, `public/**` assets.

### Next.js docs

- Read only the guide that matches the task, resolved from this directory: `node_modules/next/dist/docs/01-app/{01-getting-started,02-guides,03-api-reference}/<topic>.md`. Pick one file, not the tree.
- Reuse docs already in context across the session; do not re-fetch the same guide for a follow-up edit.
- Skip docs entirely for copy-only edits, styling tweaks, and changes that touch no Next.js API.

### Verification

- Run the narrowest check that covers the change: `npm test -- <file>` or `npm test -- -t "<name>"` for a single test, `npm run typecheck` or `npm run lint` for type/lint only. Do not run `npm run build` unless the change affects routing, server/client boundaries, or env config.
- Do not rerun a passing command unchanged. Rerun only the specific check affected by the latest edit.
- Do not write throwaway scripts, scratch files, or temporary test files to explore behavior. Use the existing test suite, or ask the user.

### Editing

- Use the `edit` tool for surgical changes. Rewrite a whole file only when creating it or when the content genuinely changes end to end.
- Match sibling files for structure, naming, and imports instead of asking the user or sampling several files.
- Do not modify files unrelated to the request.

### Output

- Do not restate file contents in the response, and do not narrate each tool call. State what changed and why.
- Prefer a short summary over a walkthrough. Include a diff or snippet only when the user needs to see exact text.
- Do not create documentation or summary files unless explicitly requested. Keep explanations in the conversation.
