import assert from "node:assert/strict";

import { defineBreakpoints } from "opentui-responsive/core";

const breakpoints = defineBreakpoints({
  width: { narrow: 0, wide: 80 },
  height: { short: 0, tall: 24 },
});

assert.deepEqual(breakpoints.match({ width: 100, height: 20 }), {
  width: "wide",
  height: "short",
});
assert.equal(breakpoints.matches({ width: 100, height: 20 }, ["wide", "short"]), true);
