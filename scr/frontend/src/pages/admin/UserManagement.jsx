import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Trash2, Mail, Phone, MapPin, Shield, User } from 'lucide-react';

// Hàm helper xử lý ảnh (như bài trước)
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150?text=User'; // Ảnh mặc định nếu không có avatar
    if (path.startsWith("http")) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:5000${cleanPath}`;
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Gọi API lấy danh sách
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Lỗi lấy danh sách user:", error);
      alert("Không thể tải danh sách khách hàng!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Xử lý xóa user
  const handleDelete = async (userId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn khách hàng này không? Hành động này không thể hoàn tác.")) {
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        await axios.delete(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Cập nhật lại danh sách trên giao diện sau khi xóa thành công
        setUsers(users.filter(user => user._id !== userId));
        alert("Đã xóa thành công!");
      } catch (error) {
        console.error("Lỗi xóa user:", error);
        alert("Lỗi khi xóa người dùng.");
      }
    }
  };

  // 3. Lọc danh sách theo từ khóa tìm kiếm
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải danh sách khách hàng...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <User className="text-blue-600" /> Quản Lý Khách Hàng
            </h2>
            <p className="text-sm text-gray-500 mt-1">Tổng số: {users.length} khách hàng</p>
        </div>

        {/* Ô tìm kiếm */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc email..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Bảng danh sách */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-4 rounded-tl-lg">Khách hàng</th>
              <th className="p-4">Liên hệ</th>
              <th className="p-4">Địa chỉ</th>
              <th className="p-4">Ngày đăng ký</th>
              <th className="p-4 rounded-tr-lg text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id} className="border-b border-gray-100 hover:bg-blue-50/30 transition group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200">
                        <img 
                            src={getImageUrl(user.avatarUrl)} 
                            alt={user.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=U'} 
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                            {user.role}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={14} /> {user.email}
                        </div>
                        {user.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} /> {user.phone}
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                    {user.address ? (
                        <div className="flex items-center gap-2" title={user.address}>
                            <MapPin size={14} className="flex-shrink-0" /> <span className="truncate">{user.address}</span>
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">Chưa cập nhật</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Xóa khách hàng"
                    >
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
                    Không tìm thấy khách hàng nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;