import express from "express";
import { addReview, listReviews } from "../controllers/review.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Lấy danh sách review (public)
router.get("/", listReviews);

// User đăng nhập mới được review
router.post("/", protect, addReview);

// (tùy chọn) Admin duyệt review hoặc xóa review
// router.put("/:id/approve", protect, admin, approveReview);
// router.delete("/:id", protect, admin, deleteReview);

export default router;
