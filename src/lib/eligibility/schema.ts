import { z } from "zod";

// Zod 契約：規則模型（用於驗證 content 內嘅 ruleSet）。
export const OperatorSchema = z.enum([
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "not_in",
  "contains",
  "between",
  "exists",
  "not_exists",
  "before",
  "after",
]);

export const ConditionSchema = z.object({
  fact: z.string().min(1),
  op: OperatorSchema,
  value: z.unknown().optional(),
  labelZh: z.string().optional(),
  labelEn: z.string().optional(),
  sourceRef: z.string().optional(),
});

// RuleGroup 為遞迴結構 → z.lazy
export const RuleNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([ConditionSchema, RuleGroupSchema])
);

export const RuleGroupSchema: z.ZodType<unknown> = z.lazy(() =>
  z
    .object({
      all: z.array(RuleNodeSchema).optional(),
      any: z.array(RuleNodeSchema).optional(),
      none: z.array(RuleNodeSchema).optional(),
    })
    .refine((g) => g.all || g.any || g.none, {
      message: "RuleGroup must have at least one of all/any/none",
    })
);
