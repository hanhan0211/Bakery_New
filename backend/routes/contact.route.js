import express from "express";
import { createContact, listContacts } from "../controllers/contact.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// khách + user + admin đều gửi được
router.post("/", createContact);

// chỉ admin xem được danh sách
router.get("/", protect, admin, listContacts);

export default router;
