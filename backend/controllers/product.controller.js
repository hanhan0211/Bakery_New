import Product from "../models/Product.js";
import Category from "../models/Category.js";
import slugify from "slugify";

// --- Create Product ---
export const createProduct = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.category) {
      const cat = await Category.findById(payload.category);
      if (!cat) return res.status(400).json({ message: "Category không tồn tại" });
    }
    if (payload.name) payload.slug = slugify(payload.name, { lower: true });
    if (req.files) {
      payload.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: file.originalname,
      }));
    }
    const product = await Product.create(payload);
    res.status(201).json(product);
  } catch (err) { next(err); }
};

// --- Update Product ---
export const updateProduct = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.category) {
      const cat = await Category.findById(payload.category);
      if (!cat) return res.status(400).json({ message: "Category không tồn tại" });
    }
    if (payload.name) payload.slug = slugify(payload.name, { lower: true });
    if (req.files) {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: "Không tìm thấy product" });
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: file.originalname,
      }));
      payload.images = [ ...(product.images || []), ...newImages ];
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, payload, { new: true }).populate("category");
    if (!updatedProduct) return res.status(404).json({ message: "Không tìm thấy product" });
    res.json(updatedProduct);
  } catch (err) { next(err); }
};

// --- Delete Product ---
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Không tìm thấy product" });
    res.json({ message: "Đã xóa" });
  } catch (err) { next(err); }
};

// --- Get Product by ID ---
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: "Không tìm thấy" });
    res.json(product);
  } catch (err) { next(err); }
};

// --- Get Product by Slug ---
export const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).populate("category");
    if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    res.json(product);
  } catch (err) { res.status(500).json({ message: "Lỗi server" }); }
};

// ============================================================
// ✅ LIST PRODUCTS (CHỈ LỌC MỚI NHẤT / CŨ NHẤT)
// ============================================================
export const listProducts = async (req, res, next) => {
  try {
    const { 
        page = 1, 
        limit = 12, 
        q, 
        category, 
        minPrice, 
        maxPrice, 
        sort, // <--- Nhận biến sort
        featured,
        flavor 
    } = req.query;

    const filter = {};

    // 1. Bộ lọc cơ bản
    if (q) filter.name = { $regex: q, $options: "i" };
    if (category) filter.category = category;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (flavor) filter.flavor = flavor;
    if (featured === 'true') filter.avgRating = { $gte: 4 }; 

    // 2. Xử lý sắp xếp (Mới nhất / Cũ nhất)
    let sortCondition = { createdAt: -1 }; // Mặc định: Mới nhất (-1)

    if (sort === 'oldest') {
        sortCondition = { createdAt: 1 }; // Cũ nhất (1)
    } else {
        sortCondition = { createdAt: -1 }; // Mới nhất (-1)
    }

    // Ưu tiên xếp theo rating nếu đang xem trang nổi bật mà không chọn sort
    if (featured === 'true' && !sort) {
        sortCondition = { avgRating: -1 };
    }

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments(filter);
    
    const items = await Product.find(filter)
      .populate("category")
      .sort(sortCondition) // <--- Áp dụng sort
      .skip(skip)
      .limit(Number(limit));

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};