const ShoppingList = require("../models/ShoppingList");
const { shoppingListSchema } = require("../validators/shoppingList");

exports.getShoppingLists = async (req, res) => {
  try {
    const { status, from, to } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;
    if (from || to) {
      filter.shoppingDate = {};
      if (from) filter.shoppingDate.$gte = new Date(from);
      if (to) filter.shoppingDate.$lte = new Date(to);
    }
    const lists = await ShoppingList.find(filter).sort({ shoppingDate: -1, createdAt: -1 });
    res.json({ success: true, count: lists.length, shoppingLists: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createShoppingList = async (req, res) => {
  try {
    const parsed = shoppingListSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    const estimatedTotalPaise = data.items.reduce((sum, item) => sum + (item.estimatedPricePaise * item.quantity), 0);
    const list = await ShoppingList.create({
      ...data,
      userId: req.user._id,
      shoppingDate: new Date(data.shoppingDate),
      estimatedTotalPaise,
    });
    res.status(201).json({ success: true, shoppingList: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getShoppingList = async (req, res) => {
  try {
    const list = await ShoppingList.findOne({ _id: req.params.id, userId: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: "Shopping list not found" });
    res.json({ success: true, shoppingList: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateShoppingList = async (req, res) => {
  try {
    const parsed = shoppingListSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    if (data.items) {
      data.estimatedTotalPaise = data.items.reduce((sum, item) => sum + (item.estimatedPricePaise * item.quantity), 0);
    }
    if (data.shoppingDate) data.shoppingDate = new Date(data.shoppingDate);
    const list = await ShoppingList.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!list) return res.status(404).json({ success: false, message: "Shopping list not found" });
    res.json({ success: true, shoppingList: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteShoppingList = async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!list) return res.status(404).json({ success: false, message: "Shopping list not found" });
    res.json({ success: true, message: "Shopping list deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
