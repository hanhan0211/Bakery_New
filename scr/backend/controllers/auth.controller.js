import User from "../models/User.js";
import jwt from "jsonwebtoken";

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exist = await User.findOne({ email });
    if(exist) return res.status(400).json({ message: "Email đã tồn tại" });
    const user = await User.create({ name, email, password });
    const token = signToken(user);
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch(err){ next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Sai email hoặc mật khẩu" });

    const token = signToken(user);

    // Trả về chuẩn { user, token }
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    });
  } catch (err) {
    next(err);
  }
};


export const logout = async (req, res, next) => {
  try {
    // Ở phía client sẽ xoá token trong localStorage hoặc context
    res.json({ message: "Đăng xuất thành công" });
  } catch (err) {
    next(err);
  }
};
