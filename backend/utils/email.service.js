import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// --- TEMPLATE EMAIL ĐẸP + CÓ ẢNH ---
const createOrderTemplate = (order) => {
  const items = order.orderItems || order.items || []; // Phòng hờ tên biến khác nhau
  const shippingAddress = order.shippingAddress || {};
  const user = order.user || { name: 'Khách hàng' };
  const totalPrice = order.totalPrice || 0;
  const shippingPrice = order.shippingPrice || 0;
  
  const date = new Date().toLocaleDateString('vi-VN');

  const itemsHtml = items.map((item) => {
    const price = item.price ? item.price.toLocaleString('vi-VN') : 0;
    const totalItem = (item.price * item.qty).toLocaleString('vi-VN');
    const image = item.image || 'https://via.placeholder.com/150'; 

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; width: 70px;">
            <img src="${image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; color: #333;">
            <strong>${item.name}</strong>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; white-space: nowrap;">${price} đ</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; white-space: nowrap;">${totalItem} đ</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #d35400; padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">ĐƠN HÀNG ĐÃ ĐƯỢC XÁC NHẬN</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Cảm ơn bạn đã lựa chọn HanHan Bakery</p>
        </div>
        <div style="padding: 20px;">
            <p>Xin chào <strong>${user.name}</strong>,</p>
            <p>Admin đã xác nhận đơn hàng <strong>#${order._id}</strong> của bạn.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #d35400;">
                <h3 style="margin-top: 0; color: #d35400; font-size: 16px;">Thông tin nhận hàng</h3>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Người nhận:</strong> ${user.name}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>SĐT:</strong> ${shippingAddress.phone || '---'}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Địa chỉ:</strong> ${shippingAddress.address}, ${shippingAddress.city}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <thead>
                    <tr style="background-color: #eee; text-align: left;">
                        <th style="padding: 10px;">Ảnh</th>
                        <th style="padding: 10px;">Tên bánh</th>
                        <th style="padding: 10px; text-align: center;">SL</th>
                        <th style="padding: 10px; text-align: right;">Đơn giá</th>
                        <th style="padding: 10px; text-align: right;">Tổng</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
            </table>
            <div style="text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #eee;">
                <p style="margin: 5px 0; color: #666;">Phí vận chuyển: ${shippingPrice.toLocaleString('vi-VN')} đ</p>
                <p style="margin: 5px 0; font-size: 20px; color: #d35400; font-weight: bold;">
                    Tổng thanh toán: ${totalPrice.toLocaleString('vi-VN')} đ
                </p>
            </div>
        </div>
        <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e0e0e0;">
            <p>&copy; 2024 HanHan Bakery. All rights reserved.</p>
        </div>
    </div>
  `;
};

// --- HÀM 1: GỬI MAIL XÁC NHẬN CHI TIẾT ---
export const sendOrderConfirmationEmail = async (order) => {
  try {
    const mailOptions = {
      from: `"HanHan Bakery" <${process.env.EMAIL_USER}>`,
      to: order.user ? order.user.email : order.email,
      subject: `[HanHan Bakery] Đơn hàng #${order._id} đã được xác nhận`,
      html: createOrderTemplate(order),
    };
    await transporter.sendMail(mailOptions);
    console.log('✅ Đã gửi email xác nhận cho khách');
  } catch (error) {
    console.error('❌ Lỗi gửi mail xác nhận:', error);
  }
};

// --- HÀM 2: GỬI MAIL CẬP NHẬT TRẠNG THÁI (MỚI THÊM VÀO) ---
export const sendOrderStatusEmail = async (order) => {
    try {
      let statusText = '';
      let statusColor = '#333';
      
      if (order.status === 'delivered') {
          statusText = 'Đang giao hàng';
          statusColor = '#3498db'; // Xanh dương
      } else if (order.status === 'completed') {
          statusText = 'Đã giao thành công';
          statusColor = '#27ae60'; // Xanh lá
      } else if (order.status === 'cancelled') {
          statusText = 'Đã bị hủy';
          statusColor = '#e74c3c'; // Đỏ
      }
  
      const mailOptions = {
        from: `"HanHan Bakery" <${process.env.EMAIL_USER}>`,
        to: order.user ? order.user.email : order.email,
        subject: `[Cập nhật đơn hàng] #${order._id} - ${statusText}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; max-width: 600px; margin: 0 auto;">
            <h2>Cập nhật trạng thái đơn hàng</h2>
            <p>Xin chào ${order.user ? order.user.name : 'bạn'},</p>
            <p>Đơn hàng <strong>#${order._id}</strong> của bạn vừa được cập nhật trạng thái:</p>
            <h3 style="color: ${statusColor}; text-transform: uppercase;">${statusText}</h3>
            <p>Cảm ơn bạn đã mua sắm tại HanHan Bakery!</p>
          </div>
        `,
      };
  
      await transporter.sendMail(mailOptions);
      console.log('✅ Đã gửi email trạng thái');
    } catch (error) {
      console.error('❌ Lỗi gửi mail trạng thái:', error);
    }
  };