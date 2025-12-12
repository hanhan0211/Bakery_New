import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Trash2, Minus, Plus, ShoppingBag, ArrowRight, CreditCard, CheckSquare, Square
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
    const [updating, setUpdating] = useState(false);
    
    // Lưu danh sách ID các sản phẩm được chọn (Dạng String)
    const [selectedItems, setSelectedItems] = useState([]); 
    
    const navigate = useNavigate();
    const getToken = () => localStorage.getItem("ACCESS_TOKEN");

    const fetchCart = async () => {
        const token = getToken();
        if (!token) {
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

    // --- TÍNH TỔNG TIỀN (Chỉ tính những món có trong selectedItems) ---
    const selectedTotal = useMemo(() => {
        if (!cart || !cart.items) return 0;
        return cart.items.reduce((total, item) => {
            if (!item.product) return total; // Bỏ qua sản phẩm lỗi

            // ✅ ÉP KIỂU STRING ĐỂ SO SÁNH CHÍNH XÁC
            const productId = String(item.product._id || item.product);
            
            if (selectedItems.includes(productId)) { 
                return total + (item.price * item.qty);
            }
            return total;
        }, 0);
    }, [cart, selectedItems]);

    // --- CHỌN 1 SẢN PHẨM ---
    const handleSelectItem = (rawId) => {
        const productId = String(rawId); // Luôn ép về String
        if (selectedItems.includes(productId)) {
            setSelectedItems(selectedItems.filter(id => id !== productId));
        } else {
            setSelectedItems([...selectedItems, productId]);
        }
    };

    // --- CHỌN TẤT CẢ ---
    const handleSelectAll = () => {
        if (!cart || !cart.items) return;
        
        // Lấy danh sách ID hợp lệ (ép về String hết)
        const validItemIds = cart.items
            .filter(item => item.product)
            .map(item => String(item.product._id || item.product));

        if (selectedItems.length === validItemIds.length) {
            setSelectedItems([]); // Bỏ chọn hết
        } else {
            setSelectedItems(validItemIds); // Chọn hết
        }
    };

    // --- NÚT MUA HÀNG (QUAN TRỌNG NHẤT) ---
    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            alert("Bạn chưa chọn sản phẩm nào để thanh toán!");
            return;
        }
        
        // ✅ FIX LỖI GỘP ĐƠN: Lọc kỹ càng dựa trên String ID
        const itemsToCheckout = cart.items.filter(item => {
            if (!item.product) return false;
            const productId = String(item.product._id || item.product);
            return selectedItems.includes(productId);
        });

        console.log("Sản phẩm chuyển sang thanh toán:", itemsToCheckout); // Debug xem đúng chưa

        // Chuyển sang trang Checkout với đúng danh sách đã lọc
        navigate('/checkout', { state: { items: itemsToCheckout, total: selectedTotal } });
    };

    const handleUpdateQty = async (index, newQty) => {
        if (newQty < 1 || updating) return;
        const token = getToken();
        setUpdating(true);
        try {
            const res = await axios.put('http://localhost:5000/api/cart/item', 
                { itemIndex: index, qty: newQty },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCart(res.data);
        } catch (err) {
            console.error("Lỗi cập nhật:", err);
        } finally {
            setUpdating(false);
        }
    };

    const handleRemoveItem = async (rawId) => {
        const productId = String(rawId);
        const token = getToken();
        if (!window.confirm("Bạn có chắc muốn xóa bánh này khỏi giỏ?")) return;
        try {
            const res = await axios.delete(`http://localhost:5000/api/cart/item/${productId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(res.data);
            // Xóa khỏi danh sách đang chọn nếu có
            setSelectedItems(selectedItems.filter(id => id !== productId));
        } catch (err) {
            console.error("Lỗi xóa:", err);
        }
    };

    // Hàm xóa item bị lỗi (null product)
    const handleRemoveInvalidItem = async (itemId) => {
         const token = getToken();
         try {
             // Gọi API xóa (có thể backend cần xử lý riêng cho trường hợp này)
             const res = await axios.delete(`http://localhost:5000/api/cart/item/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCart(res.data);
         } catch(err) {
             console.log("Không thể xóa item lỗi tự động", err);
             // Nếu API lỗi, reload lại trang để đồng bộ
             window.location.reload();
         }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    
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

    // Tính số lượng item hợp lệ
    const validItemsCount = cart.items.filter(i => i.product).length;

    return (
        <div className="bg-gray-50 min-h-screen py-10 font-sans">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 font-serif flex items-center gap-3">
                    <ShoppingBag className="text-pink-600" /> Giỏ Hàng Của Bạn
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* LIST ITEM */}
                    <div className="w-full lg:w-2/3 space-y-4">
                        
                        {/* HEADER CHỌN TẤT CẢ */}
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                             <button 
                                onClick={handleSelectAll}
                                className="flex items-center gap-2 text-gray-600 font-medium hover:text-pink-600"
                            >
                                {selectedItems.length === validItemsCount && validItemsCount > 0 ? (
                                    <CheckSquare className="text-pink-600" /> 
                                ) : (
                                    <Square className="text-gray-400" />
                                )}
                                Chọn tất cả ({validItemsCount} sản phẩm)
                            </button>
                        </div>

                        {cart.items.map((item, index) => {
                            // CHECK ITEM LỖI (Sản phẩm bị xóa khỏi DB)
                            if (!item.product) {
                                return (
                                    <div key={index} className="bg-red-50 p-4 rounded-2xl border border-red-100 flex justify-between items-center">
                                        <span className="text-red-500 text-sm">Sản phẩm này không còn tồn tại.</span>
                                        <button onClick={() => handleRemoveInvalidItem(item._id || "unknown")} className="text-red-600 hover:underline text-sm font-bold">Xóa bỏ</button>
                                    </div>
                                )
                            }

                            // ✅ LUÔN ÉP KIỂU STRING ĐỂ SO SÁNH
                            const rawId = item.product._id || item.product;
                            const productId = String(rawId);
                            const isSelected = selectedItems.includes(productId);

                            return (
                                <div key={index} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all flex gap-4 items-center ${isSelected ? 'border-pink-300 ring-1 ring-pink-100' : 'border-gray-100'}`}>
                                    
                                    {/* NÚT TICK CHỌN */}
                                    <button onClick={() => handleSelectItem(productId)}>
                                        {isSelected ? (
                                            <CheckSquare className="text-pink-600 flex-shrink-0" size={24} />
                                        ) : (
                                            <Square className="text-gray-300 flex-shrink-0 hover:text-pink-400" size={24} />
                                        )}
                                    </button>

                                    {/* ẢNH SẢN PHẨM */}
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
                                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" onError={(e) => {e.target.src = 'https://via.placeholder.com/150'}} />
                                    </div>

                                    {/* THÔNG TIN */}
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-gray-800 text-lg mb-1">{item.name}</h3>
                                        <div className="text-pink-600 font-bold">{item.price?.toLocaleString()}đ</div>
                                    </div>

                                    {/* TĂNG GIẢM / XÓA */}
                                    <div className="flex flex-col items-end gap-4">
                                        <div className="flex items-center border border-gray-200 rounded-lg h-9">
                                            <button 
                                                disabled={updating}
                                                onClick={() => handleUpdateQty(index, item.qty - 1)}
                                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-l-lg"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-10 text-center text-sm font-semibold">{item.qty}</span>
                                            <button 
                                                disabled={updating}
                                                onClick={() => handleUpdateQty(index, item.qty + 1)}
                                                className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-r-lg"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button onClick={() => handleRemoveItem(productId)} className="text-gray-400 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* TỔNG TIỀN (RIGHT) */}
                    <div className="w-full lg:w-1/3">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-24">
                            <h3 className="font-bold text-xl mb-6 text-gray-800">Thông tin đơn hàng</h3>
                            
                            <div className="space-y-3 mb-6 border-b border-gray-100 pb-6">
                                <div className="flex justify-between text-gray-600">
                                    <span>Đã chọn:</span>
                                    <span className="font-medium">{selectedItems.length} món</span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mb-8">
                                <span className="font-bold text-gray-800 text-lg">Tổng thanh toán:</span>
                                <span className="font-bold text-2xl text-pink-600">{selectedTotal.toLocaleString()}đ</span>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={selectedItems.length === 0}
                                className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition transform active:scale-[0.98]
                                    ${selectedItems.length > 0 
                                        ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200' 
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                <CreditCard size={20} />
                                Mua Hàng ({selectedItems.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;