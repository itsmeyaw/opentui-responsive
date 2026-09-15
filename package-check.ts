const exportTargets = [
  "dist/core/index.js",
  "dist/core/index.d.ts",
  "dist/solid/index.js",
  "dist/solid/index.d.ts",
] as const;

/* oxlint-disable effecttsgo/extends-native-error */
class PackageCheckError extends Error {
  readonly _tag = "PackageCheckError";

  constructor(message: string) {
    super(message);
    this.name = this._tag;
  }
}

for (const target of exportTargets) {
  if (!(await Bun.file(`${import.meta.dir}/${target}`).exists())) {
    throw new PackageCheckError(`Missing package export target: ${target}`);
  }
}

const coreBundle = await Bun.build({
  entrypoints: [`${import.meta.dir}/core-consumer.ts`],
  files: {
    [`${import.meta.dir}/core-consumer.ts`]: `
      import { defineBreakpoints } from "opentui-responsive/core";
      console.log(defineBreakpoints({ width: { standard: 0 }, height: { standard: 0 } }).match({ width: 80, height: 24 }));
    `,
  },
  minify: true,
  target: "node",
});
if (!coreBundle.success) throw new PackageCheckError("The core export could not be bundled.");

const bundledCore = await coreBundle.outputs[0]?.text();
if (!bundledCore || bundledCore.includes("solid-js") || bundledCore.includes("@opentui/solid")) {
  throw new PackageCheckError("The core export must not include Solid or OpenTUI.");
}
