import { useTerminalDimensions } from "@opentui/solid";
import { createContext, createMemo, useContext, type ParentProps } from "solid-js";

import {
  createBreakpointDefinition,
  type BreakpointMatch,
  type BreakpointPair,
  type BreakpointScales,
} from "../core/index.js";

export { ResponsiveTuiConfigurationError } from "../core/index.js";

/** A reactive Solid accessor that reads or tests the current breakpoint pair. */
export type ResponsiveBreakpointAccessor<Scales extends BreakpointScales = BreakpointScales> = {
  (): BreakpointMatch<Scales>;
  (pair: BreakpointPair<Scales>): boolean;
};

/* oxlint-disable effecttsgo/extends-native-error */
/** Thrown when a responsive hook is used outside its generated Solid provider. */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useResponsiveTui must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

/** Creates a Solid provider and hook bound to one breakpoint definition. */
export const createResponsiveTui = <const Scales extends BreakpointScales>(
  scales: Scales & Record<Exclude<keyof Scales, "width" | "height">, never>,
) => {
  const breakpoints = createBreakpointDefinition(scales);
  const ResponsiveTuiContext = createContext<ResponsiveBreakpointAccessor<Scales>>();

  const ResponsiveTUI = (props: ParentProps) => {
    const dimensions = useTerminalDimensions();
    const current = createMemo(() => breakpoints.match(dimensions()));
    const breakpoint = ((pair?: BreakpointPair<Scales>) =>
      pair
        ? breakpoints.matches(dimensions(), pair)
        : current()) as ResponsiveBreakpointAccessor<Scales>;

    return ResponsiveTuiContext.Provider({
      get children() {
        return props.children;
      },
      value: breakpoint,
    });
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
