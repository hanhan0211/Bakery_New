# 🍰 XÂY DỰNG HỆ THỐNG WEBSITE BÁN BÁNH KEM TRỰC TUYẾN SỬ DỤNG REACTJS VÀ TAILWIND CSS  
Sinh viên thực hiện: Nguyễn Thị Ngọc Hân  
Lớp: DA22TTD 
MSSV: 110122069<br>
Đề tài: Xây dựng hệ thống website bán bánh kem trực tuyến sử dụng ReactJS và Tailwind CSS  
---
### 📖 Giới thiệu  
Dự án Website bán bánh kem trực tuyến được xây dựng nhằm đáp ứng nhu cầu đặt mua bánh kem nhanh chóng, tiện lợi trong thời đại công nghệ số.  
Hệ thống cho phép khách hàng dễ dàng xem các mẫu bánh, lựa chọn kích thước – hương vị, đặt hàng trực tuyến và theo dõi trạng thái đơn hàng.  
Bên cạnh đó, hệ thống hỗ trợ quản trị viên quản lý sản phẩm, danh mục bánh, đơn hàng và người dùng một cách hiệu quả.

Website được phát triển theo mô hình Client – Server, sử dụng ReactJS cho giao diện người dùng, NodeJS cho xử lý phía máy chủ và MongoDB làm cơ sở dữ liệu, đảm bảo khả năng mở rộng, hiệu năng và dễ bảo trì.

### 🔧 Công nghệ sử dụng  
- Front-end: ReactJS, TailwindCSS  
- Back-end: NodeJS (ExpressJS)  
- Database: MongoDB  
- Authentication: JWT (JSON Web Token)  
- Web Server: NodeJS  
- Công cụ hỗ trợ: Git, Postman

🛠️ Yêu cầu cài đặt  
- NodeJS >= 18  
- npm  
- MongoDB (Local hoặc MongoDB Atlas)  
- Git  

### 🚀 Hướng dẫn cài đặt & chạy dự án  

### 1️⃣ Clone dự án  
```
git clone https://github.com/cn-da22ttd-nguyenthingochan-websitebanbanhkem-reactjs.git
cd Bakery_new
```
### 2️⃣ Cài đặt thư viện

Cài đặt cho Front-end:
```
cd frontend
npm install
```

Cài đặt cho Back-end:
```
cd backend
npm install
```

### 3️⃣ Cấu hình môi trường (.env)

Tạo file .env trong thư mục server:
```env
PORT=5000
MONGO_URI=mongodb+srv://chuoi_ket_noi_cua_ban
JWT_SECRET=key_bi_mat
EMAIL_USER=email_cua_ban@gmail.com
#Không phải mật khẩu của mail mà là mật khẩu app 16 ký tự
EMAIL_PASS= 16_ky_tu
```


### 4️⃣ Chạy Back-end
```
cd server
npm run dev
```

➡️ Server chạy tại: http://localhost:5000

### 5️⃣ Chạy Front-end
```
cd client
npm run dev
```

➡️ Website chạy tại: http://localhost:5173
---
### 📝 Một số lệnh quan trọng
| Chức năng | Lệnh |
|----------|------|
| Cài thư viện | npm install |
| Chạy server backend | npm run dev |
| Chạy frontend | npm run dev |
| Build frontend | npm run build |
---
*© 2025 Ngọc Hân - DA22TTD - 110122069*

