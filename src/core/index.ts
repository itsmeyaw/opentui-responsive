export type BreakpointCondition = {
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly minHeight?: number;
  readonly maxHeight?: number;
};

export type BreakpointConditions =
  | BreakpointCondition
  | readonly [BreakpointCondition, ...BreakpointCondition[]];

export type BreakpointRule<Name extends string = string> = {
  readonly name: Name;
  readonly when: BreakpointConditions;
};

export type BreakpointFallbackRule<Name extends string = string> = {
  readonly name: Name;
  readonly when?: never;
};

export type BreakpointRules = readonly [...BreakpointRule[], BreakpointFallbackRule];

export type BreakpointViewport = {
  readonly width: number;
  readonly height: number;
};

export type BreakpointDefinition<Rules extends BreakpointRules = BreakpointRules> = {
  readonly match: (viewport: BreakpointViewport) => BreakpointOf<Rules>;
};

export type BreakpointOf<Input> =
  Input extends BreakpointDefinition<infer Rules>
    ? Rules[number]["name"]
    : Input extends BreakpointRules
      ? Input[number]["name"]
      : never;

/* oxlint-disable effecttsgo/extends-native-error */
export class ResponsiveTuiConfigurationError extends Error {
  readonly _tag = "ResponsiveTuiConfigurationError";

  constructor(message: string) {
    super(message);
    this.name = this._tag;
  }
}

export const defineBreakpoints = <const Rules extends BreakpointRules>(
  rules: Rules,
): BreakpointDefinition<Rules> => {
  validateRules(rules);

  return {
    match: (viewport) => {
      for (const rule of rules) {
        if (
          !("when" in rule) ||
          (rule.when !== undefined && matchesCondition(rule.when, viewport))
        ) {
          return rule.name as BreakpointOf<Rules>;
        }
      }

      throw new ResponsiveTuiConfigurationError("Breakpoint definitions require a fallback rule.");
    },
  };
};

const validateRules = (rules: readonly unknown[]): void => {
  if (rules.length === 0) {
    throw new ResponsiveTuiConfigurationError("Breakpoint definitions cannot be empty.");
  }

  const names = new Set<string>();
  for (const [index, rule] of rules.entries()) {
    if (!isRecord(rule) || typeof rule.name !== "string" || rule.name.length === 0) {
      throw new ResponsiveTuiConfigurationError("Breakpoint names must be non-empty strings.");
    }
    if (names.has(rule.name)) {
      throw new ResponsiveTuiConfigurationError(`Duplicate breakpoint name: ${rule.name}.`);
    }
    names.add(rule.name);

    const isFinal = index === rules.length - 1;
    if (isFinal ? "when" in rule : !("when" in rule)) {
      throw new ResponsiveTuiConfigurationError(
        isFinal
          ? "The final breakpoint rule must be a fallback without a condition."
          : "Every non-final breakpoint rule requires a condition.",
      );
    }
    if (!isFinal) {
      validateCondition(rule.when);
    }
  }
};

const validateCondition = (condition: unknown): void => {
  if (Array.isArray(condition)) {
    if (condition.length === 0) {
      throw new ResponsiveTuiConfigurationError("Breakpoint condition arrays cannot be empty.");
    }
    for (const item of condition) {
      validateConditionObject(item);
    }
    return;
  }

  validateConditionObject(condition);
};

const validateConditionObject = (condition: unknown): void => {
  if (!isRecord(condition)) {
    throw new ResponsiveTuiConfigurationError("Breakpoint conditions must be objects.");
  }

  if (!["minWidth", "maxWidth", "minHeight", "maxHeight"].some((key) => key in condition)) {
    throw new ResponsiveTuiConfigurationError(
      "Breakpoint conditions require at least one dimension bound.",
    );
  }

  const allowedBounds = new Set(["minWidth", "maxWidth", "minHeight", "maxHeight"]);
  const unknown = Object.keys(condition).find((key) => !allowedBounds.has(key));
  if (unknown) {
    throw new ResponsiveTuiConfigurationError(`Unknown breakpoint condition: ${unknown}.`);
  }

  validateBounds(condition, "minWidth", "maxWidth");
  validateBounds(condition, "minHeight", "maxHeight");
};

const validateBounds = (
  condition: Record<string, unknown>,
  minimum: "minWidth" | "minHeight",
  maximum: "maxWidth" | "maxHeight",
): void => {
  const min = condition[minimum];
  const max = condition[maximum];
  if (!isBound(min) || !isBound(max)) {
    throw new ResponsiveTuiConfigurationError(
      "Breakpoint bounds must be finite non-negative integers.",
    );
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new ResponsiveTuiConfigurationError(
      "Breakpoint minimum bounds cannot exceed maximum bounds.",
    );
  }
};

const matchesCondition = (
  condition: BreakpointConditions,
  viewport: BreakpointViewport,
): boolean => {
  if (Array.isArray(condition)) {
    return condition.some((item) => matchesConditionObject(item, viewport));
  }

  return matchesConditionObject(condition as BreakpointCondition, viewport);
};

const matchesConditionObject = (
  bounds: BreakpointCondition,
  viewport: BreakpointViewport,
): boolean =>
  (bounds.minWidth === undefined || viewport.width >= bounds.minWidth) &&
  (bounds.maxWidth === undefined || viewport.width <= bounds.maxWidth) &&
  (bounds.minHeight === undefined || viewport.height >= bounds.minHeight) &&
  (bounds.maxHeight === undefined || viewport.height <= bounds.maxHeight);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isBound = (value: unknown): value is number | undefined =>
  value === undefined ||
  (typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0);
