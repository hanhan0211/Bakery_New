import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ["new","read","closed"], default: "new" },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  replyMessage: String
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);
