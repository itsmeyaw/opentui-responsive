import { expect, test } from "bun:test";

import { ResponsiveTuiConfigurationError, defineBreakpoints, type BreakpointOf } from "./index.ts";

const breakpoints = defineBreakpoints([
  { name: "compact", when: { maxWidth: 79 } },
  { name: "short", when: [{ maxHeight: 23 }, { maxWidth: 119, minHeight: 40 }] },
  { name: "default" },
] as const);

type Name = BreakpointOf<typeof breakpoints>;
const name: Name = "compact";
void name;

if (Bun.env.TYPE_TESTS) {
  // @ts-expect-error a non-final rule needs a condition
  defineBreakpoints([{ name: "compact" }, { name: "default" }] as const);
  // @ts-expect-error the final fallback cannot have a condition
  defineBreakpoints([{ name: "compact", when: {} }] as const);
  // @ts-expect-error a definition must end in a fallback rule
  defineBreakpoints([
    { name: "compact", when: {} },
    { name: "wide", when: {} },
  ] as const);
  // @ts-expect-error breakpoint names stay literal
  const invalidName: Name = "wide";
  void invalidName;
}

test("matches rules in order using inclusive bounds", () => {
  expect(breakpoints.match({ width: 79, height: 60 })).toBe("compact");
  expect(breakpoints.match({ width: 80, height: 23 })).toBe("short");
  expect(breakpoints.match({ width: 119, height: 40 })).toBe("short");
  expect(breakpoints.match({ width: 120, height: 40 })).toBe("default");
});

test("uses AND for object conditions and OR for condition arrays", () => {
  const definitions = defineBreakpoints([
    { name: "small", when: { maxWidth: 80, maxHeight: 24 } },
    { name: "either", when: [{ minWidth: 120 }, { minHeight: 40 }] },
    { name: "default" },
  ] as const);

  expect(definitions.match({ width: 80, height: 25 })).toBe("default");
  expect(definitions.match({ width: 120, height: 25 })).toBe("either");
  expect(definitions.match({ width: 100, height: 40 })).toBe("either");
});

test("rejects invalid breakpoint configurations with a typed error", () => {
  const invalid = [
    [],
    [{ name: "" }],
    [{ name: "same", when: {} }, { name: "same" }],
    [{ name: "first" }, { name: "last" }],
    [{ name: "only", when: {} }],
    [{ name: "empty", when: {} }, { name: "default" }],
    [{ name: "empty-or", when: [] }, { name: "default" }],
    [{ name: "fraction", when: { minWidth: 1.5 } }, { name: "default" }],
    [{ name: "negative", when: { maxHeight: -1 } }, { name: "default" }],
    [{ name: "nan", when: { minHeight: Number.NaN } }, { name: "default" }],
    [{ name: "infinite", when: { maxWidth: Number.POSITIVE_INFINITY } }, { name: "default" }],
    [{ name: "reversed", when: { minWidth: 10, maxWidth: 9 } }, { name: "default" }],
  ];

  for (const rules of invalid) {
    expect(() => defineBreakpoints(rules as never)).toThrow(ResponsiveTuiConfigurationError);
    expect(() => defineBreakpoints(rules as never)).toThrow(
      expect.objectContaining({ _tag: "ResponsiveTuiConfigurationError" }),
    );
  }
});
