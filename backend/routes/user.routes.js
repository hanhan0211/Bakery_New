import express from "express";
import { updateUserProfile, getAllUsers, deleteUser } from "../controllers/user.controller.js"; // Import Controller cũ
import { protect, admin } from "../middleware/auth.middleware.js";

// ✅ 1. Import cái biến uploadFiles từ file CỦA BẠN
// (Sửa đường dẫn '../middleware/upload' cho đúng với tên file bạn đang lưu)
import { uploadFiles } from "../middleware/upload.js"; 

const router = express.Router();

// ✅ 2. Gắn uploadFiles.single("avatar") vào giữa
// "avatar" là tên key mà Frontend sẽ gửi lên (trong FormData)
router.put("/profile", protect, uploadFiles.single("avatar"), updateUserProfile);

// Các route khác giữ nguyên
router.get("/", protect, admin, getAllUsers);
router.delete("/:id", protect, admin, deleteUser);

export default router;