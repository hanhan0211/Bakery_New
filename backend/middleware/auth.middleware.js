import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ✅ Hàm 1: protect
export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token

    if (!token) return res.status(401).json({ message: "Không có token, không được phép" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) return res.status(401).json({ message: "Token không hợp lệ" });
    next();
  } catch (err) {
    res.status(401).json({ message: "Token hết hạn hoặc không hợp lệ" });
  }
};

// ✅ Hàm 2: admin (Chữ thường)
export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Bạn không có quyền truy cập" });
  }
};