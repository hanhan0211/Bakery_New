import React from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-4 rounded-full ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng Quan Kinh Doanh</h1>
      
      {/* Cards thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Doanh thu tháng" value="45.200.000đ" icon={<DollarSign size={24}/>} color="bg-green-500" />
        <StatCard title="Đơn hàng mới" value="124" icon={<ShoppingCart size={24}/>} color="bg-blue-500" />
        <StatCard title="Khách hàng" value="1,205" icon={<Users size={24}/>} color="bg-purple-500" />
        <StatCard title="Tổng sản phẩm" value="48" icon={<Package size={24}/>} color="bg-pink-500" />
      </div>

      {/* Biểu đồ giả lập hoặc bảng đơn hàng mới nhất */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg mb-4">Đơn hàng gần đây</h3>
        <table className="w-full text-left">
            <thead>
                <tr className="text-gray-500 text-sm border-b">
                    <th className="pb-3">Mã đơn</th>
                    <th className="pb-3">Khách hàng</th>
                    <th className="pb-3">Ngày đặt</th>
                    <th className="pb-3">Tổng tiền</th>
                    <th className="pb-3">Trạng thái</th>
                </tr>
            </thead>
            <tbody className="text-gray-700">
                <tr className="border-b">
                    <td className="py-3 text-blue-600">#ORD-001</td>
                    <td className="py-3">Nguyễn Văn A</td>
                    <td className="py-3">25/11/2025</td>
                    <td className="py-3 font-bold">550.000đ</td>
                    <td className="py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Chờ xử lý</span></td>
                </tr>
                {/* Thêm row giả lập khác... */}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;