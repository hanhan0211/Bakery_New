import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, Phone, User, CreditCard, Banknote, 
  ChevronLeft, CheckCircle, Loader, Save 
} from 'lucide-react';

const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150?text=No+Image';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { items, total } = location.state || { items: [], total: 0 };
    const [loading, setLoading] = useState(false);
    
    // Form state
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phone: '',
        addressLine: '', 
        city: ''       
    });

    const [paymentMethod, setPaymentMethod] = useState('cod'); 

    // ✅ LOGIC MỚI: Tự động điền thông tin khi vào trang
    useEffect(() => {
        // 1. Kiểm tra giỏ hàng
        if (!items || items.length === 0) {
            navigate('/cart');
            return;
        }

        // 2. Thử lấy địa chỉ đã lưu lần mua trước
        const savedAddress = localStorage.getItem("SAVED_SHIPPING_INFO");
        
        if (savedAddress) {
            // Nếu có lịch sử mua hàng -> Điền form luôn
            setShippingInfo(JSON.parse(savedAddress));
        } else {
            // Nếu chưa mua lần nào -> Thử lấy Tên từ thông tin đăng nhập (USER_INFO)
            const userInfo = localStorage.getItem("USER_INFO");
            if (userInfo) {
                const user = JSON.parse(userInfo);
                setShippingInfo(prev => ({
                    ...prev,
                    fullName: user.name || '', // Lấy tên user
                    // phone: user.phone || '' // Nếu backend lúc login trả về phone thì điền luôn
                }));
            }
        }
    }, [items, navigate]);

    const handleChange = (e) => {
        setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.addressLine) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        const token = localStorage.getItem("ACCESS_TOKEN");
        if (!token) {
            alert("Bạn cần đăng nhập để đặt hàng.");
            navigate('/login');
            return;
        }

        setLoading(true);

        // ✅ LOGIC MỚI: Lưu thông tin này lại cho lần sau mua tiếp
        localStorage.setItem("SAVED_SHIPPING_INFO", JSON.stringify(shippingInfo));

        const orderData = {
            orderItems: items.map(item => ({
                product: item.product._id || item.product,
                name: item.name,
                qty: item.qty,
                price: item.price,
                image: item.image,
                attrs: item.attrs || {}
            })),
            shippingAddress: {
                fullName: shippingInfo.fullName,
                phone: shippingInfo.phone,
                addressLine: shippingInfo.addressLine,
                city: shippingInfo.city || 'Việt Nam' 
            },
            paymentMethod: paymentMethod, 
            itemsPrice: total,
            shippingPrice: 0,
            taxPrice: 0,
            totalPrice: total
        };

        try {
            const res = await axios.post('http://localhost:5000/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.status === 201) {
                // Xóa giỏ hàng trên frontend nếu cần (tuỳ logic app của bạn)
                // localStorage.removeItem("CART_ITEMS"); 
                
                alert("Đặt hàng thành công!");
                navigate(`/order/${res.data._id}`);
            }

        } catch (err) {
            console.error("Lỗi đặt hàng:", err);
            alert(err.response?.data?.message || "Có lỗi xảy ra khi tạo đơn hàng.");
        } finally {
            setLoading(false);
        }
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-10 font-sans">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex items-center gap-2 text-sm text-gray-500">
                    <Link to="/cart" className="hover:text-pink-600 flex items-center gap-1">
                        <ChevronLeft size={16} /> Quay lại giỏ hàng
                    </Link>
                    <span>/</span>
                    <span className="font-bold text-gray-800">Thanh toán</span>
                </div>

                <form onSubmit={handlePlaceOrder} className="flex flex-col lg:flex-row gap-8">
                    
                    {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                    <div className="w-full lg:w-3/5">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 relative">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <MapPin className="text-pink-600" /> Thông tin giao hàng
                            </h2>
                            
                            {/* Gợi ý nhỏ cho người dùng */}
                            <div className="absolute top-6 right-6 text-xs text-gray-400 flex items-center gap-1">
                                <Save size={12}/> Tự động lưu cho lần sau
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên (*)</label>
                                    <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại (*)</label>
                                    <input type="tel" name="phone" value={shippingInfo.phone} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="0901234567" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ (*)</label>
                                    <input type="text" name="addressLine" value={shippingInfo.addressLine} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="Số nhà, tên đường..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                                    <input type="text" name="city" value={shippingInfo.city} onChange={handleChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500" placeholder="TP.HCM" />
                                </div>
                            </div>
                        </div>

                        {/* PHƯƠNG THỨC THANH TOÁN */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Banknote className="text-pink-600" /> Phương thức thanh toán
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                <div onClick={() => setPaymentMethod('cod')} className={`cursor-pointer p-4 border rounded-xl flex items-center gap-3 ${paymentMethod === 'cod' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                                    <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">{paymentMethod === 'cod' && <div className="w-3 h-3 bg-pink-600 rounded-full"></div>}</div>
                                    <div><div className="font-bold text-gray-800">Thanh toán khi nhận hàng (COD)</div></div>
                                </div>
                                
                                <div onClick={() => setPaymentMethod('card')} className={`cursor-pointer p-4 border rounded-xl flex items-center gap-3 ${paymentMethod === 'card' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                                    <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">{paymentMethod === 'card' && <div className="w-3 h-3 bg-pink-600 rounded-full"></div>}</div>
                                    <div><div className="font-bold text-gray-800">Thanh toán Online / Thẻ</div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: BILL INFO */}
                    <div className="w-full lg:w-2/5">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-10">
                            <h3 className="font-bold text-xl mb-4 text-gray-800">Đơn hàng ({items.length} món)</h3>
                            <div className="max-h-60 overflow-y-auto mb-4 scrollbar-thin">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 mb-4">
                                        <img src={getImageUrl(item.image)} alt="" className="w-14 h-14 rounded-lg object-cover border" />
                                        <div>
                                            <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                            <div className="text-xs text-gray-500">x{item.qty} - <span className="text-pink-600 font-bold">{item.price.toLocaleString()}đ</span></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="font-bold text-lg">Tổng cộng:</span>
                                    <span className="font-bold text-2xl text-pink-600">{total.toLocaleString()}đ</span>
                                </div>
                                <button type="submit" disabled={loading} className={`w-full py-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 ${loading ? 'bg-gray-400' : 'bg-pink-600 hover:bg-pink-700'}`}>
                                    {loading ? <Loader className="animate-spin" /> : <CheckCircle />} Xác Nhận Đặt Hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CheckoutPage;