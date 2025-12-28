import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    MapPin, Banknote, ChevronLeft, CheckCircle, Loader, Save 
} from 'lucide-react';

// ✅ HÀM XỬ LÝ ẢNH (Bao sân mọi trường hợp)
const getImageUrl = (input) => {
    // 1. Kiểm tra null/undefined
    if (!input) return 'https://via.placeholder.com/150?text=No+Image';

    let path = input;

    // 2. Nếu là mảng -> lấy phần tử đầu
    if (Array.isArray(path)) {
        path = path.length > 0 ? path[0] : null;
    }

    // 3. Nếu là object (Cloudinary/Upload) -> lấy url
    if (path && typeof path === 'object') {
        path = path.url || path.secure_url || path.image || null;
    }

    // 4. Nếu vẫn không phải string -> trả về ảnh lỗi
    if (typeof path !== 'string') return 'https://via.placeholder.com/150?text=Err+Type';

    // 5. Xử lý đường dẫn
    if (path.startsWith('http')) return path; // Ảnh online
    
    // Ảnh local: Đảm bảo có dấu / ở đầu và không bị trùng /uploads
    let finalPath = path.startsWith('/') ? path : `/${path}`;
    // Nếu path chưa có /uploads/ và server cần nó (tùy config của bạn)
    // if (!finalPath.includes('/uploads/')) finalPath = `/uploads${finalPath}`; 

    return `http://localhost:5000${finalPath}`;
};

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu từ Cart truyền sang
    const { items, total } = location.state || { items: [], total: 0 };
    const [loading, setLoading] = useState(false);
    
    const [shippingInfo, setShippingInfo] = useState({
        fullName: '',
        phone: '',
        addressLine: '', 
        city: ''       
    });

    const [paymentMethod, setPaymentMethod] = useState('cod'); 

    // Debug: Xem log để biết dữ liệu items thực tế là gì (F12 -> Console)
    useEffect(() => {
        console.log("Dữ liệu items nhận được:", items);
    }, [items]);

    useEffect(() => {
        if (!items || items.length === 0) {
            navigate('/cart');
            return;
        }

        const savedAddress = localStorage.getItem("SAVED_SHIPPING_INFO");
        if (savedAddress) {
            setShippingInfo(JSON.parse(savedAddress));
        } else {
            const userInfo = localStorage.getItem("USER_INFO");
            if (userInfo) {
                const user = JSON.parse(userInfo);
                setShippingInfo(prev => ({
                    ...prev,
                    fullName: user.name || '',
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
        localStorage.setItem("SAVED_SHIPPING_INFO", JSON.stringify(shippingInfo));

        // Chuẩn bị dữ liệu gửi lên Server
        const orderData = {
            orderItems: items.map(item => {
                const p = item.product || {};
                // Tìm ảnh chính xác để lưu vào DB (để sau này xem lịch sử đơn hàng vẫn thấy ảnh)
                const realImage = item.image || p.image || (p.images && p.images[0]) || '';

                return {
                    product: p._id || item.product, 
                    name: item.name || p.name,
                    qty: item.qty,
                    price: item.price, // Giá này đã là giá sau giảm (từ Cart truyền sang)
                    image: realImage, 
                    attrs: item.attrs || {}
                };
            }),
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
                alert("Đặt hàng thành công!");
                // Xóa giỏ hàng (Frontend chỉ cần dispatch event để cập nhật badge, Backend đã tự xóa)
                window.dispatchEvent(new Event("CART_UPDATED"));
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
                            
                            <div className="absolute top-6 right-6 text-xs text-gray-400 flex items-center gap-1">
                                <Save size={12}/> Tự động lưu
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
                                {items.map((item, idx) => {
                                    // --- 🔍 FIX LOGIC HIỂN THỊ ẢNH ---
                                    const p = item.product || {};
                                    // Tìm ảnh: Ưu tiên item.image > p.image (string) > p.images (array)
                                    const rawImage = item.image || p.image || (p.images && p.images.length > 0 ? p.images[0] : null);
                                    
                                    const displayName = item.name || p.name;
                                    const displayPrice = item.price || 0;

                                    return (
                                        <div key={idx} className="flex gap-3 mb-4">
                                            {/* Ảnh sản phẩm */}
                                            <div className="w-14 h-14 flex-shrink-0 border rounded-lg overflow-hidden bg-gray-100">
                                                <img 
                                                    src={getImageUrl(rawImage)} 
                                                    alt={displayName} 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.onerror = null; 
                                                        e.target.src = 'https://via.placeholder.com/150?text=No+Image'
                                                    }} 
                                                />
                                            </div>
                                            
                                            <div className="flex-grow">
                                                <h4 className="font-medium text-sm line-clamp-2 text-gray-800">{displayName}</h4>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    SL: <span className="font-bold">{item.qty}</span> 
                                                    <span className="mx-2">|</span> 
                                                    <span className="text-pink-600 font-bold">{displayPrice.toLocaleString()}đ</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="border-t pt-4 space-y-2">
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Tạm tính:</span>
                                    <span>{total.toLocaleString()}đ</span>
                                </div>
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Phí vận chuyển:</span>
                                    <span>Miễn phí</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-dashed mt-2">
                                    <span className="font-bold text-lg text-gray-800">Tổng cộng:</span>
                                    <span className="font-bold text-2xl text-pink-600">{total.toLocaleString()}đ</span>
                                </div>
                                
                                <button type="submit" disabled={loading} className={`w-full py-4 mt-4 rounded-xl font-bold text-white flex justify-center items-center gap-2 transition-all ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-600 hover:bg-pink-700 shadow-lg shadow-pink-200'}`}>
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