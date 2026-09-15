/** @jsxImportSource @opentui/react */

import { useBreakpoint } from "./layout.tsx";

export function Content() {
  const breakpoint = useBreakpoint();
  const current = breakpoint();
  const wideAndTall = breakpoint(["wide", "tall"]);
  const medium = ["medium", "medium"] as const;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <text fg="cyan">opentui-responsive</text>
      <text marginTop={1}>{`Current breakpoint: ${current.width}/${current.height}`}</text>
      <text fg="gray">Resize this terminal to update the layout.</text>
      <box
        border={true}
        flexDirection={current.width === "wide" ? "row" : "column"}
        marginTop={1}
        paddingLeft={1}
        paddingRight={1}
      >
        <text flexGrow={1}>Width: {current.width}</text>
        <text flexGrow={1}>Height: {current.height}</text>
      </box>
      <text fg={wideAndTall ? "green" : "yellow"} marginTop={1}>
        {wideAndTall
          ? "Wide and tall layout active."
          : "Resize to wide and tall for the full layout."}
      </text>
      <text marginTop={1}>Relations to medium/medium:</text>
      <text>{`below: ${breakpoint.below(medium)}`}</text>
      <text>{`atMost: ${breakpoint.atMost(medium)}`}</text>
      <text>{`only: ${breakpoint.only(medium)}`}</text>
      <text>{`atLeast: ${breakpoint.atLeast(medium)}`}</text>
      <text>{`above: ${breakpoint.above(medium)}`}</text>
    </box>
  );
}
