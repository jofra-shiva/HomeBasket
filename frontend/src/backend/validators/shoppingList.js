const { z } = require("zod");

const shoppingItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().default("piece"),
  estimatedPricePaise: z.number().min(0).default(0),
  status: z.enum(["pending","purchased","skipped"]).default("pending"),
  category: z.string().optional().default("Other"),
  notes: z.string().optional().default(""),
});

const shoppingListSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  shoppingDate: z.string().min(1, "Shopping date is required"),
  items: z.array(shoppingItemSchema).min(1, "At least one item required"),
  notes: z.string().optional().default(""),
  status: z.enum(["draft","shopping","completed","cancelled"]).optional().default("draft"),
});

module.exports = { shoppingListSchema };
