import Review from "../models/Review.js";
import Product from "../models/Product.js";

// ✅ Helper: Tính toán lại rating trung bình cho Product
const calcAverageRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId, approved: true } }, // Chỉ tính review đã duyệt
    { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);

  const update = stats.length > 0 
    ? { avgRating: stats[0].avg.toFixed(1), reviewCount: stats[0].count }
    : { avgRating: 0, reviewCount: 0 };

  await Product.findByIdAndUpdate(productId, update);
};

// 1. Thêm/Sửa Review (Của Khách) - Code cũ của bạn (đã tối ưu gọn lại)
export const addReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, title, content } = req.body;

    const p = await Product.findById(productId);
    if (!p) return res.status(404).json({ message: "Product không tồn tại" });

    const existing = await Review.findOne({ user: userId, product: productId });
    if (existing) {
      existing.rating = rating;
      existing.title = title;
      existing.content = content;
      await existing.save();
    } else {
      await Review.create({ user: userId, product: productId, rating, title, content });
    }

    // Tính lại điểm ngay
    await calcAverageRating(p._id);

    res.json({ message: "Đã đánh giá thành công" });
  } catch (err) { next(err); }
};

// 2. Lấy danh sách review theo sản phẩm (Public)
export const listReviews = async (req, res, next) => {
  try {
    const { productId } = req.query;
    // Chỉ lấy review đã được duyệt (approved: true)
    const filter = { approved: true };
    if (productId) filter.product = productId;

    const reviews = await Review.find(filter)
      .populate("user", "name avatarUrl") // Lấy thêm avatar nếu có
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) { next(err); }
};

// --- PHẦN ADMIN MỚI THÊM ---

// 3. Admin lấy tất cả Review (kể cả chưa duyệt)
export const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .populate("user", "name email")
      // ✅ QUAN TRỌNG: Thêm 'images' vào đây để phòng trường hợp DB lưu ảnh trong mảng
      .populate("product", "name image images") 
      .sort("-createdAt");
    res.json(reviews);
  } catch (err) { next(err); }
};

// 4. Admin duyệt/ẩn Review
export const toggleApproveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy" });

    // Đảo ngược trạng thái (True -> False và ngược lại)
    review.approved = !review.approved;
    await review.save();

    // Tính lại điểm trung bình vì trạng thái duyệt đã đổi
    await calcAverageRating(review.product);

    res.json({ message: `Đã ${review.approved ? "hiện" : "ẩn"} đánh giá` });
  } catch (err) { next(err); }
};

// 5. Admin trả lời Review
export const replyReview = async (req, res, next) => {
  try {
    const { response } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: "Không tìm thấy" });

    review.adminResponse = response;
    await review.save();

    res.json({ message: "Đã trả lời đánh giá" });
  } catch (err) { next(err); }
};

// 6. Admin xóa Review
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      // Tính lại điểm trung bình sau khi xóa
      await calcAverageRating(review.product);
      res.json({ message: "Đã xóa đánh giá" });
    } else {
      res.status(404).json({ message: "Không tìm thấy" });
    }
  } catch (err) { next(err); }
};