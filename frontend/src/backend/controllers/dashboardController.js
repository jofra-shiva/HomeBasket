const Transaction = require("../models/Transaction");
const ShoppingList = require("../models/ShoppingList");
const Product = require("../models/Product");

exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [monthTxns, totalTxnCount, pendingLists, unpaidBills, todayLists, recentTxns, productCount] = await Promise.all([
      Transaction.find({ userId, purchaseDate: { $gte: startOfMonth, $lte: endOfMonth } }),
      Transaction.countDocuments({ userId }),
      ShoppingList.countDocuments({ userId, status: { $in: ["draft","shopping"] } }),
      Transaction.aggregate([
        { $match: { userId, paymentStatus: "Unpaid" } },
        { $group: { _id: null, total: { $sum: "$finalBillAmountPaise" }, count: { $sum: 1 } } },
      ]),
      ShoppingList.find({ userId, shoppingDate: { $gte: todayStart, $lte: todayEnd } }),
      Transaction.find({ userId }).sort({ purchaseDate: -1 }).limit(5),
      Product.countDocuments({ userId }),
    ]);

    const monthSpendingPaise = monthTxns.reduce((s, t) => s + t.finalBillAmountPaise, 0);
    const monthPaidPaise = monthTxns.filter(t => t.paymentStatus === "Paid").reduce((s, t) => s + t.finalBillAmountPaise, 0);

    const todayItems = todayLists.flatMap(l => l.items.filter(i => i.status !== "skipped"));

    res.json({
      success: true,
      summary: {
        monthSpendingPaise,
        monthPaidPaise,
        totalShoppingTrips: totalTxnCount,
        pendingLists,
        unpaidBillsPaise: unpaidBills[0]?.total || 0,
        unpaidBillsCount: unpaidBills[0]?.count || 0,
        todayItems,
        recentTransactions: recentTxns,
        productCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMonthlyExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId, purchaseDate: { $gte: startOfYear, $lte: endOfYear } } },
      {
        $group: {
          _id: { month: { $month: "$purchaseDate" } },
          totalPaise: { $sum: "$finalBillAmountPaise" },
          paidPaise: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$finalBillAmountPaise", 0] } },
          unpaidPaise: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Unpaid"] }, "$finalBillAmountPaise", 0] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const found = data.find(d => d._id.month === i + 1);
      return {
        month: i + 1,
        totalPaise: found?.totalPaise || 0,
        paidPaise: found?.paidPaise || 0,
        unpaidPaise: found?.unpaidPaise || 0,
        count: found?.count || 0,
      };
    });

    res.json({ success: true, year: targetYear, months });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryExpenses = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = parseInt(month) || now.getMonth() + 1;
    const targetYear = parseInt(year) || now.getFullYear();
    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const data = await Transaction.aggregate([
      { $match: { userId, purchaseDate: { $gte: start, $lte: end } } },
      { $unwind: "$purchasedItems" },
      {
        $group: {
          _id: "$purchasedItems.category",
          totalPaise: { $sum: "$purchasedItems.pricePaise" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalPaise: -1 } },
    ]);

    res.json({ success: true, month: targetMonth, year: targetYear, categories: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
