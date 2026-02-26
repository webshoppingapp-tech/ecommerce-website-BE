const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    id: Number,
    img: String,
    desc: String,
    price: Number,
    qty: Number,
    category: String,
  },
  { timestamps: true }
);

/**
 * 👇 VERY IMPORTANT
 * 3rd argument forces collection name
 */
module.exports = mongoose.model(
  "Cart",
  cartSchema,
  "buynextcart"
);
