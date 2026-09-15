export type BreakpointThreshold = {
  readonly width: number;
  readonly height: number;
};

export type BreakpointTiers = Readonly<Record<string, BreakpointThreshold>>;

export type BreakpointViewport = {
  readonly width: number;
  readonly height: number;
};

export type BreakpointMatch<Name extends string = string> = {
  readonly width: Name;
  readonly height: Name;
};

export type BreakpointDefinition<Tiers extends BreakpointTiers = BreakpointTiers> = {
  readonly match: (viewport: BreakpointViewport) => BreakpointMatch<BreakpointOf<Tiers>>;
};

export type BreakpointOf<Input> =
  Input extends BreakpointDefinition<infer Tiers>
    ? Extract<keyof Tiers, string>
    : Input extends BreakpointTiers
      ? Extract<keyof Input, string>
      : never;

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiConfigurationError extends Error {
  readonly _tag = "ResponsiveTuiConfigurationError";

  constructor(message: string) {
    super(message);
    this.name = this._tag;
  }
}

export const defineBreakpoints = <const Tiers extends BreakpointTiers>(
  tiers: keyof Tiers extends never ? never : Tiers,
): BreakpointDefinition<Tiers> => {
  const entries = validateTiers(tiers) as [BreakpointOf<Tiers>, BreakpointThreshold][];
  const [base, ...rest] = entries;
  if (!base) throw new ResponsiveTuiConfigurationError("Breakpoint definitions cannot be empty.");

  return {
    match: (viewport) => {
      let width = base[0];
      let height = base[0];

      for (const [name, threshold] of rest) {
        if (viewport.width >= threshold.width) width = name;
        if (viewport.height >= threshold.height) height = name;
      }

      return { width, height };
    },
  };
};

const validateTiers = (tiers: unknown): [string, BreakpointThreshold][] => {
  if (!isRecord(tiers) || Array.isArray(tiers)) {
    throw new ResponsiveTuiConfigurationError("Breakpoint definitions must be an object.");
  }

  const entries = Object.entries(tiers);
  if (entries.length === 0) {
    throw new ResponsiveTuiConfigurationError("Breakpoint definitions cannot be empty.");
  }

  let previousWidth = -1;
  let previousHeight = -1;
  for (const [index, [name, threshold]] of entries.entries()) {
    if (name.length === 0) {
      throw new ResponsiveTuiConfigurationError("Breakpoint names must be non-empty strings.");
    }
    if (!isRecord(threshold) || Array.isArray(threshold)) {
      throw new ResponsiveTuiConfigurationError("Breakpoint thresholds must be objects.");
    }

    const unknown = Object.keys(threshold).find((key) => key !== "width" && key !== "height");
    if (unknown) {
      throw new ResponsiveTuiConfigurationError(`Unknown breakpoint threshold: ${unknown}.`);
    }
    if (!isThreshold(threshold.width) || !isThreshold(threshold.height)) {
      throw new ResponsiveTuiConfigurationError(
        "Breakpoint thresholds must be finite non-negative integers.",
      );
    }
    if (index === 0 && (threshold.width !== 0 || threshold.height !== 0)) {
      throw new ResponsiveTuiConfigurationError(
        "The first breakpoint tier must have width and height thresholds of zero.",
      );
    }
    if (threshold.width <= previousWidth || threshold.height <= previousHeight) {
      throw new ResponsiveTuiConfigurationError(
        "Breakpoint width and height thresholds must strictly increase.",
      );
    }

    previousWidth = threshold.width;
    previousHeight = threshold.height;
  }

  return entries as [string, BreakpointThreshold][];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThreshold = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
