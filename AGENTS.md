# AGENTS.md

Use Bun for development and package tooling. The published ESM runs on both Bun and Node.js.

- Run `bun install` after checkout.
- Run `bun run check` before finishing a change.
- Keep `@opentui/solid` and `solid-js` external in published builds.
- Keep `/core` free of Solid, OpenTUI, and native FFI imports.
- Node.js support starts at 26.4.0 and `/solid` acceptance requires `--experimental-ffi`.
- Use Bun 1.4.0 or later on native Windows arm64.
