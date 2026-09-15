/** A terminal dimension used to select a breakpoint. */
export type BreakpointAxis = "width" | "height";

/** Named inclusive minimum thresholds for one terminal dimension. */
export type BreakpointScale = Readonly<Record<string, number>>;

/** Independent breakpoint scales for terminal width and height. */
export type BreakpointScales = {
  readonly width: BreakpointScale;
  readonly height: BreakpointScale;
};

type BreakpointScalesIncludingZero<Scales extends BreakpointScales> = {
  readonly [Axis in BreakpointAxis]: 0 extends Scales[Axis][keyof Scales[Axis]]
    ? Scales[Axis]
    : never;
};

/** Terminal dimensions in cells. */
export type BreakpointViewport = {
  readonly width: number;
  readonly height: number;
};

/** The breakpoint name matched on each axis. */
export type BreakpointMatch<Scales extends BreakpointScales = BreakpointScales> = {
  readonly [Axis in BreakpointAxis]: Extract<keyof Scales[Axis], string>;
};

/** An exact breakpoint pair in width-then-height order. */
export type BreakpointPair<Scales extends BreakpointScales = BreakpointScales> = readonly [
  width: BreakpointMatch<Scales>["width"],
  height: BreakpointMatch<Scales>["height"],
];

/** Tests one axis or both axes against a named breakpoint relation. */
export type BreakpointRelationMatcher<Scales extends BreakpointScales = BreakpointScales> = {
  <Axis extends BreakpointAxis>(
    viewport: BreakpointViewport,
    axis: Axis,
    name: BreakpointMatch<Scales>[Axis],
  ): boolean;
  (viewport: BreakpointViewport, pair: BreakpointPair<Scales>): boolean;
};

/** A validated breakpoint matcher for framework adapter implementations. */
export type BreakpointDefinition<Scales extends BreakpointScales = BreakpointScales> = {
  readonly match: (viewport: BreakpointViewport) => BreakpointMatch<Scales>;
  readonly matches: (viewport: BreakpointViewport, pair: BreakpointPair<Scales>) => boolean;
  readonly below: BreakpointRelationMatcher<Scales>;
  readonly atMost: BreakpointRelationMatcher<Scales>;
  readonly only: BreakpointRelationMatcher<Scales>;
  readonly atLeast: BreakpointRelationMatcher<Scales>;
  readonly above: BreakpointRelationMatcher<Scales>;
};

/* oxlint-disable effecttsgo/extends-native-error */
/** Thrown when breakpoint scales cannot produce a valid definition. */
export class ResponsiveTuiConfigurationError extends Error {
  readonly _tag = "ResponsiveTuiConfigurationError";

  constructor(message: string) {
    super(message);
    this.name = this._tag;
  }
}

/** Creates a validated breakpoint matcher for the framework adapters. */
export const createBreakpointDefinition = <const Scales extends BreakpointScales>(
  scales: Scales &
    BreakpointScalesIncludingZero<Scales> &
    Record<Exclude<keyof Scales, BreakpointAxis>, never>,
): BreakpointDefinition<Scales> => {
  const entries = validateScales(scales);
  const match = (viewport: BreakpointViewport): BreakpointMatch<Scales> => ({
    width: matchScale<Extract<keyof Scales["width"], string>>(viewport.width, entries.width),
    height: matchScale<Extract<keyof Scales["height"], string>>(viewport.height, entries.height),
  });
  const below = createRelationMatcher<Scales>(entries, "below");
  const atMost = createRelationMatcher<Scales>(entries, "atMost");
  const only = createRelationMatcher<Scales>(entries, "only");
  const atLeast = createRelationMatcher<Scales>(entries, "atLeast");
  const above = createRelationMatcher<Scales>(entries, "above");

  return {
    match,
    matches: (viewport, pair) => only(viewport, pair),
    below,
    atMost,
    only,
    atLeast,
    above,
  };
};

type ScaleEntry = readonly [name: string, threshold: number];
type ValidatedScale = readonly [ScaleEntry, ...ScaleEntry[]];
type ValidatedScales = Readonly<Record<BreakpointAxis, ValidatedScale>>;
type BreakpointRelation = "below" | "atMost" | "only" | "atLeast" | "above";

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
  return entries[matchScaleIndex(value, entries)]![0] as Name;
};

const matchScaleIndex = (value: number, entries: ValidatedScale): number => {
  let match = 0;
  for (let index = 1; index < entries.length; index += 1) {
    if (value < entries[index]![1]) break;
    match = index;
  }
  return match;
};

const createRelationMatcher = <Scales extends BreakpointScales>(
  entries: ValidatedScales,
  relation: BreakpointRelation,
): BreakpointRelationMatcher<Scales> =>
  ((
    viewport: BreakpointViewport,
    axisOrPair: BreakpointAxis | BreakpointPair<Scales>,
    name?: string,
  ) => {
    if (Array.isArray(axisOrPair)) {
      return (
        matchesRelation(viewport.width, entries.width, axisOrPair[0], relation) &&
        matchesRelation(viewport.height, entries.height, axisOrPair[1], relation)
      );
    }

    const axis = axisOrPair as BreakpointAxis;
    return matchesRelation(viewport[axis], entries[axis], name, relation);
  }) as BreakpointRelationMatcher<Scales>;

const matchesRelation = (
  value: number,
  entries: ValidatedScale,
  name: unknown,
  relation: BreakpointRelation,
): boolean => {
  const target = entries.findIndex(([entryName]) => entryName === name);
  if (target === -1) return false;

  const current = matchScaleIndex(value, entries);
  if (relation === "below") return current < target;
  if (relation === "atMost") return current <= target;
  if (relation === "only") return current === target;
  if (relation === "atLeast") return current >= target;
  return current > target;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThreshold = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
