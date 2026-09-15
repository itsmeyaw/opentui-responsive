/* oxlint-disable effecttsgo/async-function */
import { testRender } from "@opentui/react/test-utils";
import { expect, spyOn, test } from "bun:test";
import {
  act,
  Component,
  createElement,
  useState,
  type ErrorInfo,
  type PropsWithChildren,
} from "react";

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
  createResponsiveTui({ width: { compact: 1 }, height: { short: 0 } });
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
    return createElement("text", null, `${breakpoint().width}/${breakpoint().height}`);
  };
  const setup = await testRender(
    createElement(responsiveTui.ResponsiveTUI, null, createElement(App)),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("compact/short");

    await act(async () => {
      setup.resize(40, 4);
      await setup.renderOnce();
    });
    expect(setup.captureCharFrame()).toContain("wide/short");
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("reactively matches an exact width and height pair", async () => {
  const App = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    return createElement(
      "text",
      null,
      `${breakpoint(["compact", "short"])}/${breakpoint(["wide", "tall"])}`,
    );
  };
  const setup = await testRender(
    createElement(responsiveTui.ResponsiveTUI, null, createElement(App)),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("true/false");

    await act(async () => {
      setup.resize(40, 10);
      await setup.renderOnce();
    });
    expect(setup.captureCharFrame()).toContain("false/true");
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("keeps child state when the breakpoint changes", async () => {
  let increment!: () => void;
  const Child = () => {
    const breakpoint = responsiveTui.useResponsiveTui();
    const [count, setCount] = useState(0);
    increment = () => setCount((value) => value + 1);
    return createElement("text", null, `${breakpoint().width}/${breakpoint().height}:${count}`);
  };
  const setup = await testRender(
    createElement(responsiveTui.ResponsiveTUI, null, createElement(Child)),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    await act(async () => {
      increment();
      await setup.renderOnce();
      setup.resize(40, 4);
      await setup.renderOnce();
    });

    expect(setup.captureCharFrame()).toContain("wide/short:1");
  } finally {
    act(() => setup.renderer.destroy());
  }
});

test("throws a typed error when used outside its provider", async () => {
  let caught: unknown;
  class ErrorBoundary extends Component<PropsWithChildren, { hasError: boolean }> {
    override state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    override componentDidCatch(error: unknown, _info: ErrorInfo) {
      caught = error;
    }

    override render() {
      return this.state.hasError ? null : this.props.children;
    }
  }
  const App = () => {
    responsiveTui.useResponsiveTui();
    return createElement("text", null, "unreachable");
  };
  const consoleError = spyOn(console, "error").mockImplementation(() => undefined);
  const setup = await testRender(createElement(ErrorBoundary, null, createElement(App)), {
    height: 4,
    width: 20,
  });

  try {
    expect(caught).toBeInstanceOf(ResponsiveTuiProviderError);
  } finally {
    act(() => setup.renderer.destroy());
    consoleError.mockRestore();
  }
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
    return createElement("text", null, `${breakpoint().width}/${otherBreakpoint().width}`);
  };
  const setup = await testRender(
    createElement(
      responsiveTui.ResponsiveTUI,
      null,
      createElement(otherResponsiveTui.ResponsiveTUI, null, createElement(App)),
    ),
    { height: 4, width: 20 },
  );

  try {
    await setup.renderOnce();
    expect(setup.captureCharFrame()).toContain("compact/small");
  } finally {
    act(() => setup.renderer.destroy());
  }
});
