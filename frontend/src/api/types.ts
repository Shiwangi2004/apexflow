import { z } from 'zod';

export const ProgramTypeSchema = z.enum(['CASH_REBATE', 'APR_OFFER', 'LOYALTY_BONUS']);
export type ProgramType = z.infer<typeof ProgramTypeSchema>;

export const ClaimStatusSchema = z.enum(['SUBMITTED', 'APPROVED', 'REJECTED']);
export type ClaimStatus = z.infer<typeof ClaimStatusSchema>;

export const ProgramSchema = z.object({
  id: z.number(),
  programCode: z.string(),
  name: z.string(),
  type: ProgramTypeSchema,
  vehicleModel: z.string().nullable().optional(),
  discountAmount: z.number().nullable().optional(),
  aprRate: z.number().nullable().optional(),
  termMonths: z.number().nullable().optional(),
  standardAprRate: z.number().nullable().optional(),
  stackable: z.boolean(),
  startDate: z.string(),
  endDate: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Program = z.infer<typeof ProgramSchema>;

export const CreateProgramInputSchema = z.object({
  programCode: z.string().min(2, "Code required").max(64),
  name: z.string().min(2, "Name required").max(128),
  type: ProgramTypeSchema,
  vehicleModel: z.string().max(64).optional(),
  discountAmount: z.number().nonnegative().optional(),
  aprRate: z.number().nonnegative().optional(),
  termMonths: z.number().positive().optional(),
  standardAprRate: z.number().default(6.50),
  stackable: z.boolean(),
  startDate: z.string(),
  endDate: z.string(),
});
export type CreateProgramInput = z.infer<typeof CreateProgramInputSchema>;

export const AppliedIncentiveSchema = z.object({
  programId: z.number(),
  programCode: z.string(),
  programName: z.string(),
  type: ProgramTypeSchema,
  calculatedSavings: z.number(),
  stackable: z.boolean(),
  explanation: z.string(),
});
export type AppliedIncentive = z.infer<typeof AppliedIncentiveSchema>;

export const QuoteResponseSchema = z.object({
  vin: z.string(),
  vehicleModel: z.string(),
  msrp: z.number(),
  totalIncentiveSavings: z.number(),
  netVehiclePrice: z.number(),
  appliedIncentives: z.array(AppliedIncentiveSchema),
});
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

export const QuoteInputSchema = z.object({
  vin: z.string().length(17, "VIN must be exactly 17 characters"),
  vehicleModel: z.string().min(1, "Model required"),
  msrp: z.number().positive("MSRP must be positive"),
  existingOwner: z.boolean(),
  quoteDate: z.string().optional(),
});
export type QuoteInput = z.infer<typeof QuoteInputSchema>;

export const ClaimSchema = z.object({
  id: z.number(),
  claimReference: z.string(),
  vin: z.string(),
  dealerId: z.string(),
  programId: z.number(),
  programCode: z.string().nullable().optional(),
  vehicleModel: z.string(),
  msrp: z.number(),
  claimedAmount: z.number(),
  approvedAmount: z.number().nullable().optional(),
  status: ClaimStatusSchema,
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const SubmitClaimInputSchema = z.object({
  vin: z.string().length(17, "VIN must be 17 characters"),
  dealerId: z.string().min(1, "Dealer ID required"),
  programId: z.number().positive(),
  vehicleModel: z.string().min(1),
  msrp: z.number().positive(),
  claimedAmount: z.number().positive(),
});
export type SubmitClaimInput = z.infer<typeof SubmitClaimInputSchema>;
