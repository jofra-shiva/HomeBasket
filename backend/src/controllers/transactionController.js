const Transaction = require("../models/Transaction");
const ShoppingList = require("../models/ShoppingList");
const { transactionSchema } = require("../validators/transaction");

exports.getTransactions = async (req, res) => {
  try {
    const { from, to, paymentStatus, paymentMethod, month, year } = req.query;
    const filter = { userId: req.user._id };
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (from || to) {
      filter.purchaseDate = {};
      if (from) filter.purchaseDate.$gte = new Date(from);
      if (to) filter.purchaseDate.$lte = new Date(to);
    }
    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      filter.purchaseDate = { $gte: start, $lte: end };
    }
    const transactions = await Transaction.find(filter).sort({ purchaseDate: -1, createdAt: -1 });
    res.json({ success: true, count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    if (data.shoppingListId) {
      const existing = await Transaction.findOne({ shoppingListId: data.shoppingListId, userId: req.user._id });
      if (existing) return res.status(409).json({ success: false, message: "Transaction already exists for this shopping list" });
    }
    const transaction = await Transaction.create({
      ...data,
      userId: req.user._id,
      purchaseDate: new Date(data.purchaseDate),
    });
    if (data.shoppingListId) {
      await ShoppingList.findOneAndUpdate(
        { _id: data.shoppingListId, userId: req.user._id },
        { status: "completed" }
      );
    }
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
    const data = parsed.data;
    if (data.purchaseDate) data.purchaseDate = new Date(data.purchaseDate);
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      data,
      { new: true, runValidators: true }
    );
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) return res.status(404).json({ success: false, message: "Transaction not found" });
    if (transaction.shoppingListId) {
      await ShoppingList.findOneAndUpdate(
        { _id: transaction.shoppingListId, userId: req.user._id },
        { status: "shopping" }
      );
    }
    res.json({ success: true, message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
