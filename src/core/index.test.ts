import { expect, test } from "bun:test";

import { createBreakpointDefinition, ResponsiveTuiConfigurationError } from "./index.ts";

const breakpoints = createBreakpointDefinition({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 12, tall: 20 },
});

type WidthName = ReturnType<typeof breakpoints.match>["width"];
type HeightName = ReturnType<typeof breakpoints.match>["height"];
const widthName: WidthName = "wide";
const heightName: HeightName = "tall";
void widthName;
void heightName;

if (Bun.env.TYPE_TESTS) {
  // @ts-expect-error both axis scales are required
  createBreakpointDefinition({ width: { narrow: 0 } });
  // @ts-expect-error width scale must include zero
  createBreakpointDefinition({ width: { narrow: 1 }, height: { short: 0 } });
  // @ts-expect-error height scale must include zero
  createBreakpointDefinition({ width: { narrow: 0 }, height: { short: 1 } });
  createBreakpointDefinition({
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
  breakpoints.matches({ width: 80, height: 12 }, ["narrow", "tall"]);
  // @ts-expect-error pair order is width then height
  breakpoints.matches({ width: 80, height: 12 }, ["short", "wide"]);
  // @ts-expect-error pairs require both axes
  breakpoints.matches({ width: 80, height: 12 }, ["narrow"]);
  // @ts-expect-error pairs contain exactly two axes
  breakpoints.matches({ width: 80, height: 12 }, ["narrow", "tall", "extra"]);
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

test("matches an exact width and height pair", () => {
  expect(breakpoints.matches({ width: 120, height: 20 }, ["wide", "tall"])).toBe(true);
  expect(breakpoints.matches({ width: 120, height: 20 }, ["medium", "tall"])).toBe(false);
  expect(breakpoints.matches({ width: 120, height: 20 }, ["wide", "medium"])).toBe(false);
});

test("matches independently sized scales by threshold value rather than declaration order", () => {
  const unordered = createBreakpointDefinition({
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
    expect(() => createBreakpointDefinition(tiers as never)).toThrow(
      ResponsiveTuiConfigurationError,
    );
    expect(() => createBreakpointDefinition(tiers as never)).toThrow(
      expect.objectContaining({ _tag: "ResponsiveTuiConfigurationError" }),
    );
  }
});
