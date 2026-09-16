import { useTerminalDimensions } from "@opentui/react";
import { createContext, createElement, useContext, type PropsWithChildren } from "react";

import {
  createBreakpointDefinition,
  type BreakpointAxis,
  type BreakpointMatch,
  type BreakpointPair,
  type BreakpointRelationMatcher,
  type BreakpointScales,
  type BreakpointViewport,
} from "../core/index.js";

export { ResponsiveTuiConfigurationError } from "../core/index.js";

/** A React breakpoint relation test for one axis. */
export type ResponsiveBreakpointAxisRelationMatcher<
  Scales extends BreakpointScales = BreakpointScales,
  Axis extends BreakpointAxis = BreakpointAxis,
> = {
  (name: BreakpointMatch<Scales>[Axis]): boolean;
};

/** A React accessor that reads or tests one breakpoint axis. */
export type ResponsiveBreakpointAxisAccessor<
  Scales extends BreakpointScales = BreakpointScales,
  Axis extends BreakpointAxis = BreakpointAxis,
> = {
  (): BreakpointMatch<Scales>[Axis];
  (name: BreakpointMatch<Scales>[Axis]): boolean;
  readonly below: ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;
  readonly atMost: ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;
  readonly only: ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;
  readonly atLeast: ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;
  readonly above: ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;
};

/** A React accessor that reads or tests the complete breakpoint viewport. */
export type ResponsiveBreakpointViewportAccessor<
  Scales extends BreakpointScales = BreakpointScales,
> = {
  (): BreakpointMatch<Scales>;
  (pair: BreakpointPair<Scales>): boolean;
  readonly below: (pair: BreakpointPair<Scales>) => boolean;
  readonly atMost: (pair: BreakpointPair<Scales>) => boolean;
  readonly only: (pair: BreakpointPair<Scales>) => boolean;
  readonly atLeast: (pair: BreakpointPair<Scales>) => boolean;
  readonly above: (pair: BreakpointPair<Scales>) => boolean;
};

/** React breakpoint accessors in width, height, then viewport order. */
export type ResponsiveBreakpointAccessor<Scales extends BreakpointScales = BreakpointScales> =
  readonly [
    width: ResponsiveBreakpointAxisAccessor<Scales, "width">,
    height: ResponsiveBreakpointAxisAccessor<Scales, "height">,
    viewport: ResponsiveBreakpointViewportAccessor<Scales>,
  ];

/* oxlint-disable effecttsgo/extends-native-error */
/** Thrown when a responsive hook is used outside its generated React provider. */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useBreakpoint must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

/** Creates a React provider and hook bound to one breakpoint definition. */
export const createResponsiveTui = <const Scales extends BreakpointScales>(
  scales: Parameters<typeof createBreakpointDefinition<Scales>>[0],
) => {
  const breakpoints = createBreakpointDefinition<Scales>(scales);
  const ResponsiveTuiContext = createContext<ResponsiveBreakpointAccessor<Scales> | undefined>(
    undefined,
  );

  const ResponsiveTUI = (props: PropsWithChildren) => {
    const dimensions = useTerminalDimensions();
    const width = bindAxisAccessor<Scales, "width">("width", () => dimensions, breakpoints);
    const height = bindAxisAccessor<Scales, "height">("height", () => dimensions, breakpoints);
    const viewport = Object.assign(
      (pair?: BreakpointPair<Scales>) =>
        pair ? breakpoints.matches(dimensions, pair) : breakpoints.match(dimensions),
      {
        below: bindViewportRelation<Scales>(() => dimensions, breakpoints.below),
        atMost: bindViewportRelation<Scales>(() => dimensions, breakpoints.atMost),
        only: bindViewportRelation<Scales>(() => dimensions, breakpoints.only),
        atLeast: bindViewportRelation<Scales>(() => dimensions, breakpoints.atLeast),
        above: bindViewportRelation<Scales>(() => dimensions, breakpoints.above),
      },
    ) as ResponsiveBreakpointViewportAccessor<Scales>;
    const breakpoint: ResponsiveBreakpointAccessor<Scales> = [width, height, viewport];

    return createElement(ResponsiveTuiContext.Provider, { value: breakpoint }, props.children);
  };

  const useBreakpoint = (): ResponsiveBreakpointAccessor<Scales> => {
    const breakpoint = useContext(ResponsiveTuiContext);
    if (!breakpoint) {
      throw new ResponsiveTuiProviderError();
    }
    return breakpoint;
  };

  return { ResponsiveTUI, useBreakpoint };
};

const bindAxisAccessor = <Scales extends BreakpointScales, Axis extends BreakpointAxis>(
  axis: Axis,
  viewport: () => BreakpointViewport,
  breakpoints: ReturnType<typeof createBreakpointDefinition<Scales>>,
): ResponsiveBreakpointAxisAccessor<Scales, Axis> =>
  Object.assign(
    (name?: BreakpointMatch<Scales>[Axis]) =>
      name === undefined
        ? breakpoints.match(viewport())[axis]
        : breakpoints.only(viewport(), axis, name),
    {
      below: bindAxisRelation<Scales, Axis>(axis, viewport, breakpoints.below),
      atMost: bindAxisRelation<Scales, Axis>(axis, viewport, breakpoints.atMost),
      only: bindAxisRelation<Scales, Axis>(axis, viewport, breakpoints.only),
      atLeast: bindAxisRelation<Scales, Axis>(axis, viewport, breakpoints.atLeast),
      above: bindAxisRelation<Scales, Axis>(axis, viewport, breakpoints.above),
    },
  ) as ResponsiveBreakpointAxisAccessor<Scales, Axis>;

const bindAxisRelation = <Scales extends BreakpointScales, Axis extends BreakpointAxis>(
  axis: Axis,
  viewport: () => BreakpointViewport,
  relation: BreakpointRelationMatcher<Scales>,
): ResponsiveBreakpointAxisRelationMatcher<Scales, Axis> =>
  ((name: BreakpointMatch<Scales>[Axis]) =>
    relation(viewport(), axis, name)) as ResponsiveBreakpointAxisRelationMatcher<Scales, Axis>;

const bindViewportRelation =
  <Scales extends BreakpointScales>(
    viewport: () => BreakpointViewport,
    relation: BreakpointRelationMatcher<Scales>,
  ): ((pair: BreakpointPair<Scales>) => boolean) =>
  (pair) =>
    relation(viewport(), pair);
