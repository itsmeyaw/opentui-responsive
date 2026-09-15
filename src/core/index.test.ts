import { expect, test } from "bun:test";

import { ResponsiveTuiConfigurationError, defineBreakpoints, type BreakpointOf } from "./index.ts";

const breakpoints = defineBreakpoints({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 12, tall: 20 },
});

type WidthName = BreakpointOf<typeof breakpoints, "width">;
type HeightName = BreakpointOf<typeof breakpoints, "height">;
const widthName: WidthName = "wide";
const heightName: HeightName = "tall";
void widthName;
void heightName;

if (Bun.env.TYPE_TESTS) {
  // @ts-expect-error both axis scales are required
  defineBreakpoints({ width: { narrow: 0 } });
  defineBreakpoints({
    width: { narrow: 0 },
    height: { short: 0 },
    // @ts-expect-error unknown axes are rejected
    depth: { shallow: 0 },
  });
  // @ts-expect-error breakpoint names stay specific to their axis
  const invalidHeightName: HeightName = "wide";
  void invalidHeightName;
  const invalidHeightComparison =
    // @ts-expect-error unconfigured height names cannot be compared
    breakpoints.match({ width: 80, height: 12 }).height === "extra-tall";
  void invalidHeightComparison;
}

test("matches the highest inclusive tier independently on each axis", () => {
  expect(breakpoints.match({ width: 0, height: 0 })).toEqual({ width: "narrow", height: "short" });
  expect(breakpoints.match({ width: 60, height: 12 })).toEqual({
    width: "medium",
    height: "medium",
  });
  expect(breakpoints.match({ width: 120, height: 10 })).toEqual({
    width: "wide",
    height: "short",
  });
  expect(breakpoints.match({ width: 99, height: 20 })).toEqual({
    width: "medium",
    height: "tall",
  });
});

test("matches independently sized scales by threshold value rather than declaration order", () => {
  const unordered = defineBreakpoints({
    width: { wide: 100, narrow: 0, medium: 60 },
    height: { tall: 20, short: 0 },
  });

  expect(unordered.match({ width: 80, height: 24 })).toEqual({
    width: "medium",
    height: "tall",
  });
});

test("rejects invalid breakpoint configurations with a typed error", () => {
  const invalid = [
    {},
    { width: { narrow: 0 } },
    { height: { short: 0 } },
    { width: {}, height: { short: 0 } },
    { width: { narrow: 0 }, height: {} },
    { width: [], height: { short: 0 } },
    { width: { narrow: 0 }, height: "short" },
    { width: { "": 0 }, height: { short: 0 } },
    { width: { narrow: 1 }, height: { short: 0 } },
    { width: { narrow: 0 }, height: { short: 1 } },
    { width: { narrow: -1 }, height: { short: 0 } },
    { width: { narrow: 0 }, height: { short: 1.5 } },
    { width: { narrow: Number.NaN }, height: { short: 0 } },
    { width: { narrow: 0 }, height: { short: Number.POSITIVE_INFINITY } },
    { width: { narrow: 0, medium: 0 }, height: { short: 0 } },
    { width: { narrow: 0 }, height: { short: 0, medium: 0 } },
    { width: { narrow: 0 }, height: { short: 0 }, depth: { shallow: 0 } },
  ];

  for (const tiers of invalid) {
    expect(() => defineBreakpoints(tiers as never)).toThrow(ResponsiveTuiConfigurationError);
    expect(() => defineBreakpoints(tiers as never)).toThrow(
      expect.objectContaining({ _tag: "ResponsiveTuiConfigurationError" }),
    );
  }
});
