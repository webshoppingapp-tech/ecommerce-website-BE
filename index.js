require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* ------------------ CORS ------------------ */
app.use(cors({
  origin: "https://ecommerce-website-fe-seven.vercel.app", // Allows any frontend to connect
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

/* ------------------ DATABASE ------------------ */
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        dbName: "buynext",
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

connectDB()
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ------------------ SCHEMAS ------------------ */

const cartSchema = new mongoose.Schema(
  {
    id: Number,
    desc: String,
    img: String,
    price: Number,
    qty: Number,
    category: String,
  },
  { versionKey: false }
);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
});

/* ✅ ORDER SCHEMA (AS YOU DESIGNED) */
const orderSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
    },

    userDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
    },

    items: [
      {
        desc: String,
        img: String,
        price: Number,
        qty: Number,
        category: String,
      }
    ],

    total: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { versionKey: false }
);


const blogSchema = new mongoose.Schema({
  title: String,    
  content: String,  
  img: String,      
  date: String,
  likes: { type: Number, default: 0 },
});

const productSchema = new mongoose.Schema({
  desc: String,
  name: String,
  price: Number,
  category: String,
  longDesc: String,
  qty: Number,
  img: String,
  images: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/* ------------------ MODELS ------------------ */
const Cart =
  mongoose.models.Cart || mongoose.model("Cart", cartSchema, "carts");
const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema, "orders");
const Blog =
  mongoose.models.Blog || mongoose.model("Blog", blogSchema, "blogcollect");
const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema, "products");

/* ------------------ HEALTH CHECK ------------------ */
app.get("/", (req, res) => {
  res.send(" BuyNext API is running");
});

/* ------------------ CART ------------------ */
app.get("/cart", async (req, res) => {
  await connectDB();
  res.json(await Cart.find());
});

/* ------------------ CART ------------------ */
app.post("/cart", async (req, res) => {
  try {
    await connectDB();
    // Use _id because that is what MongoDB/Frontend uses
    const { _id } = req.body; 

    if (!_id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Look for the item using _id
    let item = await Cart.findOne({ _id });

    if (item) {
      // If product exists in cart, increment quantity
      item.qty = (item.qty || 0) + 1;
      await item.save();
      return res.json(item);
    }

    // If it's a new product, create it
    // Ensure qty is set to 1 for new items
    const newItem = new Cart({
      ...req.body,
      qty: 1
    });
    
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Cart Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/cart/:id", async (req, res) => {
  await connectDB();
  const updated = await Cart.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!updated) return res.status(404).json({ message: "Item not found" });
  res.json(updated);
});

app.delete("/cart/:id", async (req, res) => {
  await connectDB();
  const deleted = await Cart.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Item not found" });
  res.json({ message: "Deleted successfully" });
});

/* ------------------ ORDERS ------------------ */

/* ✅ ADMIN – ALL ORDERS */
app.get("/admin/orders", async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch {
    res.status(500).json({ error: "Failed to fetch admin orders" });
  }
});

/* ✅ USER – OWN ORDERS */
app.get("/orders", async (req, res) => {
  try {
    await connectDB();
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});


/* ✅ CREATE ORDER */
app.post("/orders", async (req, res) => {
  try {
    await connectDB();

    const {
      userDetails = {},
      items = []
    } = req.body;

    const {
      name,
      email,
      phone,
      address
    } = userDetails;

    if (!name || !email || !phone || !address || !items.length) {
      return res.status(400).json({
        error: "Missing user details or items",
        received: req.body
      });
    }

    const total = items.reduce(
      (sum, i) => sum + i.price * (i.qty || 1),
      0
    );

    const order = new Order({
      userEmail: email,
      userDetails: { name, email, phone, address },
      items,
      total,
      date: new Date(),
    });

    const saved = await order.save();
    res.status(201).json(saved);

  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ------------------ BLOGS ------------------ */
// GET ALL BLOGS
app.get("/api/blogs", async (req, res) => {
  try {
    await connectDB();
    const blogs = await Blog.find().sort({ _id: -1 });
    res.json(blogs);
  } catch (err) {
    console.error("Fetch Blogs Error:", err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// CREATE BLOG ✅ FIXED
app.post("/api/blogs", async (req, res) => {
  try {
    const { title, content, img, date } = req.body;

    if (!title || !content || !img) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blog = await Blog.create({
      title,
      content,
      img,
      date,
      likes: 0,
    });

    res.status(201).json(blog);

  } catch (err) {
    console.error("CREATE BLOG ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// UPDATE BLOG
app.put("/api/blogs/:id", async (req, res) => {
  try {
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// DELETE BLOG
app.delete("/api/blogs/:id", async (req, res) => {
  try {
    await connectDB();
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete Blog Error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// LIKE BLOG
app.patch("/api/blogs/like/:id", async (req, res) => {
  try {
    await connectDB();
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Like failed" });
  }
});

/* ------------------ PRODUCTS ------------------ */
app.get("/products", async (req, res) => {
  await connectDB();
  res.json(await Product.find().sort({ createdAt: -1 }));
});

app.get("/admin/products", async (req, res) => {
  await connectDB();
  res.json(await Product.find().sort({ createdAt: -1 }));
});

app.post("/admin/products", async (req, res) => {
  await connectDB();
  res.status(201).json(await new Product(req.body).save());
});

app.put("/admin/products/:id", async (req, res) => {
  await connectDB();
  res.json(
    await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )
  );
});

app.delete("/admin/products/:id", async (req, res) => {
  await connectDB();
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

/* ------------------ SERVER ------------------ */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(` Server running on port ${PORT}`)
);

module.exports = app;
