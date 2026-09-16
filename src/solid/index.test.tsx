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
  const [width, height, viewport] = responsiveTui.useBreakpoint();
  // @ts-expect-error width-only names cannot be compared with height
  const widthNameComparedWithHeight = height() === "wide";
  // @ts-expect-error unconfigured height names cannot be compared
  const invalidHeightComparison = height() === "extra-tall";
  void widthNameComparedWithHeight;
  void invalidHeightComparison;
  viewport(["compact", "tall"]);
  width.below("wide");
  viewport.atMost(["compact", "tall"]);
  height.is("short");
  viewport.atLeast(["wide", "tall"]);
  height.above("short");
  // @ts-expect-error width-only names cannot be used for height comparisons
  height.atLeast("wide");
  // @ts-expect-error pair order is width then height
  viewport.above(["short", "wide"]);
  // @ts-expect-error both axis scales are required
  createResponsiveTui({ width: { compact: 0 } });
  // @ts-expect-error each axis scale must include zero
  createResponsiveTui({ width: { compact: 0 }, height: { short: 1 } });
  // @ts-expect-error pair order is width then height
  viewport(["short", "wide"]);
  // @ts-expect-error pairs require both axes
  viewport(["compact"]);
  // @ts-expect-error pairs contain exactly two axes
  viewport(["compact", "tall", "extra"]);
}

test("provides the initial breakpoint and updates it after a resize", async () => {
  const App = () => {
    const [width, height] = responsiveTui.useBreakpoint();
    return <text>{`${width()}/${height()}`}</text>;
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
    const [, , viewport] = responsiveTui.useBreakpoint();
    return <text>{`${viewport(["compact", "short"])}/${viewport(["wide", "tall"])}`}</text>;
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

test("reactively compares one-axis and two-axis breakpoint relations", async () => {
  const App = () => {
    const [width, , viewport] = responsiveTui.useBreakpoint();
    return (
      <text>
        {[
          viewport.below(["wide", "tall"]),
          viewport.atMost(["compact", "short"]),
          viewport.is(["compact", "short"]),
          width.atLeast("wide"),
          viewport.above(["compact", "short"]),
        ]
          .map((value) => Number(value))
          .join("/")}
      </text>
    );
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
    expect(setup.captureCharFrame()).toContain("1/1/1/0/0");

    setup.resize(40, 10);
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("0/0/0/1/1");
  } finally {
    setup.renderer.destroy();
  }
});

test("keeps children mounted when the breakpoint changes", async () => {
  let increment!: () => void;
  let mounts = 0;
  const Child = () => {
    const [width, height] = responsiveTui.useBreakpoint();
    const [count, setCount] = createSignal(0);
    mounts += 1;
    increment = () => setCount((value) => value + 1);
    return <text>{`${width()}/${height()}:${count()}`}</text>;
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
  expect(() => responsiveTui.useBreakpoint()).toThrow(ResponsiveTuiProviderError);
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
    const [width] = responsiveTui.useBreakpoint();
    const [otherWidth] = otherResponsiveTui.useBreakpoint();
    return <text>{`${width()}/${otherWidth()}`}</text>;
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
