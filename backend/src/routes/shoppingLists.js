const express = require("express");
const router = express.Router();
const { getShoppingLists, createShoppingList, getShoppingList, updateShoppingList, deleteShoppingList } = require("../controllers/shoppingController");
const { protect } = require("../middleware/auth");

router.use(protect);
router.get("/", getShoppingLists);
router.post("/", createShoppingList);
router.get("/:id", getShoppingList);
router.put("/:id", updateShoppingList);
router.delete("/:id", deleteShoppingList);

module.exports = router;
