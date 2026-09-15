/** @jsxImportSource @opentui/react */

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";

import { defineBreakpoints } from "../src/core/index.ts";
import { createResponsiveTui } from "../src/react/index.ts";

const breakpoints = defineBreakpoints({
  width: { narrow: 0, medium: 60, wide: 100 },
  height: { short: 0, medium: 16, tall: 28 },
});
const { ResponsiveTUI, useResponsiveTui } = createResponsiveTui(breakpoints);

function Content() {
  const breakpoint = useResponsiveTui();
  const current = breakpoint();
  const wideAndTall = breakpoint(["wide", "tall"]);

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
    </box>
  );
}

function App() {
  return (
    <ResponsiveTUI>
      <Content />
    </ResponsiveTUI>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<App />);
