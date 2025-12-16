import Contact from "../models/Contact.js";

const contactController = {
    // 1. Gửi liên hệ (Tạo mới)
    sendContact: async (req, res) => {
        try {
            const { message } = req.body;
            const userId = req.user._id;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({ message: 'Nội dung tin nhắn không được để trống' });
            }

         const newContact = new Contact({
                user_id: userId,
                subject: dynamicSubject,
                status: 'new',
                isReadByAdmin: false, // ✅ Mới tạo -> Admin chưa xem
                isReadByUser: true,   // ✅ Của mình tạo -> Coi như đã xem
                conversation: [{ 
                    sender: 'user', 
                    message: message || "", 
                    image: imagePath,
                    timestamp: new Date() 
                }]
            });
            
            await newContact.save();
            res.status(201).json({ success: true, message: 'Đã gửi yêu cầu', data: newContact });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server', error: error.message });
        }
    },

    // 2. Lấy danh sách liên hệ (Admin)
    getAllContacts: async (req, res) => {
        try {
            const contacts = await Contact.find()
                .populate('user_id', 'fullname email phone_number avatar')
                .sort({ updatedAt: -1 });
            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 3. Lấy lịch sử của tôi (User)
    getMyContacts: async (req, res) => {
        try {
            const contacts = await Contact.find({ user_id: req.user._id }).sort({ updatedAt: -1 });
            res.status(200).json({ success: true, data: contacts });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 4. Xóa liên hệ (Cho cả Admin và User)
    deleteContact: async (req, res) => {
        try {
            const { id } = req.params;
            const contact = await Contact.findById(id);

            if (!contact) {
                return res.status(404).json({ message: 'Tin nhắn không tồn tại' });
            }

            // Kiểm tra quyền: Admin được xóa hết, User chỉ xóa của mình
            if (req.user.role !== 'admin' && !contact.user_id.equals(req.user._id)) {
                return res.status(403).json({ message: "Bạn không có quyền xóa tin nhắn này" });
            }

            await Contact.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Đã xóa hội thoại' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. Chat tiếp (2 chiều + Hỗ trợ Ảnh)
    addMessage: async (req, res) => {
        try {
            const { id } = req.params;
            const { message } = req.body;
            const sender = req.user.role === 'admin' ? 'admin' : 'user';

            let imagePath = null;
            if (req.file) imagePath = `/uploads/${req.file.filename}`;

            if ((!message || message.trim() === "") && !imagePath) {
                return res.status(400).json({ message: "Vui lòng nhập tin nhắn hoặc gửi ảnh" });
            }

            // 👇 LOGIC ĐÁNH DẤU CHƯA ĐỌC 👇
            const updateFields = {
                $push: { 
                    conversation: { 
                        sender: sender, 
                        message: message || "", 
                        image: imagePath 
                    } 
                },
                status: sender === 'user' ? 'new' : 'processing'
            };

            if (sender === 'admin') {
                // Admin nhắn -> Khách chưa đọc (Hiện chấm xanh)
                updateFields.isReadByUser = false; 
                updateFields.isReadByAdmin = true; 
            } else {
                // Khách nhắn -> Admin chưa đọc (Hiện chấm đỏ)
                updateFields.isReadByAdmin = false;
                updateFields.isReadByUser = true;
            }

            const contact = await Contact.findByIdAndUpdate(id, updateFields, { new: true });
            
            if (!contact) return res.status(404).json({ message: "Không tìm thấy" });
            res.status(200).json({ success: true, data: contact });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // ✅ 6. HÀM MỚI: ĐÁNH DẤU ĐÃ ĐỌC (Khi bấm vào xem)
    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const role = req.user.role;

            // Nếu là Admin xem -> set isReadByAdmin = true
            // Nếu là User xem -> set isReadByUser = true
            const updateField = role === 'admin' 
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