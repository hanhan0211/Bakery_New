import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  
  // ✅ THÊM TRƯỜNG FLAVOR (VỊ)
  flavor: { 
      type: String, 
      enum: ['Vani', 'Socola', 'Dâu', 'Matcha', 'Phô mai', 'Trái cây', 'Cà phê', 'Khác'], 
      default: 'Khác' 
  },

  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  images: [
    {
      url: { type: String },
      alt: { type: String }
    }
  ],
  
  // Trường dành cho đánh giá (Review)
  avgRating: { type: Number, default: 0 }, 
  reviewCount: { type: Number, default: 0 } 

}, { timestamps: true });

export default mongoose.model("Product", productSchema);