import { useTerminalDimensions } from "@opentui/solid";
import { createContext, createMemo, useContext, type Accessor, type ParentProps } from "solid-js";

import type {
  BreakpointDefinition,
  BreakpointMatch,
  BreakpointOf,
  BreakpointTiers,
} from "../core/index.js";

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiProviderError extends Error {
  readonly _tag = "ResponsiveTuiProviderError";

  constructor() {
    super("useResponsiveTui must be used within a ResponsiveTUI");
    this.name = this._tag;
  }
}

export const createResponsiveTui = <const Tiers extends BreakpointTiers>(
  breakpoints: BreakpointDefinition<Tiers>,
) => {
  type Match = BreakpointMatch<BreakpointOf<Tiers>>;
  const ResponsiveTuiContext = createContext<Accessor<Match>>();

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

  const useResponsiveTui = (): Accessor<Match> => {
    const breakpoint = useContext(ResponsiveTuiContext);
    if (!breakpoint) {
      throw new ResponsiveTuiProviderError();
    }
    return breakpoint;
  };

  return { ResponsiveTUI, useResponsiveTui };
};
