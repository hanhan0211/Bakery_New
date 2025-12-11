import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js"; // Import thêm User


// Giữ nguyên hàm tạo đơn (Lưu ý: Đảm bảo Cart đã được lưu vào DB trước khi gọi hàm này)
export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;
    
    // Tìm giỏ hàng trong DB
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if(!cart || cart.items.length === 0) return res.status(400).json({ message: "Giỏ hàng rỗng" });

    const items = [];
    for(const it of cart.items) {
      const prod = await Product.findById(it.product);
      if(prod.stock < it.qty) return res.status(400).json({ message: `Sản phẩm ${prod.name} không đủ số lượng` });
      items.push({
        product: prod._id,
        name: prod.name,
        price: it.price,
        qty: it.qty,
        attrs: it.attrs,
        image: it.image
      });
      prod.stock -= it.qty;
      await prod.save();
    }

    const itemsPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
    const shippingPrice = 0; 
    const taxPrice = 0;
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const order = await Order.create({
      user: userId,
      items,
      shippingAddress,
      paymentMethod,
      itemsPrice, shippingPrice, taxPrice, totalPrice,
      status: "pending"
    });

    // Clear giỏ hàng sau khi tạo đơn thành công
    cart.items = [];
    cart.subTotal = 0;
    cart.total = 0;
    await cart.save();

    res.status(201).json(order);
  } catch(err){ next(err); }
};

export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email").populate("items.product");
    if(!order) return res.status(404).json({ message: "Không tìm thấy order" });
    
    if(req.user.role !== "admin" && !order.user._id.equals(req.user.id)) return res.status(403).json({ message: "Không có quyền" });
    res.json(order);
  } catch(err){ next(err); }
};

export const listOrders = async (req, res, next) => {
  try {
    const filter = {};
    if(req.user.role !== "admin") filter.user = req.user.id;
    const orders = await Order.find(filter).sort("-createdAt").limit(100);
    res.json(orders);
  } catch(err){ next(err); }
};

// 👇 Đã chỉnh sửa logic để khớp với frontend "completed"
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if(!order) return res.status(404).json({ message: "Không tìm thấy order" });
    
    order.status = status;

    // Frontend gửi "completed", nên ta check completed để lưu ngày giao
    if(status === "completed" || status === "delivered") {
        order.deliveredAt = new Date();
    }
    
    if(status === "cancelled") {
        order.cancelledAt = new Date();
    }
    
    await order.save();
    res.json(order);
  } catch(err){ next(err); }
};
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Đếm số lượng cơ bản
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    // 2. Tính tổng doanh thu (Chỉ tính các đơn đã hoàn thành)
    const revenueAgg = await Order.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // 3. Biểu đồ doanh thu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      { 
        $match: { 
          status: "completed",
          updatedAt: { $gte: sevenDaysAgo } 
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
    ]);

    // 4. Lấy 5 đơn hàng mới nhất
    const recentOrders = await Order.find()
      .select("user totalPrice status createdAt")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(5);

    // 5. (Nâng cao) Top 4 sản phẩm bán chạy nhất
    // Vì model Product không có trường 'sold', ta phải tính tổng từ Order
    const topProducts = await Order.aggregate([
      { $match: { status: "completed" } }, // Chỉ lấy đơn đã hoàn thành
      { $unwind: "$items" },
      { 
        $group: { 
          _id: "$items.product", 
          totalSold: { $sum: "$items.qty" }
        } 
      },
      { $sort: { totalSold: -1 } },
      { $limit: 4 },
      
      {
        $lookup: {
          from: "products", // Tên collection trong DB (thường là số nhiều)
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" }, // Gỡ mảng productInfo ra
      {
        $project: {
          _id: 1,
          totalSold: 1,
          name: "$productInfo.name",
          price: "$productInfo.price",
          // Lấy URL của ảnh đầu tiên trong mảng images
          image: { $arrayElemAt: ["$productInfo.images.url", 0] } 
        }
      }
    ]);
    res.json({
      counts: {
        users: totalUsers,
        products: totalProducts,
        orders: totalOrders,
        revenue: totalRevenue
      },
      chartData: dailyRevenue,
      recentOrders,
      topProducts
    });

  } catch (err) {
    next(err);
  }
};