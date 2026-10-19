const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        "Maliga Saman","Vegetables","Oil","Eggs",
        "Dairy & Milk","Fruits","Snacks & Drinks","Cleaning & Household",
        "Meat & Seafood","Other",
        "Grains & Pulses","Dairy & Eggs","Oils & Condiments",
        "Snacks & Beverages","Cleaning & Hygiene","Personal Care","Bakery","Frozen Foods"
      ],
      default: "Maliga Saman",
    },
    defaultQuantity: { type: Number, default: 1, min: 0 },
    unit: { type: String, default: "kg", trim: true },
    estimatedPricePaise: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, default: "" },
    isFavourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ userId: 1, name: 1 });
productSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model("Product", productSchema);
