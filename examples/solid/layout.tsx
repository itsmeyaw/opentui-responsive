import type { ParentProps } from "solid-js";

import { createResponsiveTui } from "../../src/solid/index.ts";

export const { ResponsiveTUI, useResponsiveTui } = createResponsiveTui({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});

export function Layout(props: ParentProps) {
  return <ResponsiveTUI>{props.children}</ResponsiveTUI>;
}
