const express = require("express");
const router = express.Router();
const { getSummary, getMonthlyExpenses, getCategoryExpenses } = require("../controllers/dashboardController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/summary", getSummary);
router.get("/monthly-expenses", getMonthlyExpenses);
router.get("/category-expenses", getCategoryExpenses);

module.exports = router;
