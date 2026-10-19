const { z } = require("zod");

const purchasedItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().default("piece"),
  pricePaise: z.number().min(0),
  category: z.string().default("Other"),
});

const transactionSchema = z.object({
  shoppingListId: z.string().optional(),
  purchasedItems: z.array(purchasedItemSchema).min(1),
  finalBillAmountPaise: z.number().min(0),
  discountPaise: z.number().min(0).default(0),
  paymentMethod: z.enum(["Cash","UPI","Debit Card","Credit Card","Other"]),
  paymentStatus: z.enum(["Paid","Unpaid"]).default("Paid"),
  storeName: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  purchaseDate: z.string().min(1, "Purchase date is required"),
});

module.exports = { transactionSchema };
