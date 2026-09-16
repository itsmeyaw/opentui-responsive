import assert from "node:assert/strict";

import { createResponsiveTui, useRenderableDimensions } from "opentui-responsive/solid";

const responsive = createResponsiveTui({
  width: { narrow: 0, wide: 80 },
  height: { short: 0, tall: 24 },
});

assert.equal(typeof responsive.ResponsiveTUI, "function");
assert.equal(typeof responsive.useBreakpoint, "function");
assert.equal(typeof useRenderableDimensions, "function");
