import Contact from "../models/Contact.js";

const contactController = {

    // 1. USER GỬI LIÊN HỆ (có thể gửi ảnh)
    sendContact: async (req, res) => {
        try {
            const { message, subject } = req.body;
            const userId = req.user._id;

            let imagePath = null;
            if (req.file) {
                imagePath = `/uploads/${req.file.filename}`;
            }

            if ((!message || message.trim() === "") && !imagePath) {
                return res.status(400).json({
                    message: "Vui lòng nhập tin nhắn hoặc gửi ảnh"
                });
            }

            const newContact = new Contact({
                user_id: userId,
                subject: subject || "Liên hệ mới",
                status: "new",
                isReadByAdmin: false,
                isReadByUser: true,
                conversation: [{
                    sender: "user",
                    message: message || "",
                    image: imagePath
                }]
            });

            await newContact.save();
            res.status(201).json({ success: true, data: newContact });

        } catch (error) {
            console.error("SEND CONTACT ERROR:", error);
            res.status(500).json({ message: error.message });
        }
    },

    // 2. ADMIN - LẤY DANH SÁCH LIÊN HỆ
    getAllContacts: async (req, res) => {
        try {
            const contacts = await Contact.find()
                // 🔥 CHỈ SỬA DÒNG NÀY – ĐÚNG THEO USER SCHEMA
                .populate("user_id", "name email phone avatarUrl")
                .sort({ updatedAt: -1 });

            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. USER - LỊCH SỬ LIÊN HỆ CỦA TÔI
    getMyContacts: async (req, res) => {
        try {
            const contacts = await Contact.find({
                user_id: req.user._id
            })
                .populate("user_id", "name email phone avatarUrl")
                .sort({ updatedAt: -1 });

            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. XÓA LIÊN HỆ (ADMIN hoặc CHÍNH USER)
    deleteContact: async (req, res) => {
        try {
            const { id } = req.params;
            const contact = await Contact.findById(id);

            if (!contact) {
                return res.status(404).json({ message: "Tin nhắn không tồn tại" });
            }

            if (
                req.user.role !== "admin" &&
                !contact.user_id.equals(req.user._id)
            ) {
                return res.status(403).json({ message: "Không có quyền xóa" });
            }

            await Contact.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Đã xóa hội thoại" });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. CHAT TIẾP (2 chiều + gửi ảnh)
    addMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const sender = req.user.role === "admin" ? "admin" : "user";

            let imagePath = null;
            if (req.file) {
                imagePath = `/uploads/${req.file.filename}`;
            }

            if ((!message || message.trim() === "") && !imagePath) {
                return res.status(400).json({
                    message: "Vui lòng nhập tin nhắn hoặc gửi ảnh"
                });
            }

            const updateFields = {
                $push: {
                    conversation: {
                        sender,
                        message: message || "",
                        image: imagePath
                    }
                },
                status: sender === "user" ? "new" : "processing"
            };

            if (sender === "admin") {
                updateFields.isReadByUser = false;
                updateFields.isReadByAdmin = true;
            } else {
                updateFields.isReadByAdmin = false;
                updateFields.isReadByUser = true;
            }

            const contact = await Contact.findByIdAndUpdate(
                id,
                updateFields,
                { new: true }
            )
                .populate("user_id", "name email phone avatarUrl");

            if (!contact) {
                return res.status(404).json({ message: "Không tìm thấy hội thoại" });
            }

            res.status(200).json({ success: true, data: contact });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 6. ĐÁNH DẤU ĐÃ ĐỌC
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const role = req.user.role;

            const updateField =
                role === "admin"
                    ? { isReadByAdmin: true }
                    : { isReadByUser: true };

            await Contact.findByIdAndUpdate(id, updateField);
            res.status(200).json({ success: true });

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export default contactController;
