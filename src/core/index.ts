export type BreakpointAxis = "width" | "height";

export type BreakpointScale = Readonly<Record<string, number>>;

export type BreakpointScales = {
  readonly width: BreakpointScale;
  readonly height: BreakpointScale;
};

export type BreakpointViewport = {
  readonly width: number;
  readonly height: number;
};

export type BreakpointMatch<Scales extends BreakpointScales = BreakpointScales> = {
  readonly [Axis in BreakpointAxis]: Extract<keyof Scales[Axis], string>;
};

export type BreakpointDefinition<Scales extends BreakpointScales = BreakpointScales> = {
  readonly match: (viewport: BreakpointViewport) => BreakpointMatch<Scales>;
};

export type BreakpointOf<Input, Axis extends BreakpointAxis> =
  Input extends BreakpointDefinition<infer Scales>
    ? Extract<keyof Scales[Axis], string>
    : Input extends BreakpointScales
      ? Extract<keyof Input[Axis], string>
      : never;

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiConfigurationError extends Error {
  readonly _tag = "ResponsiveTuiConfigurationError";

  constructor(message: string) {
    super(message);
    this.name = this._tag;
  }
}

export const defineBreakpoints = <const Scales extends BreakpointScales>(
  scales: Scales & Record<Exclude<keyof Scales, BreakpointAxis>, never>,
): BreakpointDefinition<Scales> => {
  const entries = validateScales(scales);

  return {
    match: (viewport) => ({
      width: matchScale<Extract<keyof Scales["width"], string>>(viewport.width, entries.width),
      height: matchScale<Extract<keyof Scales["height"], string>>(viewport.height, entries.height),
    }),
  };
};

type ScaleEntry = readonly [name: string, threshold: number];
type ValidatedScale = readonly [ScaleEntry, ...ScaleEntry[]];
type ValidatedScales = Readonly<Record<BreakpointAxis, ValidatedScale>>;

const breakpointAxes = ["width", "height"] as const;

const validateScales = (scales: unknown): ValidatedScales => {
  if (!isRecord(scales) || Array.isArray(scales)) {
    throw new ResponsiveTuiConfigurationError("Breakpoint definitions must be an object.");
  }

  const unknown = Object.keys(scales).find(
    (key) => !breakpointAxes.includes(key as BreakpointAxis),
  );
  if (unknown) {
    throw new ResponsiveTuiConfigurationError(`Unknown breakpoint axis: ${unknown}.`);
  }

  return {
    width: validateScale("width", scales.width),
    height: validateScale("height", scales.height),
  };
};

const validateScale = (axis: BreakpointAxis, scale: unknown): ValidatedScale => {
  if (!isRecord(scale) || Array.isArray(scale)) {
    throw new ResponsiveTuiConfigurationError(`Breakpoint ${axis} scale must be an object.`);
  }

  const entries = Object.entries(scale);
  if (entries.length === 0) {
    throw new ResponsiveTuiConfigurationError(`Breakpoint ${axis} scale cannot be empty.`);
  }

  const thresholds = new Set<number>();
  const validated: ScaleEntry[] = [];
  for (const [name, threshold] of entries) {
    if (name.length === 0) {
      throw new ResponsiveTuiConfigurationError("Breakpoint names must be non-empty strings.");
    }
    if (!isThreshold(threshold)) {
      throw new ResponsiveTuiConfigurationError(
        "Breakpoint thresholds must be finite non-negative integers.",
      );
    }
    if (thresholds.has(threshold)) {
      throw new ResponsiveTuiConfigurationError(`Breakpoint ${axis} thresholds must be unique.`);
    }
    thresholds.add(threshold);
    validated.push([name, threshold]);
  }

  if (!thresholds.has(0)) {
    throw new ResponsiveTuiConfigurationError(`Breakpoint ${axis} scale must include zero.`);
  }

  return validated.sort((left, right) => left[1] - right[1]) as unknown as ValidatedScale;
};

const matchScale = <Name extends string>(value: number, entries: ValidatedScale): Name => {
  let match = entries[0][0];
  for (const [name, threshold] of entries) {
    if (value < threshold) break;
    match = name;
  }
  return match as Name;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThreshold = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
