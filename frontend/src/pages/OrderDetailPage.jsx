import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader, MapPin, CreditCard, ChevronLeft, Package, Phone, User, Calendar } from 'lucide-react';

const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

const OrderDetailPage = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            const token = localStorage.getItem("ACCESS_TOKEN");
            try {
                const res = await axios.get(`http://localhost:5000/api/orders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setOrder(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-pink-500 w-10 h-10" /></div>;
    if (!order) return <div className="text-center py-20 text-gray-500">Không tìm thấy đơn hàng</div>;

    // Helper trạng thái
    const statusConfig = {
        pending: { label: 'Đang xử lý', color: 'bg-yellow-100 text-yellow-800' },
        completed: { label: 'Giao thành công', color: 'bg-green-100 text-green-700' },
        cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
    };
    const currentStatus = statusConfig[order.status] || { label: order.status, color: 'bg-gray-100' };

    return (
        <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen font-sans">
            {/* Nút quay lại */}
            <Link to="/my-orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 mb-6 font-medium transition-colors">
                <ChevronLeft size={20} /> Quay lại danh sách
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-5xl mx-auto">
                
                {/* Header Đơn hàng */}
                <div className="bg-pink-50/50 p-6 border-b border-pink-100 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="text-pink-600" size={24} /> 
                            Đơn hàng #{order._id.slice(-6).toUpperCase()}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Calendar size={14}/> 
                            Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wide ${currentStatus.color}`}>
                        {currentStatus.label}
                    </div>
                </div>

                <div className="p-6 grid lg:grid-cols-3 gap-8">
                    
                    {/* CỘT TRÁI: THÔNG TIN (Chiếm 1 phần) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Địa chỉ */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
                                <MapPin size={18} className="text-pink-600"/> Địa chỉ nhận hàng
                            </h3>
                            <div className="text-sm space-y-3">
                                <div className="flex items-start gap-2">
                                    <User size={16} className="text-gray-400 mt-0.5"/>
                                    <span className="font-bold text-gray-800">{order.shippingAddress.fullName}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone size={16} className="text-gray-400 mt-0.5"/>
                                    <span className="text-gray-600">{order.shippingAddress.phone}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin size={16} className="text-gray-400 mt-0.5"/>
                                    <span className="text-gray-600 leading-relaxed">
                                        {order.shippingAddress.addressLine}, {order.shippingAddress.city}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Thanh toán */}
                        <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 border-b border-gray-200 pb-3">
                                <CreditCard size={18} className="text-pink-600"/> Thanh toán
                            </h3>
                            <div className="text-sm">
                                <p className="font-medium text-gray-800 mb-1">
                                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản / Thẻ'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {/* Trạng thái thanh toán - Backend bạn chưa có trường isPaid nhưng mình để placeholder */}
                                    Trạng thái: {order.status === 'completed' ? <span className="text-green-600 font-bold">Đã thanh toán</span> : <span className="text-yellow-600">Chưa thanh toán</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: SẢN PHẨM (Chiếm 2 phần) */}
                    <div className="lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Sản phẩm ({order.items.length})</h3>
                        
                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 border-b border-gray-200 last:border-0 items-center bg-white">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                                        <img 
                                            src={getImageUrl(item.image)} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {e.target.src = 'https://via.placeholder.com/150'}}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <div className="font-bold text-gray-800 mb-1 text-base">{item.name}</div>
                                        <div className="text-sm text-gray-500">Số lượng: <span className="font-bold text-gray-900">{item.qty}</span></div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-pink-600 text-lg">
                                            {(item.price * item.qty).toLocaleString()}đ
                                        </div>
                                        <div className="text-xs text-gray-400">{item.price.toLocaleString()}đ / cái</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Tổng kết tiền */}
                        <div className="mt-6 bg-white p-6 rounded-xl border border-pink-100 space-y-3">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Tạm tính:</span>
                                <span>{order.itemsPrice?.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Phí vận chuyển:</span>
                                <span>{order.shippingPrice === 0 ? 'Miễn phí' : order.shippingPrice?.toLocaleString() + 'đ'}</span>
                            </div>
                            {order.taxPrice > 0 && (
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>Thuế:</span>
                                    <span>{order.taxPrice.toLocaleString()}đ</span>
                                </div>
                            )}
                            <div className="border-t border-dashed border-gray-300 my-2 pt-3 flex justify-between items-end">
                                <span className="font-bold text-gray-800 text-lg">Tổng cộng:</span>
                                <span className="text-2xl font-bold text-pink-600">{order.totalPrice?.toLocaleString()}đ</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;