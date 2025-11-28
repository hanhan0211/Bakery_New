import express from "express";
import { 
    createProduct, 
    listProducts, 
    deleteProduct, 
    getProductBySlug,
    getProduct 
} from "../controllers/product.controller.js";

const router = express.Router();

// --- PUBLIC ROUTES (Test mode: Không cần login) ---

// Lấy danh sách
router.get("/", listProducts);

// Lấy chi tiết
router.get("/:id", getProduct);
router.get("/slug/:slug", getProductBySlug);

// Tạo mới sản phẩm (POST /api/products)
router.post("/", createProduct); 

// Xóa sản phẩm
router.delete("/:id", deleteProduct);

export default router;