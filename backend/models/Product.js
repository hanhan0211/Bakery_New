import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  images: [
    {
      url: { type: String },
      alt: { type: String }
    }
  ]
}, { timestamps: true });

export default mongoose.model("Product", productSchema);