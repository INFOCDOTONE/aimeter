import { z } from 'zod';
import { billingBasisSchema } from '../../pricing/billing.js';

export const windowKeySchema = z.enum(['today', '7d', '30d']);
export type WindowKey = z.infer<typeof windowKeySchema>;

export const costConfidenceSchema = z.enum(['high', 'medium', 'low']);
export type CostConfidence = z.infer<typeof costConfidenceSchema>;

export const billingUsageSchema = z
    .object({
        apiMeteredTokens: z.number().int().nonnegative(),
        subscriptionIncludedTokens: z.number().int().nonnegative(),
        unknownTokens: z.number().int().nonnegative(),
        apiMeteredCostUsdEstimated: z.number().nonnegative(),
        subscriptionIncludedCostUsdEstimated: z.number().nonnegative(),
        unknownCostUsdEstimated: z.number().nonnegative(),
    })
    .strict();
export type BillingUsage = z.infer<typeof billingUsageSchema>;

export const usageTotalsSchema = z
    .object({
        tokens: z.number().int().nonnegative(),
        inputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        cacheReadTokens: z.number().int().nonnegative(),
        cacheWriteTokens: z.number().int().nonnegative(),
        costUsdEstimated: z.number().nonnegative(),
        eventCount: z.number().int().nonnegative(),
        costConfidence: costConfidenceSchema,
        billing: billingUsageSchema,
    })
    .strict();
export type UsageTotals = z.infer<typeof usageTotalsSchema>;

export const dailyUsageSchema = z
    .object({
        date: z.string(),
        tokens: z.number().int().nonnegative(),
        costUsdEstimated: z.number().nonnegative(),
        eventCount: z.number().int().nonnegative(),
    })
    .strict();
export type DailyUsage = z.infer<typeof dailyUsageSchema>;

export const usageBreakdownSchema = usageTotalsSchema
    .extend({
        id: z.string().min(1),
        label: z.string().min(1),
        billingBasis: billingBasisSchema,
    })
    .strict();
export type UsageBreakdown = z.infer<typeof usageBreakdownSchema>;

export const usageSessionSchema = usageTotalsSchema
    .extend({
        sessionId: z.string().min(1),
        projectSlug: z.string().min(1),
        latestAt: z.string().datetime(),
        agents: z.array(z.string().min(1)),
        models: z.array(z.string().min(1)),
        billingBasis: billingBasisSchema,
    })
    .strict();
export type UsageSession = z.infer<typeof usageSessionSchema>;

export const doctorSeveritySchema = z.enum(['ok', 'warn', 'error']);
export type DoctorSeverity = z.infer<typeof doctorSeveritySchema>;

export const doctorCheckSchema = z
    .object({
        name: z.string().min(1),
        severity: doctorSeveritySchema,
        message: z.string().min(1),
    })
    .strict();
export type DoctorCheck = z.infer<typeof doctorCheckSchema>;

export const doctorResultSchema = z
    .object({
        generatedAt: z.string().datetime(),
        checks: z.array(doctorCheckSchema),
    })
    .strict();
export type DoctorResult = z.infer<typeof doctorResultSchema>;

export const windowDataPayloadSchema = z
    .object({
        window: windowKeySchema,
        from: z.string().datetime(),
        to: z.string().datetime(),
        generatedAt: z.string().datetime(),
        totals: usageTotalsSchema,
        daily: z.array(dailyUsageSchema),
        byAgent: z.array(usageBreakdownSchema),
        byModel: z.array(usageBreakdownSchema),
        recentSessions: z.array(usageSessionSchema),
        hasEvents: z.boolean(),
    })
    .strict();
export type WindowDataPayload = z.infer<typeof windowDataPayloadSchema>;

export const fromExtensionSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('window-data'), payload: windowDataPayloadSchema }).strict(),
    z.object({ type: z.literal('doctor-result'), payload: doctorResultSchema }).strict(),
    z.object({ type: z.literal('error'), message: z.string().min(1) }).strict(),
]);
export type WindowData = Extract<z.infer<typeof fromExtensionSchema>, { type: 'window-data' }>;
export type FromExtension = z.infer<typeof fromExtensionSchema>;

export const fromWebviewSchema = z.discriminatedUnion('type', [
    z
        .object({
            type: z.literal('request-window'),
            payload: z.object({ window: windowKeySchema }).strict(),
        })
        .strict(),
    z.object({ type: z.literal('export-csv') }).strict(),
    z.object({ type: z.literal('run-doctor') }).strict(),
    z.object({ type: z.literal('open-settings') }).strict(),
]);
export type FromWebview = z.infer<typeof fromWebviewSchema>;
