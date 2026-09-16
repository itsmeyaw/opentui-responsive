/* oxlint-disable effecttsgo/async-function */
import { testRender } from "@opentui/solid";
import { expect, test } from "bun:test";
import { createSignal } from "solid-js";

import {
  createResponsiveTui,
  ResponsiveTuiConfigurationError,
  ResponsiveTuiProviderError,
  useRenderableDimensions,
} from "./index.ts";

const responsiveTui = createResponsiveTui({
  width: { compact: 0, wide: 40 },
  height: { short: 0, tall: 10 },
});

if (Bun.env.TYPE_TESTS) {
  const [dimensions, dimensionsRef] = useRenderableDimensions();
  const measuredWidth: number | undefined = dimensions()?.width;
  void measuredWidth;
  <box ref={dimensionsRef} />;
  // @ts-expect-error dimensions are unavailable before the first layout measurement
  const unguardedWidth: number = dimensions().width;
  // @ts-expect-error only layout renderables can be measured
  dimensionsRef({});
  void unguardedWidth;

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

test("measures a renderable after layout and updates with its local size", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let setWidth!: (width: number) => void;
  const App = () => {
    const [width, updateWidth] = createSignal(8);
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    const ref = measured[1];
    setWidth = updateWidth;

    return (
      <box ref={ref} height={2} width={width()}>
        <text>{dimensions()?.width ?? "pending"}</text>
      </box>
    );
  };
  const setup = await testRender(() => <App />, { height: 4, width: 20 });

  try {
    expect(dimensions()).toBeUndefined();

    await setup.renderOnce();
    await setup.flush();
    expect(dimensions()).toEqual({ height: 2, width: 8 });
    expect(setup.captureCharFrame()).toContain("8");

    setWidth(12);
    await setup.waitFor(() => dimensions()?.width === 12);
    await setup.flush();
    expect(dimensions()).toEqual({ height: 2, width: 12 });
    expect(setup.captureCharFrame()).toContain("12");
  } finally {
    setup.renderer.destroy();
  }
});

test("measures without replacing the renderable onSizeChange handler", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let refCalls = 0;
  let sizeChanges = 0;
  const App = () => {
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    return (
      <box
        ref={(renderable) => {
          refCalls += 1;
          measured[1](renderable);
        }}
        height={2}
        onSizeChange={() => {
          sizeChanges += 1;
        }}
        width={7}
      />
    );
  };
  const setup = await testRender(() => <App />, { height: 4, width: 20 });

  try {
    await setup.renderOnce();
    await setup.waitFor(() => dimensions() !== undefined);

    expect(dimensions()).toEqual({ height: 2, width: 7 });
    expect(refCalls).toBe(1);
    expect(sizeChanges).toBe(1);
  } finally {
    setup.renderer.destroy();
  }
});

test("discards a queued measurement when the same renderable is reattached", async () => {
  type MeasurementTarget = Parameters<ReturnType<typeof useRenderableDimensions>[1]>[0];
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let dimensionsRef!: ReturnType<typeof useRenderableDimensions>[1];
  let first!: MeasurementTarget;
  let second!: MeasurementTarget;
  const App = () => {
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    dimensionsRef = measured[1];
    return (
      <box>
        <box
          ref={(renderable) => {
            first = renderable;
            dimensionsRef(renderable);
          }}
          height={1}
          width={5}
        />
        <box
          ref={(renderable) => {
            second = renderable;
          }}
          height={1}
          width={9}
        />
      </box>
    );
  };
  const setup = await testRender(() => <App />, { height: 4, width: 20 });

  try {
    await setup.renderOnce();
    await setup.waitFor(() => dimensions()?.width === 5);

    first.emit("resize");
    dimensionsRef(second);
    dimensionsRef(first);
    await Bun.sleep(0);

    expect(dimensions()).toBeUndefined();
  } finally {
    setup.renderer.destroy();
  }
});

test("resets dimensions when its renderable is replaced or destroyed", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let setTarget!: (target: "first" | "second" | "none") => void;
  const App = () => {
    const [target, updateTarget] = createSignal<"first" | "second" | "none">("first");
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    setTarget = updateTarget;

    return (
      <box>
        {target() === "first" ? (
          <box ref={measured[1]} height={1} width={5} />
        ) : target() === "second" ? (
          <box ref={measured[1]} height={2} width={9} />
        ) : null}
      </box>
    );
  };
  const setup = await testRender(() => <App />, { height: 4, width: 20 });

  try {
    await setup.renderOnce();
    await setup.waitFor(() => dimensions()?.width === 5);

    setTarget("second");
    expect(dimensions()).toBeUndefined();
    await setup.waitFor(() => dimensions()?.width === 9);
    expect(dimensions()).toEqual({ height: 2, width: 9 });

    setTarget("none");
    await setup.waitFor(() => dimensions() === undefined);
    expect(dimensions()).toBeUndefined();
  } finally {
    setup.renderer.destroy();
  }
});

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
