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

const core = await Bun.file(`${import.meta.dir}/dist/core/index.js`).text();
if (core.includes("solid-js") || core.includes("@opentui/solid")) {
  throw new PackageCheckError("The core export must not include Solid or OpenTUI.");
}
