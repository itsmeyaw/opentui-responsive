import { useTerminalDimensions } from "@opentui/react";
import { createContext, createElement, useContext, type PropsWithChildren } from "react";

import {
  createBreakpointDefinition,
  type BreakpointMatch,
  type BreakpointPair,
  type BreakpointScales,
} from "../core/index.js";

export { ResponsiveTuiConfigurationError } from "../core/index.js";

/** A React accessor that reads or tests the current breakpoint pair. */
export type ResponsiveBreakpointAccessor<Scales extends BreakpointScales = BreakpointScales> = {
  (): BreakpointMatch<Scales>;
  (pair: BreakpointPair<Scales>): boolean;
};

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
    const breakpoint = ((pair?: BreakpointPair<Scales>) =>
      pair
        ? breakpoints.matches(dimensions, pair)
        : breakpoints.match(dimensions)) as ResponsiveBreakpointAccessor<Scales>;

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
