import express from "express";
import { createOrderFromCart, getOrder, listOrders, updateOrderStatus } from "../controllers/order.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// cần login
router.use(protect);

// user tạo order từ cart của mình
router.post("/", createOrderFromCart);

// admin xem mọi order, user xem order của chính họ
router.get("/", listOrders);

// user xem order riêng, admin xem tất cả
router.get("/:id", getOrder);

// admin thay đổi trạng thái đơn hàng
router.put("/:id/status", admin, updateOrderStatus);

export default router;
