import multer from "multer";
import fs from "fs";

const uploadDir = "uploads";

// Tạo folder uploads nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

export const uploadFiles = multer({ storage });
