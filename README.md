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

export const { ResponsiveTUI, useBreakpoint } = createResponsiveTui({
  // Required: each axis must include a 0 threshold.
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});

export function Layout(props: ParentProps) {
  return <ResponsiveTUI>{props.children}</ResponsiveTUI>;
}
```

`src/content.tsx`

```tsx
import { useBreakpoint } from "./layout.tsx";

export function Content() {
  const [width, height, viewport] = useBreakpoint();
  // Each accessor can be named for its local use.
  const isWideAndTall = viewport(["wide", "tall"]);
  const isMediumOrWider = width.atLeast("medium");
  const hasMediumViewport = viewport.atLeast(["medium", "medium"]);

  return (
    <box flexDirection={width() === "wide" ? "row" : "column"}>
      <text>{`${width()}/${height()}`}</text>
      <text>
        {isWideAndTall || (isMediumOrWider && hasMediumViewport) ? "Full layout" : "Compact layout"}
      </text>
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

`useBreakpoint()` updates when the terminal crosses a configured threshold. It returns `[width, height, viewport]`, letting each caller choose local names while keeping breakpoint names scoped to their axis. Width and height accept one breakpoint name; viewport accepts a `[width, height]` pair. Viewport pair comparisons return true only when both axes satisfy the relation.

```tsx
const [width, height, viewport] = useBreakpoint();

width.below("medium");
viewport.atMost(["medium", "tall"]);
height.only("short");
viewport.atLeast(["medium", "medium"]);
width.above("medium");

const [sidebarWidth] = useBreakpoint();
const [, , layoutViewport] = useBreakpoint();
```

Run `bun run demo` from the package directory to try the Solid example. Resize the terminal to see its layout respond.

The React adapter has the same factory, provider, hook, and inferred breakpoint types; import `createResponsiveTui` from `opentui-responsive/react` instead. Use `PropsWithChildren` for the layout's props.

## API Reference

### `opentui-responsive/solid` and `opentui-responsive/react`

| API                                    | Description                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| `createResponsiveTui(scales)`          | Validates the scales and creates a `ResponsiveTUI` provider and `useBreakpoint` hook. |
| `ResponsiveTUI`                        | Tracks terminal dimensions and provides the current breakpoint accessor.              |
| `useBreakpoint()`                      | Reads `[width, height, viewport]` from the nearest generated provider.                |
| `ResponsiveBreakpointAccessor`         | The readonly `[width, height, viewport]` accessor tuple.                              |
| `ResponsiveBreakpointAxisAccessor`     | Reads or compares one axis using that axis's breakpoint names.                        |
| `ResponsiveBreakpointViewportAccessor` | Reads or compares the complete viewport using `[width, height]` pairs.                |
| `ResponsiveTuiConfigurationError`      | Thrown when the supplied breakpoint scales are invalid.                               |
| `ResponsiveTuiProviderError`           | Thrown when the generated hook is called outside its provider.                        |

### `opentui-responsive/core`

For implementing another framework adapter, not application setup:

| API                                  | Description                                                                |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `createBreakpointDefinition(scales)` | Validates scales and creates `match` and `matches` helpers for an adapter. |
| `BreakpointDefinition`               | The typed breakpoint matcher returned by `createBreakpointDefinition`.     |
| `BreakpointScales`                   | The width and height scale configuration.                                  |
| `BreakpointMatch`                    | The matched breakpoint name for each axis.                                 |
| `BreakpointPair`                     | An exact breakpoint pair in width-then-height order.                       |
| `BreakpointRelationMatcher`          | Tests one axis or an AND-combined pair against a named relation.           |
| `ResponsiveTuiConfigurationError`    | Thrown when supplied breakpoint scales are invalid.                        |

## Breakpoint Behavior

Width and height use independent sets of inclusive minimum thresholds measured in terminal cells. A threshold is selected when the dimension is greater than or equal to it: for example, a width threshold of `60` matches at `width >= 60`. Each axis must contain a zero threshold so every terminal size has a match. Names must be non-empty, and thresholds must be unique finite non-negative integers within their axis.

Declaration order does not affect matching. Each axis selects its highest satisfied threshold.

Relation methods compare complete tiers rather than their raw threshold values. Given `width: { narrow: 0, medium: 60, wide: 100 }`, `width.atMost("medium")` matches widths from `0` through `99`.

| Method    | Tier relation |
| --------- | ------------- |
| `below`   | `<`           |
| `atMost`  | `<=`          |
| `only`    | `===`         |
| `atLeast` | `>=`          |
| `above`   | `>`           |

Width and height relation methods each accept a name from their own scale. Viewport relation methods accept `[width, height]` pairs and use AND semantics. Calling `viewport.only(["wide", "tall"])` is equivalent to calling `viewport(["wide", "tall"])`. The `/core` relation matchers retain `(viewport, axis, name)` and `(viewport, [width, height])` forms for adapter implementations.

Use breakpoints for discrete layout modes. Keep continuous measurements such as progress-bar width and available list height on OpenTUI's `useTerminalDimensions()`.

## Runtime Support

The package is ESM-only and supports Bun 1.3.0 or later and Node.js 26.4.0 or later. CommonJS `require()` is not supported.

The `/core` entrypoint is pure JavaScript and does not require native FFI. The `/react` and `/solid` entrypoints inherit OpenTUI's native runtime requirements; Node.js applications using an adapter must start with `node --experimental-ffi app.mjs`. Use Bun 1.4.0 or later on native Windows arm64.
