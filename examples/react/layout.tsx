/** @jsxImportSource @opentui/react */

import type { PropsWithChildren } from "react";

import { createResponsiveTui } from "../../src/react/index.ts";

export const { ResponsiveTUI, useBreakpoint } = createResponsiveTui({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});

export function Layout(props: PropsWithChildren) {
  return <ResponsiveTUI>{props.children}</ResponsiveTUI>;
}
