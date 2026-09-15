import { useTerminalDimensions } from "@opentui/react";
import { createContext, createElement, useContext, type PropsWithChildren } from "react";

import type {
  BreakpointDefinition,
  BreakpointMatch,
  BreakpointPair,
  BreakpointScales,
} from "../core/index.js";

export type ResponsiveBreakpointAccessor<Scales extends BreakpointScales = BreakpointScales> = {
  (): BreakpointMatch<Scales>;
  (pair: BreakpointPair<Scales>): boolean;
};

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useResponsiveTui must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

export const createResponsiveTui = <const Scales extends BreakpointScales>(
  breakpoints: BreakpointDefinition<Scales>,
) => {
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

  const useResponsiveTui = (): ResponsiveBreakpointAccessor<Scales> => {
    const breakpoint = useContext(ResponsiveTuiContext);
    if (!breakpoint) {
      throw new ResponsiveTuiProviderError();
    }
    return breakpoint;
  };

  return { ResponsiveTUI, useResponsiveTui };
};
