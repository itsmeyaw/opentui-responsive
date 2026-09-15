# @itsmeyaw/opentui-responsive

Typed responsive breakpoints for OpenTUI, with a framework-neutral core and a Solid adapter.

## Install

For OpenTUI Solid applications:

```sh
bun add @itsmeyaw/opentui-responsive @opentui/solid solid-js
```

Core-only consumers only need `@itsmeyaw/opentui-responsive`.

## Solid

Define ordered breakpoints once, then create a provider and hook bound to that definition:

```tsx
import { defineBreakpoints } from "@itsmeyaw/opentui-responsive/core";
import { createResponsiveTui } from "@itsmeyaw/opentui-responsive/solid";

const breakpoints = defineBreakpoints([
  {
    name: "compact",
    when: [{ maxWidth: 59 }, { maxHeight: 12 }],
  },
  {
    name: "wide",
    when: { minWidth: 100, minHeight: 16 },
  },
  { name: "standard" },
]);

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
  return <text>{breakpoint()}</text>;
}
```

`useResponsiveTui()` returns a Solid accessor. In this example, `breakpoint()` is inferred as `"compact" | "wide" | "standard"` and updates when the terminal crosses a configured breakpoint.

## Rules

Rules are checked from top to bottom, and the first match wins. The final rule has no `when` condition and is the required fallback.

Fields in one condition use AND semantics:

```ts
{ minWidth: 100, minHeight: 16 }
```

Conditions in an array use OR semantics:

```ts
[{ maxWidth: 59 }, { maxHeight: 12 }];
```

`minWidth`, `maxWidth`, `minHeight`, and `maxHeight` are inclusive terminal-cell bounds. Invalid definitions throw `ResponsiveTuiConfigurationError` during configuration. Calling a generated hook outside its provider throws `ResponsiveTuiProviderError`.

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Core

The core definition has no framework dependencies and can match explicit dimensions directly:

```ts
const current = breakpoints.match({ width: 80, height: 24 });
```

Extract its inferred name union with `BreakpointOf`:

```ts
type Breakpoint = BreakpointOf<typeof breakpoints>;
```

## Packaging

The package is ESM-only. `@itsmeyaw/opentui-responsive/core` and `@itsmeyaw/opentui-responsive/solid` are separate package entrypoints, and the package is marked side-effect free so modern bundlers can remove unused exports. Importing `/core` does not load Solid or OpenTUI.
