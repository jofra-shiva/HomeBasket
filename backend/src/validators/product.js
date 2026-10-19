const { z } = require("zod");

const productSchema = z.object({
  name: z.string().min(1, "Product name is required").max(100),
  category: z.enum([
    "Maliga Saman","Vegetables","Oil","Eggs",
    "Dairy & Milk","Fruits","Snacks & Drinks","Cleaning & Household",
    "Meat & Seafood","Other",
    "Grains & Pulses","Dairy & Eggs","Oils & Condiments",
    "Snacks & Beverages","Cleaning & Hygiene","Personal Care","Bakery","Frozen Foods"
  ]),
  defaultQuantity: z.number().min(0).default(1),
  unit: z.string().default("kg"),
  estimatedPricePaise: z.number().min(0).default(0),
  notes: z.string().optional().default(""),
  isFavourite: z.boolean().optional().default(false),
});

module.exports = { productSchema };
