import { useTerminalDimensions } from "@opentui/solid";
import { createContext, createMemo, useContext, type Accessor, type ParentProps } from "solid-js";

import type { BreakpointDefinition, BreakpointOf, BreakpointRules } from "../core/index.js";

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useResponsiveTui must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

export const createResponsiveTui = <const Rules extends BreakpointRules>(
  breakpoints: BreakpointDefinition<Rules>,
) => {
  const ResponsiveTuiContext = createContext<Accessor<BreakpointOf<Rules>>>();

  const ResponsiveTUI = (props: ParentProps) => {
    const dimensions = useTerminalDimensions();
    const breakpoint = createMemo(() => breakpoints.match(dimensions()));

    return ResponsiveTuiContext.Provider({
      get children() {
        return props.children;
      },
      value: breakpoint,
    });
  };

  const useResponsiveTui = (): Accessor<BreakpointOf<Rules>> => {
    const breakpoint = useContext(ResponsiveTuiContext);
    if (!breakpoint) {
      throw new ResponsiveTuiProviderError();
    }
    return breakpoint;
  };

  return { ResponsiveTUI, useResponsiveTui };
};
