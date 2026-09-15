/* oxlint-disable effecttsgo/async-function */
import { testRender } from "@opentui/solid";
import { expect, test } from "bun:test";
import { createSignal } from "solid-js";

import {
  createResponsiveTui,
  ResponsiveTuiConfigurationError,
  ResponsiveTuiProviderError,
} from "./index.ts";

const responsiveTui = createResponsiveTui({
  width: { compact: 0, wide: 40 },
  height: { short: 0, tall: 10 },
});

if (Bun.env.TYPE_TESTS) {
  const breakpoint = responsiveTui.useResponsiveTui();
  // @ts-expect-error width-only names cannot be compared with height
  const widthNameComparedWithHeight = breakpoint().height === "wide";
  // @ts-expect-error unconfigured height names cannot be compared
  const invalidHeightComparison = breakpoint().height === "extra-tall";
  void widthNameComparedWithHeight;
  void invalidHeightComparison;
  breakpoint(["compact", "tall"]);
  // @ts-expect-error both axis scales are required
  createResponsiveTui({ width: { compact: 0 } });
  // @ts-expect-error each axis scale must include zero
  createResponsiveTui({ width: { compact: 0 }, height: { short: 1 } });
  // @ts-expect-error pair order is width then height
  breakpoint(["short", "wide"]);
  // @ts-expect-error pairs require both axes
  breakpoint(["compact"]);
  // @ts-expect-error pairs contain exactly two axes
  breakpoint(["compact", "tall", "extra"]);
}

test("provides the initial breakpoint and updates it after a resize", async () => {
  const App = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    return <text>{`${breakpoint().width}/${breakpoint().height}`}</text>;
  };
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
    expect(setup.captureCharFrame()).toContain("compact/short");

    setup.resize(40, 4);
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("wide/short");
  } finally {
    setup.renderer.destroy();
  }
});

test("reactively matches an exact width and height pair", async () => {
  const App = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    return <text>{`${breakpoint(["compact", "short"])}/${breakpoint(["wide", "tall"])}`}</text>;
  };
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
    expect(setup.captureCharFrame()).toContain("true/false");

    setup.resize(40, 10);
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("false/true");
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
    return <text>{`${breakpoint().width}/${breakpoint().height}:${count()}`}</text>;
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

    expect(setup.captureCharFrame()).toContain("wide/short:1");
    expect(mounts).toBe(1);
  } finally {
    setup.renderer.destroy();
  }
});

test("throws a typed error when used outside its provider", () => {
  expect(() => responsiveTui.useResponsiveTui()).toThrow(ResponsiveTuiProviderError);
});

test("rejects invalid breakpoint scales when the factory is created", () => {
  expect(() =>
    createResponsiveTui({ width: { compact: 0 }, height: { short: 1 } } as never),
  ).toThrow(ResponsiveTuiConfigurationError);
});

test("keeps contexts created by different factories isolated", async () => {
  const otherResponsiveTui = createResponsiveTui({
    width: { small: 0, large: 40 },
    height: { low: 0, high: 10 },
  });
  const App = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    const otherBreakpoint = otherResponsiveTui.useResponsiveTui();
    return <text>{`${breakpoint().width}/${otherBreakpoint().width}`}</text>;
  };
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
