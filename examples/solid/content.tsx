import { useRenderableDimensions } from "../../src/solid/index.ts";

import { useBreakpoint } from "./layout.tsx";

export function Content() {
  const [width, height, viewport] = useBreakpoint();
  const [panelDimensions, panelRef] = useRenderableDimensions();
  const wideAndTall = () => viewport(["wide", "tall"]);
  const medium = ["medium", "medium"] as const;
  const panelSize = () => {
    const dimensions = panelDimensions();
    return dimensions ? `${dimensions.width}x${dimensions.height}` : "measuring";
  };

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <text fg="cyan">opentui-responsive</text>
      <text marginTop={1}>{`Current breakpoint: ${width()}/${height()}`}</text>
      <text fg="gray">Resize this terminal to update the layout.</text>
      <box
        border={true}
        flexDirection={width() === "wide" ? "row" : "column"}
        marginTop={1}
        paddingLeft={1}
        paddingRight={1}
        ref={panelRef}
      >
        <text flexGrow={1}>Width: {width()}</text>
        <text flexGrow={1}>Height: {height()}</text>
      </box>
      <text fg="gray">Measured panel: {panelSize()}</text>
      <text fg={wideAndTall() ? "green" : "yellow"} marginTop={1}>
        {wideAndTall()
          ? "Wide and tall layout active."
          : "Resize to wide and tall for the full layout."}
      </text>
      <text marginTop={1}>Relations to medium/medium:</text>
      <text>{`below: ${viewport.below(medium)}`}</text>
      <text>{`atMost: ${viewport.atMost(medium)}`}</text>
      <text>{`is: ${viewport.is(medium)}`}</text>
      <text>{`atLeast: ${viewport.atLeast(medium)}`}</text>
      <text>{`above: ${viewport.above(medium)}`}</text>
    </box>
  );
}
