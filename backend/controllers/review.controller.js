import Review from "../models/Review.js";
import Product from "../models/Product.js";

export const addReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, title, body } = req.body;
    // ensure product exists
    const p = await Product.findById(productId);
    if(!p) return res.status(404).json({ message: "Product không tồn tại" });

    // create or update existing review
    const existing = await Review.findOne({ user: userId, product: productId });
    if(existing) {
      existing.rating = rating; existing.title = title; existing.body = body;
      await existing.save();
    } else {
      await Review.create({ user: userId, product: productId, rating, title, body });
    }

    // recalc avg rating and count
    const stats = await Review.aggregate([
      { $match: { product: p._id, approved: true } },
      { $group: { _id: "$product", avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    if(stats.length > 0) {
      p.avgRating = stats[0].avg;
      p.reviewCount = stats[0].count;
    } else {
      p.avgRating = 0; p.reviewCount = 0;
    }
    await p.save();

    res.json({ message: "Đã đánh giá" });
  } catch(err){ next(err); }
};

export const listReviews = async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = {};
    if(productId) filter.product = productId;
    const reviews = await Review.find(filter).populate("user", "name avatarUrl").sort("-createdAt");
    res.json(reviews);
  } catch(err){ next(err); }
};
