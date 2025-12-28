import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, enum: ["user","admin"], default: "user" },
  avatarUrl: { type: String },
}, { timestamps: true });

// --- SỬA ĐOẠN NÀY ---
// Xóa tham số 'next' và xóa các dòng gọi 'next()'
userSchema.pre("save", async function() {
  // Nếu password không bị thay đổi thì bỏ qua (return luôn)
  if(!this.isModified("password")) return; 
  
  // Tạo salt và hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Không cần gọi next() ở đây nữa vì hàm này là async
});
// --------------------

userSchema.methods.comparePassword = async function(candidate){
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);