import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String },
    status: { type: String, enum: ['new', 'processing', 'completed'], default: 'new' },
    
    // ✅ THÊM 2 TRƯỜNG NÀY ĐỂ QUẢN LÝ DẤU CHẤM XANH/ĐỎ
    isReadByAdmin: { type: Boolean, default: false }, // False = Hiện chấm đỏ bên Admin
    isReadByUser: { type: Boolean, default: true },   // False = Hiện chấm xanh bên Khách

    conversation: [
        {
            sender: { type: String, enum: ['user', 'admin'], required: true },
            message: { type: String }, 
            image: { type: String },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model("Contact", contactSchema);