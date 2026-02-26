const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

/* GET CART */
router.get("/", async (req, res) => {
  const items = await Cart.find();
  res.json(items);
});

/* ADD TO CART */
router.post("/", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Cart body missing" });
    }

    const cart = new Cart(req.body);
    const saved = await cart.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Cart save failed:", err.message);
    res.status(500).json({ message: "Cart save failed" });
  }
});


/* UPDATE QTY */
router.put("/:id", async (req, res) => {
  try {
    const item = await Cart.findByIdAndUpdate(
      req.params.id,
      { qty: req.body.qty },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* DELETE ITEM */
router.delete("/:id", async (req, res) => {
  try {
    await Cart.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
