const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userDetails: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    items: Array,
    total: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Order",
  orderSchema,
  "buynextorder"
);
