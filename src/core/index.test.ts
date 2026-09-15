import { expect, test } from "bun:test";

import { ResponsiveTuiConfigurationError, defineBreakpoints, type BreakpointOf } from "./index.ts";

const breakpoints = defineBreakpoints({
  sm: { width: 0, height: 0 },
  md: { width: 60, height: 12 },
  lg: { width: 100, height: 20 },
});

type Name = BreakpointOf<typeof breakpoints>;
const name: Name = "sm";
void name;

if (Bun.env.TYPE_TESTS) {
  // @ts-expect-error every tier requires both dimensions
  defineBreakpoints({ sm: { width: 0 } });
  // @ts-expect-error breakpoint names stay literal
  const invalidName: Name = "xl";
  void invalidName;
}

test("matches the highest inclusive tier independently on each axis", () => {
  expect(breakpoints.match({ width: 0, height: 0 })).toEqual({ width: "sm", height: "sm" });
  expect(breakpoints.match({ width: 60, height: 12 })).toEqual({ width: "md", height: "md" });
  expect(breakpoints.match({ width: 120, height: 10 })).toEqual({ width: "lg", height: "sm" });
  expect(breakpoints.match({ width: 99, height: 20 })).toEqual({ width: "md", height: "lg" });
});

test("rejects invalid breakpoint configurations with a typed error", () => {
  const invalid = [
    {},
    { "": { width: 0, height: 0 } },
    { sm: { width: 1, height: 0 } },
    { sm: { width: 0, height: 1 } },
    { sm: { width: 0 } },
    { sm: { width: 0, height: 0, depth: 0 } },
    { sm: { width: -1, height: 0 } },
    { sm: { width: 0, height: 1.5 } },
    { sm: { width: Number.NaN, height: 0 } },
    { sm: { width: 0, height: Number.POSITIVE_INFINITY } },
    { sm: { width: 0, height: 0 }, md: { width: 0, height: 12 } },
    { sm: { width: 0, height: 0 }, md: { width: 60, height: 0 } },
    { sm: { width: 0, height: 0 }, md: { width: 60, height: 12 }, lg: { width: 40, height: 20 } },
  ];

  for (const tiers of invalid) {
    expect(() => defineBreakpoints(tiers as never)).toThrow(ResponsiveTuiConfigurationError);
    expect(() => defineBreakpoints(tiers as never)).toThrow(
      expect.objectContaining({ _tag: "ResponsiveTuiConfigurationError" }),
    );
  }
});
