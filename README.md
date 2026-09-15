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
  sm: { width: 0, height: 0 },
  md: { width: 60, height: 12 },
  lg: { width: 100, height: 20 },
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

`useResponsiveTui()` returns a Solid accessor. Each axis is inferred as `"sm" | "md" | "lg"` and updates when that terminal dimension crosses a configured threshold. For example, a `120 x 10` terminal returns `{ width: "lg", height: "sm" }`.

## Tiers

Every tier defines inclusive minimum `width` and `height` thresholds in terminal cells. Width and height are matched independently to the highest satisfied tier, so wide and short terminals retain both classifications.

Tier names must be non-empty, non-numeric strings because JavaScript reorders integer object keys.

The first tier must start both axes at zero:

```ts
sm: { width: 0, height: 0 }
```

Both thresholds must strictly increase in declaration order:

```ts
md: { width: 60, height: 12 },
lg: { width: 100, height: 20 },
```

Thresholds must be finite non-negative integers. Invalid definitions throw `ResponsiveTuiConfigurationError` during configuration. Calling a generated hook outside its provider throws `ResponsiveTuiProviderError`.

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Core

The core definition has no framework dependencies and can match explicit dimensions directly:

```ts
const current = breakpoints.match({ width: 120, height: 10 });
// { width: "lg", height: "sm" }
```

Extract its inferred name union with `BreakpointOf`:

```ts
type Breakpoint = BreakpointOf<typeof breakpoints>;
```

## Packaging

The package is ESM-only. `@itsmeyaw/opentui-responsive/core` and `@itsmeyaw/opentui-responsive/solid` are separate package entrypoints, and the package is marked side-effect free so modern bundlers can remove unused exports. Importing `/core` does not load Solid or OpenTUI.
