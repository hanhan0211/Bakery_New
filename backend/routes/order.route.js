import express from "express";
import { 
  createOrderFromCart, 
  getOrder, 
  listOrders, 
  updateOrderStatus,
  getDashboardStats // ✅ Import hàm mới
} from "../controllers/order.controller.js"; 

import { protect, admin } from "../middleware/auth.middleware.js"; 

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createOrderFromCart)
  .get(listOrders);

// ✅ CHÈN ROUTE THỐNG KÊ Ở ĐÂY (TRƯỚC /:id)
// Chỉ admin mới xem được thống kê
router.get("/stats", admin, getDashboardStats);

router.route("/:id")
  .get(getOrder)
  .put(admin, updateOrderStatus);

export default router;