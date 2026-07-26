import { z } from "zod";

export const wineStatusSchema = z.enum([
  "in_cellar",
  "chilling",
  "drunk",
  "gifted",
  "sold",
  "wishlist",
]);

export const tastingNotesSchema = z.object({
  nose: z.string().optional(),
  palate: z.string().optional(),
  finish: z.string().optional(),
});

export const wineBottleSchema = z.object({
  id: z.string(),
  legacyId: z.number().optional(),
  producer: z.string(),
  name: z.string(),
  vintage: z.union([z.number(), z.string()]).optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  vineyard: z.string().optional(),
  varietal: z.string().optional(),
  varietals: z.array(z.string()).optional(),
  style: z.string().optional(),
  alcohol: z.string().optional(),
  quantity: z.number().int().min(0),
  bottleSizeMl: z.number().int().positive().optional(),
  status: wineStatusSchema,
  legacyStatus: z.string().optional(),
  drinkWindow: z.string().optional(),
  drinkWindowText: z.string().optional(),
  estimatedPrice: z.string().optional(),
  purchase: z
    .object({
      priceUsd: z.number().optional(),
      date: z.string().optional(),
      store: z.string().optional(),
    })
    .optional(),
  location: z
    .object({
      area: z.string().optional(),
      slot: z.string().optional(),
    })
    .optional(),
  estimatedValueUsd: z.number().optional(),
  occasion: z.string().optional(),
  notes: z.string().optional(),
  tastingNotes: tastingNotesSchema.optional(),
  forCalAusWineLover: z.string().optional(),
  pairings: z.array(z.string()).optional(),
  agePotential: z.string().optional(),
  drunkDate: z.string().nullable().optional(),
  photos: z
    .object({
      frontLabel: z.string().optional(),
      backLabel: z.string().optional(),
    })
    .optional(),
  sourceReferences: z
    .array(
      z.object({
        source: z.string(),
        file: z.string().optional(),
        page: z.number().int().positive().optional(),
        matchedOn: z.string().optional(),
        note: z.string().optional(),
      }),
    )
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const wineCellarSchema = z.array(wineBottleSchema);

export const tastingEventSchema = z.object({
  id: z.string(),
  wineId: z.string(),
  date: z.string(),
  rating: z.number().optional(),
  notes: z.string().optional(),
  occasion: z.string().optional(),
  people: z.array(z.string()).optional(),
  wouldBuyAgain: z.boolean().optional(),
  consumedQuantity: z.number().optional(),
  createdAt: z.string(),
});

export const wishlistItemSchema = z.object({
  id: z.string(),
  producer: z.string().optional(),
  name: z.string(),
  vintage: z.union([z.number(), z.literal("NV")]).optional(),
  region: z.string().optional(),
  targetPriceUsd: z.number().optional(),
  source: z.string().optional(),
  reason: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WineStatus = z.infer<typeof wineStatusSchema>;
export type WineBottle = z.infer<typeof wineBottleSchema>;
export type TastingEvent = z.infer<typeof tastingEventSchema>;
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
