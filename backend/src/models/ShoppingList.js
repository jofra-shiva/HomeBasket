const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "piece" },
    estimatedPricePaise: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["pending", "purchased", "skipped"], default: "pending" },
    category: { type: String, default: "Other" },
    notes: { type: String, default: "" },
  },
  { _id: true }
);

const shoppingListSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    shoppingDate: { type: Date, required: true },
    items: [shoppingItemSchema],
    estimatedTotalPaise: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "shopping", "completed", "cancelled"], default: "draft" },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

shoppingListSchema.index({ userId: 1, shoppingDate: -1 });
shoppingListSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("ShoppingList", shoppingListSchema);
