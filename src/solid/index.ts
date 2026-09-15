import { useTerminalDimensions } from "@opentui/solid";
import { createContext, createMemo, useContext, type ParentProps } from "solid-js";

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

/** A reactive Solid breakpoint relation test for one axis or both axes. */
export type ResponsiveBreakpointRelationMatcher<
  Scales extends BreakpointScales = BreakpointScales,
> = {
  <Axis extends BreakpointAxis>(axis: Axis, name: BreakpointMatch<Scales>[Axis]): boolean;
  (pair: BreakpointPair<Scales>): boolean;
};

/** A reactive Solid accessor that reads or tests the current breakpoint pair. */
export type ResponsiveBreakpointAccessor<Scales extends BreakpointScales = BreakpointScales> = {
  (): BreakpointMatch<Scales>;
  (pair: BreakpointPair<Scales>): boolean;
  readonly below: ResponsiveBreakpointRelationMatcher<Scales>;
  readonly atMost: ResponsiveBreakpointRelationMatcher<Scales>;
  readonly only: ResponsiveBreakpointRelationMatcher<Scales>;
  readonly atLeast: ResponsiveBreakpointRelationMatcher<Scales>;
  readonly above: ResponsiveBreakpointRelationMatcher<Scales>;
};

/* oxlint-disable effecttsgo/extends-native-error */
/** Thrown when a responsive hook is used outside its generated Solid provider. */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useBreakpoint must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

/** Creates a Solid provider and hook bound to one breakpoint definition. */
export const createResponsiveTui = <const Scales extends BreakpointScales>(
  scales: Parameters<typeof createBreakpointDefinition<Scales>>[0],
) => {
  const breakpoints = createBreakpointDefinition<Scales>(scales);
  const ResponsiveTuiContext = createContext<ResponsiveBreakpointAccessor<Scales>>();

  const ResponsiveTUI = (props: ParentProps) => {
    const dimensions = useTerminalDimensions();
    const current = createMemo(() => breakpoints.match(dimensions()));
    const bind = (relation: BreakpointRelationMatcher<Scales>) =>
      bindRelation<Scales>(dimensions, relation);
    const breakpoint = Object.assign(
      (pair?: BreakpointPair<Scales>) =>
        pair ? breakpoints.matches(dimensions(), pair) : current(),
      {
        below: bind(breakpoints.below),
        atMost: bind(breakpoints.atMost),
        only: bind(breakpoints.only),
        atLeast: bind(breakpoints.atLeast),
        above: bind(breakpoints.above),
      },
    ) as ResponsiveBreakpointAccessor<Scales>;

    return ResponsiveTuiContext.Provider({
      get children() {
        return props.children;
      },
      value: breakpoint,
    });
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

const bindRelation = <Scales extends BreakpointScales>(
  viewport: () => BreakpointViewport,
  relation: BreakpointRelationMatcher<Scales>,
): ResponsiveBreakpointRelationMatcher<Scales> =>
  ((axisOrPair: BreakpointAxis | BreakpointPair<Scales>, name?: string) => {
    if (typeof axisOrPair !== "string") {
      return relation(viewport(), axisOrPair);
    }
    return relation(viewport(), axisOrPair, name as BreakpointMatch<Scales>[typeof axisOrPair]);
  }) as ResponsiveBreakpointRelationMatcher<Scales>;
