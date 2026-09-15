/* oxlint-disable effecttsgo/node-builtin-import -- build tooling uses the Node-compatible filesystem. */
import solidPlugin from "@opentui/solid/bun-plugin";
import { rm } from "node:fs/promises";

await rm(`${import.meta.dir}/dist`, { force: true, recursive: true });
const builds = await Promise.all([
  Bun.build({
    entrypoints: [`${import.meta.dir}/src/core/index.ts`],
    format: "esm",
    outdir: `${import.meta.dir}/dist/core`,
    packages: "external",
    target: "node",
  }),
  Bun.build({
    entrypoints: [`${import.meta.dir}/src/solid/index.tsx`],
    format: "esm",
    outdir: `${import.meta.dir}/dist/solid`,
    packages: "external",
    plugins: [solidPlugin],
    target: "node",
  }),
]);

if (builds.some((result) => !result.success)) process.exit(1);
