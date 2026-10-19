const mongoose = require("mongoose");

const purchasedItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: "piece" },
    pricePaise: { type: Number, required: true, min: 0 },
    category: { type: String, default: "Other" },
  },
  { _id: true }
);

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shoppingListId: { type: mongoose.Schema.Types.ObjectId, ref: "ShoppingList" },
    purchasedItems: [purchasedItemSchema],
    finalBillAmountPaise: { type: Number, required: true, min: 0 },
    discountPaise: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Debit Card", "Credit Card", "Other"],
      required: true,
    },
    paymentStatus: { type: String, enum: ["Paid", "Unpaid"], default: "Paid" },
    storeName: { type: String, trim: true, default: "" },
    notes: { type: String, default: "" },
    purchaseDate: { type: Date, required: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, purchaseDate: -1 });
transactionSchema.index({ userId: 1, paymentStatus: 1 });
transactionSchema.index({ userId: 1, shoppingListId: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
