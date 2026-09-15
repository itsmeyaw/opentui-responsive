# @itsmeyaw/opentui-responsive

Typed responsive breakpoints for OpenTUI, with a framework-neutral core and a Solid adapter.

## Install

For OpenTUI Solid applications:

```sh
bun add @itsmeyaw/opentui-responsive @opentui/solid solid-js
```

Core-only consumers only need `@itsmeyaw/opentui-responsive`.

## Solid

Define mobile-first tiers once, then create a provider and hook bound to that definition:

```tsx
import { defineBreakpoints } from "@itsmeyaw/opentui-responsive/core";
import { createResponsiveTui } from "@itsmeyaw/opentui-responsive/solid";

const breakpoints = defineBreakpoints({
  width: {
    narrow: 0,
    medium: 60,
    wide: 100,
  },
  height: {
    short: 0,
    medium: 12,
    tall: 20,
  },
});

const { ResponsiveTUI, useResponsiveTui } = createResponsiveTui(breakpoints);

function App() {
  return (
    <ResponsiveTUI>
      <Content />
    </ResponsiveTUI>
  );
}

function Content() {
  const breakpoint = useResponsiveTui();
  return <text>{`${breakpoint().width}/${breakpoint().height}`}</text>;
}
```

`useResponsiveTui()` returns a Solid accessor. Each axis has its own inferred name union and updates when that terminal dimension crosses a configured threshold. In this example, width is `"narrow" | "medium" | "wide"`, height is `"short" | "medium" | "tall"`, and a `120 x 10` terminal returns `{ width: "wide", height: "short" }`.

Pass an exact `[width, height]` pair to check both axes reactively:

```ts
breakpoint(["narrow", "tall"]); // boolean
```

The pair must contain exactly one configured name for each axis, in width-then-height order.

TypeScript rejects names that are not configured for that axis:

```ts
breakpoint().height === "extra-tall";
// Type error: "extra-tall" is not a configured height breakpoint
```

## Tiers

Width and height define independent sets of inclusive minimum thresholds in terminal cells. Each axis is matched to its highest satisfied threshold, so the number and names of options can differ between axes.

Breakpoint names must be non-empty strings. Thresholds must be unique finite non-negative integers within their axis.

Each axis must include a zero threshold so every terminal dimension has a match:

```ts
width: { narrow: 0, medium: 60, wide: 100 },
height: { short: 0, medium: 12, tall: 20 },
```

Declaration order does not affect matching:

```ts
width: { wide: 100, narrow: 0, medium: 60 },
```

Invalid definitions throw `ResponsiveTuiConfigurationError` during configuration. Calling a generated hook outside its provider throws `ResponsiveTuiProviderError`.

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Core

The core definition has no framework dependencies and can match explicit dimensions directly:

```ts
const current = breakpoints.match({ width: 120, height: 10 });
// { width: "wide", height: "short" }

const exact = breakpoints.matches({ width: 120, height: 10 }, ["wide", "short"]);
// true
```

Extract an axis's inferred name union with `BreakpointOf`:

```ts
type WidthBreakpoint = BreakpointOf<typeof breakpoints, "width">;
type HeightBreakpoint = BreakpointOf<typeof breakpoints, "height">;
```

## Packaging

The package is ESM-only. `@itsmeyaw/opentui-responsive/core` and `@itsmeyaw/opentui-responsive/solid` are separate package entrypoints, and the package is marked side-effect free so modern bundlers can remove unused exports. Importing `/core` does not load Solid or OpenTUI.
