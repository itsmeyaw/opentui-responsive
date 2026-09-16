/** @jsxImportSource @opentui/react */
/* oxlint-disable effecttsgo/async-function */
import { testRender } from "@opentui/react/test-utils";
import type { BoxProps, TextProps } from "@opentui/react";
import { expect, test } from "bun:test";
import { act, createElement, useCallback, useState, type ComponentType } from "react";

import { useRenderableDimensions } from "./index.ts";

const Box = "box" as unknown as ComponentType<BoxProps>;
const Text = "text" as unknown as ComponentType<TextProps>;

if (Bun.env.TYPE_TESTS) {
  const [dimensions, dimensionsRef] = useRenderableDimensions();
  const measuredWidth: number | undefined = dimensions?.width;
  void measuredWidth;
  <box ref={dimensionsRef} />;
  dimensionsRef(null);
  // @ts-expect-error dimensions are unavailable before the first layout measurement
  const unguardedWidth: number = dimensions.width;
  // @ts-expect-error only layout renderables can be measured
  dimensionsRef({});
  void unguardedWidth;
}

test("measures a renderable after layout and updates with its local size", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let setWidth!: (width: number) => void;
  const App = () => {
    const [width, updateWidth] = useState(8);
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    setWidth = updateWidth;

    return createElement(
      Box,
      { height: 2, ref: measured[1], width },
      createElement(Text, null, dimensions?.width ?? "pending"),
    );
  };
  const setup = await testRender(createElement(App), { height: 4, width: 20 });

  try {
    expect(dimensions).toBeUndefined();

    await act(async () => Bun.sleep(0));
    await setup.renderOnce();
    await setup.flush();
    expect(dimensions).toEqual({ height: 2, width: 8 });
    expect(setup.captureCharFrame()).toContain("8");

    await act(async () => {
      setWidth(12);
    });
    await setup.renderOnce();
    await act(async () => Bun.sleep(0));
    await setup.renderOnce();
    await setup.flush();
    expect(dimensions).toEqual({ height: 2, width: 12 });
    expect(setup.captureCharFrame()).toContain("12");
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("measures without replacing onSizeChange and composes with another ref", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let setWidth!: (width: number) => void;
  let refCalls = 0;
  let sizeChanges = 0;
  const App = () => {
    const [width, updateWidth] = useState(7);
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    setWidth = updateWidth;
    const composedRef = useCallback(
      (renderable: Parameters<(typeof measured)[1]>[0]) => {
        refCalls += 1;
        return measured[1](renderable);
      },
      [measured[1]],
    );
    return createElement(Box, {
      ref: composedRef,
      height: 2,
      onSizeChange: () => {
        sizeChanges += 1;
      },
      width,
    });
  };
  const setup = await testRender(createElement(App), { height: 4, width: 20 });

  try {
    await act(async () => Bun.sleep(0));

    expect(dimensions).toEqual({ height: 2, width: 7 });
    expect(refCalls).toBe(1);

    await act(async () => {
      setWidth(8);
    });
    await setup.renderOnce();
    await act(async () => Bun.sleep(0));
    expect(dimensions).toEqual({ height: 2, width: 8 });
    expect(refCalls).toBe(1);
    expect(sizeChanges).toBe(1);
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("ignores stale cleanup after its renderable is replaced", async () => {
  type MeasurementTarget = NonNullable<
    Parameters<ReturnType<typeof useRenderableDimensions>[1]>[0]
  >;
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let dimensionsRef!: ReturnType<typeof useRenderableDimensions>[1];
  let first!: MeasurementTarget;
  let second!: MeasurementTarget;
  const App = () => {
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    dimensionsRef = measured[1];
    const firstRef = useCallback(
      (renderable: MeasurementTarget | null) => {
        if (!renderable) return;
        first = renderable;
        return dimensionsRef(renderable);
      },
      [dimensionsRef],
    );
    const secondRef = useCallback((renderable: MeasurementTarget | null) => {
      if (renderable) second = renderable;
    }, []);
    return createElement(
      Box,
      null,
      createElement(Box, {
        ref: firstRef,
        height: 1,
        width: 5,
      }),
      createElement(Box, {
        ref: secondRef,
        height: 1,
        width: 9,
      }),
    );
  };
  const setup = await testRender(createElement(App), { height: 4, width: 20 });

  try {
    await act(async () => Bun.sleep(0));

    let staleCleanup: void | (() => void);
    await act(async () => {
      staleCleanup = dimensionsRef(second);
      dimensionsRef(first);
      staleCleanup?.();
      await Bun.sleep(0);
    });

    expect(dimensions).toEqual({ height: 1, width: 5 });
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("resets dimensions when its renderable is replaced or removed", async () => {
  let dimensions!: ReturnType<typeof useRenderableDimensions>[0];
  let setTarget!: (target: "first" | "second" | "none") => void;
  const App = () => {
    const [target, updateTarget] = useState<"first" | "second" | "none">("first");
    const measured = useRenderableDimensions();
    dimensions = measured[0];
    setTarget = updateTarget;

    return createElement(
      Box,
      null,
      target === "first"
        ? createElement(Box, { key: "first", ref: measured[1], height: 1, width: 5 })
        : target === "second"
          ? createElement(Box, { key: "second", ref: measured[1], height: 2, width: 9 })
          : null,
    );
  };
  const setup = await testRender(createElement(App), { height: 4, width: 20 });

  try {
    await act(async () => Bun.sleep(0));

    await act(async () => {
      setTarget("second");
    });
    await act(async () => Bun.sleep(0));
    expect(dimensions).toEqual({ height: 2, width: 9 });

    await act(async () => {
      setTarget("none");
    });
    expect(dimensions).toBeUndefined();
  } finally {
    act(() => setup.renderer.destroy());
  }
});
