<div align="center">
  <h1>opentui-responsive</h1>
  <p>
    <a href="https://www.npmjs.com/package/opentui-responsive"><img src="https://img.shields.io/npm/v/opentui-responsive" alt="npm version"></a>
    <a href="https://github.com/itsmeyaw/opentui-responsive/actions/workflows/ci.yml"><img src="https://github.com/itsmeyaw/opentui-responsive/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
    <a href="https://github.com/itsmeyaw/opentui-responsive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/opentui-responsive" alt="MIT license"></a>
  </p>
  <p>Typed responsive breakpoints for OpenTUI, with a framework-neutral core and React and Solid adapters.</p>
  <p align="center">
  <img src="https://raw.githubusercontent.com/itsmeyaw/opentui-responsive/main/docs/assets/demo.gif" alt="opentui-responsive terminal demo">
</p>
</div>

## Installation

For OpenTUI Solid applications:

```sh
bun add opentui-responsive @opentui/solid solid-js
# or
npm install opentui-responsive @opentui/solid solid-js
```

For OpenTUI React applications:

```sh
bun add opentui-responsive @opentui/react react
# or
npm install opentui-responsive @opentui/react react
```

Core-only consumers only need `opentui-responsive`.

## Usage

Define mobile-first tiers, then create a Solid provider and hook bound to that definition:

```tsx
import { defineBreakpoints } from "opentui-responsive/core";
import { createResponsiveTui } from "opentui-responsive/solid";

const breakpoints = defineBreakpoints({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});

const { ResponsiveTUI, useResponsiveTui } = createResponsiveTui(breakpoints);

function Content() {
  const breakpoint = useResponsiveTui();

  return (
    <box flexDirection={breakpoint().width === "wide" ? "row" : "column"}>
      <text>{`${breakpoint().width}/${breakpoint().height}`}</text>
      <text>{breakpoint(["wide", "tall"]) ? "Full layout" : "Compact layout"}</text>
    </box>
  );
}

function App() {
  return (
    <ResponsiveTUI>
      <Content />
    </ResponsiveTUI>
  );
}
```

`useResponsiveTui()` updates when the terminal crosses a configured threshold. Its accessor returns the current width and height names, or accepts an exact `[width, height]` pair and returns whether both axes match.

Run `bun run demo` from the package directory to try the Solid example. Resize the terminal to see its layout respond.

The React adapter has the same factory, provider, hook, and inferred breakpoint types; import `createResponsiveTui` from `opentui-responsive/react` instead.

## API Reference

### `opentui-responsive/core`

| API                                  | Description                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `defineBreakpoints(scales)`          | Validates width and height scales and returns typed `match` and `matches` functions. |
| `definition.match(viewport)`         | Returns the highest inclusive breakpoint reached on each axis.                       |
| `definition.matches(viewport, pair)` | Tests an exact `[width, height]` breakpoint pair.                                    |
| `BreakpointOf<Input, Axis>`          | Extracts the inferred breakpoint-name union for one axis.                            |
| `BreakpointAxis`                     | The `"width" \| "height"` axis union.                                                |
| `BreakpointScale`                    | A map of breakpoint names to minimum terminal-cell thresholds.                       |
| `BreakpointScales`                   | The width and height scale configuration.                                            |
| `BreakpointViewport`                 | Explicit width and height dimensions to match.                                       |
| `BreakpointMatch`                    | The matched breakpoint name for each axis.                                           |
| `BreakpointPair`                     | An exact breakpoint pair in width-then-height order.                                 |
| `BreakpointDefinition`               | The typed result of `defineBreakpoints`.                                             |
| `ResponsiveTuiConfigurationError`    | Thrown when breakpoint scales are invalid.                                           |

### `opentui-responsive/solid` and `opentui-responsive/react`

| API                               | Description                                                                        |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `createResponsiveTui(definition)` | Creates a framework-specific `ResponsiveTUI` provider and `useResponsiveTui` hook. |
| `ResponsiveTUI`                   | Tracks terminal dimensions and provides the current breakpoint accessor.           |
| `useResponsiveTui()`              | Reads the accessor from the nearest generated provider.                            |
| `ResponsiveBreakpointAccessor`    | Reads the current match or tests an exact breakpoint pair.                         |
| `ResponsiveTuiProviderError`      | Thrown when the generated hook is called outside its provider.                     |

## Breakpoint Behavior

Width and height use independent sets of inclusive minimum thresholds measured in terminal cells. Each axis must contain a zero threshold so every terminal size has a match. Names must be non-empty, and thresholds must be unique finite non-negative integers within their axis.

Declaration order does not affect matching. Each axis selects its highest satisfied threshold:

```ts
const breakpoints = defineBreakpoints({
  width: { wide: 100, narrow: 0, medium: 60 },
  height: { tall: 28, short: 0, medium: 16 },
});

breakpoints.match({ width: 120, height: 10 });
// { width: "wide", height: "short" }
```

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Runtime Support

The package is ESM-only and supports Bun 1.3.0 or later and Node.js 26.4.0 or later. CommonJS `require()` is not supported.

The `/core` entrypoint is pure JavaScript and does not require native FFI. The `/react` and `/solid` entrypoints inherit OpenTUI's native runtime requirements; Node.js applications using an adapter must start with `node --experimental-ffi app.mjs`. Use Bun 1.4.0 or later on native Windows arm64.
