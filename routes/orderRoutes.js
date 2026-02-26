const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

/* GET ORDERS */
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ GET /orders failed:", err.message);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

/* CREATE ORDER */
router.post("/", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Order body missing" });
    }

    const order = new Order(req.body);
    const saved = await order.save();

    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ POST /orders failed:", err.message);
    res.status(500).json({ message: "Order creation failed" });
  }
});

module.exports = router;
