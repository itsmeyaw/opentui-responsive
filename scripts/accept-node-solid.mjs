import assert from "node:assert/strict";

import { defineBreakpoints } from "@itsmeyaw/opentui-responsive/core";
import { createResponsiveTui } from "@itsmeyaw/opentui-responsive/solid";

const responsive = createResponsiveTui(
  defineBreakpoints({
    width: { narrow: 0, wide: 80 },
    height: { short: 0, tall: 24 },
  }),
);

assert.equal(typeof responsive.ResponsiveTUI, "function");
assert.equal(typeof responsive.useResponsiveTui, "function");
