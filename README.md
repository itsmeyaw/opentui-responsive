<div align="center">
  <h1>opentui-responsive</h1>
  <p>
    <a href="https://www.npmjs.com/package/opentui-responsive"><img src="https://img.shields.io/npm/v/opentui-responsive" alt="npm version"></a>
    <a href="https://github.com/itsmeyaw/opentui-responsive/actions/workflows/ci.yml"><img src="https://github.com/itsmeyaw/opentui-responsive/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
    <a href="https://github.com/itsmeyaw/opentui-responsive/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/opentui-responsive" alt="MIT license"></a>
  </p>
  <p>Typed responsive breakpoints for OpenTUI React and Solid applications.</p>
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

Framework adapter authors can use the framework-neutral `opentui-responsive/core` entrypoint.

## Usage

Create the responsive provider in your layout, then use its hook directly in child components:

`src/layout.tsx`

```tsx
import { createResponsiveTui } from "opentui-responsive/solid";
import type { ParentProps } from "solid-js";

export const { ResponsiveTUI, useResponsiveTui } = createResponsiveTui({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});

export function Layout(props: ParentProps) {
  return <ResponsiveTUI>{props.children}</ResponsiveTUI>;
}
```

`src/content.tsx`

```tsx
import { useResponsiveTui } from "./layout.tsx";

export function Content() {
  const breakpoint = useResponsiveTui();
  // You can use it to directly check [width, height] breakpoint
  const isWideAndTall = breakpoint(["wide", "tall"]);

  return (
    // Or you can get the current width and height breakpoint
    <box flexDirection={breakpoint().width === "wide" ? "row" : "column"}>
      <text>{`${breakpoint().width}/${breakpoint().height}`}</text>
      <text>{isWideAndTall ? "Full layout" : "Compact layout"}</text>
    </box>
  );
}
```

`src/app.tsx`

```tsx
import { Content } from "./content.tsx";
import { Layout } from "./layout.tsx";

export function App() {
  return (
    <Layout>
      <Content />
    </Layout>
  );
}
```

`useResponsiveTui()` updates when the terminal crosses a configured threshold. Its accessor returns the current width and height names, or accepts an exact `[width, height]` pair and returns whether both axes match.

Run `bun run demo` from the package directory to try the Solid example. Resize the terminal to see its layout respond.

The React adapter has the same factory, provider, hook, and inferred breakpoint types; import `createResponsiveTui` from `opentui-responsive/react` instead. Use `PropsWithChildren` for the layout's props.

## API Reference

### `opentui-responsive/solid` and `opentui-responsive/react`

| API                               | Description                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------- |
| `createResponsiveTui(scales)`     | Validates the scales and creates a `ResponsiveTUI` provider and `useResponsiveTui` hook. |
| `ResponsiveTUI`                   | Tracks terminal dimensions and provides the current breakpoint accessor.                 |
| `useResponsiveTui()`              | Reads the accessor from the nearest generated provider.                                  |
| `ResponsiveBreakpointAccessor`    | Reads the current match or tests an exact breakpoint pair.                               |
| `ResponsiveTuiConfigurationError` | Thrown when the supplied breakpoint scales are invalid.                                  |
| `ResponsiveTuiProviderError`      | Thrown when the generated hook is called outside its provider.                           |

### `opentui-responsive/core`

For implementing another framework adapter, not application setup:

| API                                  | Description                                                                |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `createBreakpointDefinition(scales)` | Validates scales and creates `match` and `matches` helpers for an adapter. |
| `BreakpointDefinition`               | The typed breakpoint matcher returned by `createBreakpointDefinition`.     |
| `BreakpointScales`                   | The width and height scale configuration.                                  |
| `BreakpointMatch`                    | The matched breakpoint name for each axis.                                 |
| `BreakpointPair`                     | An exact breakpoint pair in width-then-height order.                       |
| `ResponsiveTuiConfigurationError`    | Thrown when supplied breakpoint scales are invalid.                        |

## Breakpoint Behavior

Width and height use independent sets of inclusive minimum thresholds measured in terminal cells. Each axis must contain a zero threshold so every terminal size has a match. Names must be non-empty, and thresholds must be unique finite non-negative integers within their axis.

Declaration order does not affect matching. Each axis selects its highest satisfied threshold.

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Runtime Support

The package is ESM-only and supports Bun 1.3.0 or later and Node.js 26.4.0 or later. CommonJS `require()` is not supported.

The `/core` entrypoint is pure JavaScript and does not require native FFI. The `/react` and `/solid` entrypoints inherit OpenTUI's native runtime requirements; Node.js applications using an adapter must start with `node --experimental-ffi app.mjs`. Use Bun 1.4.0 or later on native Windows arm64.
