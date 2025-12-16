import express from "express";
import contactController from "../controllers/contact.controller.js"; 
import { verifyToken, isAdmin } from "../middleware/auth.middleware.js"; 
import upload from "../middleware/upload.js"; // ✅ Import upload

const router = express.Router();

// --- USER ROUTES ---
router.post("/", verifyToken, contactController.sendContact);
router.get("/my-history", verifyToken, contactController.getMyContacts);

// ✅ Route chat: Thêm upload.single('image') để nhận file
router.put("/:id/chat", verifyToken, upload.single('image'), contactController.addMessage);

// --- ADMIN ROUTES ---
router.get("/", verifyToken, isAdmin, contactController.getAllContacts);
router.delete("/:id", verifyToken, isAdmin, contactController.deleteContact);
router.put("/:id/read", verifyToken, contactController.markAsRead);

export default router;