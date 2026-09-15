/* oxlint-disable effecttsgo/async-function */
import { testRender } from "@opentui/solid";
import { expect, test } from "bun:test";
import { createSignal } from "solid-js";

import { defineBreakpoints } from "../core/index.ts";
import { createResponsiveTui, ResponsiveTuiProviderError } from "./index.tsx";

const responsiveTui = createResponsiveTui(
  defineBreakpoints([{ name: "compact", when: { maxWidth: 39 } }, { name: "wide" }]),
);

test("provides the initial breakpoint and updates it after a resize", async () => {
  const App = () => <text>{responsiveTui.useResponsiveTui()()}</text>;
  const setup = await testRender(
    () => (
      <responsiveTui.ResponsiveTUI>
        <App />
      </responsiveTui.ResponsiveTUI>
    ),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("compact");

    setup.resize(40, 4);
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("wide");
  } finally {
    setup.renderer.destroy();
  }
});

test("keeps children mounted when the breakpoint changes", async () => {
  let increment!: () => void;
  let mounts = 0;
  const Child = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    const [count, setCount] = createSignal(0);
    mounts += 1;
    increment = () => setCount((value) => value + 1);
    return <text>{`${breakpoint()}:${count()}`}</text>;
  };
  const setup = await testRender(
    () => (
      <responsiveTui.ResponsiveTUI>
        <Child />
      </responsiveTui.ResponsiveTUI>
    ),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    increment();
    await setup.renderOnce();
    setup.resize(40, 4);
    await setup.renderOnce();

    expect(setup.captureCharFrame()).toContain("wide:1");
    expect(mounts).toBe(1);
  } finally {
    setup.renderer.destroy();
  }
});

test("throws a typed error when used outside its provider", () => {
  expect(() => responsiveTui.useResponsiveTui()).toThrow(ResponsiveTuiProviderError);
});

test("keeps contexts created by different factories isolated", async () => {
  const otherResponsiveTui = createResponsiveTui(
    defineBreakpoints([{ name: "small", when: { maxWidth: 39 } }, { name: "large" }]),
  );
  const App = () => (
    <text>{`${responsiveTui.useResponsiveTui()()}/${otherResponsiveTui.useResponsiveTui()()}`}</text>
  );
  const setup = await testRender(
    () => (
      <responsiveTui.ResponsiveTUI>
        <otherResponsiveTui.ResponsiveTUI>
          <App />
        </otherResponsiveTui.ResponsiveTUI>
      </responsiveTui.ResponsiveTUI>
    ),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("compact/small");
  } finally {
    setup.renderer.destroy();
  }
});
