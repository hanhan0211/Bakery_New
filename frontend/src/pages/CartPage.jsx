import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Trash2, Minus, Plus, ShoppingBag, ArrowRight, CreditCard, Truck 
} from 'lucide-react';

// --- HELPER ---
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150?text=No+Image';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

const CartPage = () => {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // Tránh spam click
    const navigate = useNavigate();

    // Lấy token từ localStorage để xác thực
    const getToken = () => localStorage.getItem("ACCESS_TOKEN");

    const fetchCart = async () => {
        const token = getToken();
        if (!token) {
            // Nếu chưa đăng nhập, chuyển hướng hoặc báo lỗi
            navigate('/login');
            return;
        }

        try {
            const res = await axios.get('http://localhost:5000/api/cart', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(res.data);
        } catch (err) {
            console.error("Lỗi tải giỏ hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    // Xử lý cập nhật số lượng
    const handleUpdateQty = async (index, newQty) => {
        if (newQty < 1 || updating) return;
        
        const token = getToken();
        setUpdating(true);
        try {
            // Backend của bạn dùng itemIndex để update
            const res = await axios.put('http://localhost:5000/api/cart/item', 
                { itemIndex: index, qty: newQty },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCart(res.data); // Cập nhật lại state cart mới nhất từ server trả về
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
            alert("Không thể cập nhật số lượng");
        } finally {
            setUpdating(false);
        }
    };

    // Xử lý xóa sản phẩm
    const handleRemoveItem = async (productId) => {
        const token = getToken();
        if (!window.confirm("Bạn có chắc muốn xóa bánh này khỏi giỏ?")) return;

        try {
            const res = await axios.delete(`http://localhost:5000/api/cart/item/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(res.data);
        } catch (err) {
            console.error("Lỗi xóa:", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
                <p className="text-pink-500 font-medium">Đang lấy danh sách bánh...</p>
            </div>
        );
    }

    // Giao diện khi giỏ hàng trống
    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full border border-pink-100">
                    <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-400">
                        <ShoppingBag size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Giỏ hàng đang trống</h2>
                    <p className="text-gray-500 mb-8">Bạn chưa chọn chiếc bánh nào cả. Hãy dạo một vòng thực đơn nhé!</p>
                    <Link to="/san-pham" className="flex items-center justify-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition font-medium w-full">
                        Xem thực đơn <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-10 font-sans">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 font-serif flex items-center gap-3">
                    <ShoppingBag className="text-pink-600" /> Giỏ Hàng Của Bạn
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* DANH SÁCH SẢN PHẨM (LEFT) */}
                    <div className="w-full lg:w-2/3 space-y-4">
                        {cart.items.map((item, index) => (
                            <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                                {/* Ảnh */}
                                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                                    <img 
                                        src={getImageUrl(item.image)} 
                                        alt={item.name} 
                                        className="w-full h-full object-cover"
                                        onError={(e) => {e.target.src = 'https://via.placeholder.com/150'}}
                                    />
                                </div>

                                {/* Thông tin */}
                                <div className="flex-grow">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1">{item.name}</h3>
                                    {/* Nếu có thuộc tính (size, topping...) hiển thị ở đây */}
                                    {item.attrs && Object.keys(item.attrs).length > 0 && (
                                        <div className="text-xs text-gray-500 mb-2">
                                            {Object.values(item.attrs).join(', ')}
                                        </div>
                                    )}
                                    <div className="text-pink-600 font-bold">
                                        {item.price?.toLocaleString()}đ
                                    </div>
                                </div>

                                {/* Bộ điều khiển số lượng */}
                                <div className="flex flex-col items-end gap-4">
                                    <div className="flex items-center border border-gray-200 rounded-lg h-9">
                                        <button 
                                            disabled={updating}
                                            onClick={() => handleUpdateQty(index, item.qty - 1)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg disabled:opacity-50"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-10 text-center text-sm font-semibold">{item.qty}</span>
                                        <button 
                                            disabled={updating}
                                            onClick={() => handleUpdateQty(index, item.qty + 1)}
                                            className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg disabled:opacity-50"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => handleRemoveItem(item.product._id || item.product)}
                                        className="text-gray-400 hover:text-red-500 transition text-sm flex items-center gap-1"
                                    >
                                        <Trash2 size={16} /> Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* TỔNG TIỀN (RIGHT - STICKY) */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-24">
                            <h3 className="font-bold text-xl mb-6 text-gray-800">Thông tin đơn hàng</h3>
                            
                            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính:</span>
                                    <span className="font-medium">{cart.subTotal?.toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Phí vận chuyển:</span>
                                    <span className="font-medium">{cart.shipping > 0 ? `${cart.shipping.toLocaleString()}đ` : 'Miễn phí'}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm italic">
                                    <span><Truck size={14} className="inline mr-1"/> Giao hàng:</span>
                                    <span>Tiêu chuẩn</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-8">
                                <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                                <span className="font-bold text-2xl text-pink-600">{cart.total?.toLocaleString()}đ</span>
                            </div>

                            <button className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl hover:bg-pink-700 shadow-lg shadow-pink-200 flex items-center justify-center gap-2 transition transform active:scale-[0.98]">
                                <CreditCard size={20} />
                                Tiến Hành Thanh Toán
                            </button>

                            <Link to="/san-pham" className="block text-center mt-4 text-sm text-gray-500 hover:text-pink-600 hover:underline">
                                Tiếp tục mua sắm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;