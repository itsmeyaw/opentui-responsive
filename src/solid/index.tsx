import { useTerminalDimensions } from "@opentui/solid";
import { Schema } from "effect";
import { createContext, createMemo, useContext, type Accessor, type ParentProps } from "solid-js";

import type { BreakpointDefinition, BreakpointOf, BreakpointRules } from "../core/index.ts";

export class ResponsiveTuiProviderError extends Schema.TaggedError<ResponsiveTuiProviderError>()(
  "ResponsiveTuiProviderError",
  { message: Schema.String },
) {}

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
      throw new ResponsiveTuiProviderError({
        message: "useResponsiveTui must be used within a ResponsiveTUI",
      });
    }
    return breakpoint;
  };

  return { ResponsiveTUI, useResponsiveTui };
};
