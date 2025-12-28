import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus, Edit, Trash2, X, Loader, Image as ImageIcon, Upload, AlertCircle
} from "lucide-react";

// --- Axios config ---
const axiosClient = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const formatCurrency = (amount) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// ✅ DANH SÁCH VỊ
const FLAVORS = ['Vani', 'Socola', 'Dâu', 'Matcha', 'Phô mai', 'Trái cây', 'Cà phê', 'Khác'];

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    slug: "",
    description: "",
    price: 0,
    salePrice: 0,
    stock: 0,
    flavor: "Khác",
    category: "",
    images: [], 
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get("/products");
      setProducts(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Không thể tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn("Không tải được danh mục");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
      await axiosClient.delete(`/products/${id}`);
      fetchProducts();
      alert("Xóa thành công!");
    } catch (err) {
      alert("Xóa thất bại: " + (err.response?.data?.message || err.message));
    }
  };

  const uploadImage = async (file) => {
    const form = new FormData();
    form.append("image", file);
    const res = await axiosClient.post("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.image; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImages = formData.images;

      if (previewFile) {
        const imgUrl = await uploadImage(previewFile);
        finalImages = [{ url: imgUrl, alt: formData.name }];
      }

      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        description: formData.description,
        price: Number(formData.price),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        flavor: formData.flavor,
        category: formData.category,
        images: finalImages,
      };

      if (isEdit) {
        await axiosClient.put(`/products/${formData._id}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await axiosClient.post("/products", payload);
        alert("Thêm mới thành công!");
      }

      setShowModal(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const openAddModal = () => {
    setIsEdit(false);
    setPreviewFile(null);
    setFormData({ 
        _id: "", name: "", slug: "", description: "", 
        price: 0, salePrice: 0, stock: 0, 
        flavor: "Khác", category: "", images: [] 
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setIsEdit(true);
    setPreviewFile(null);
    setFormData({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      salePrice: product.salePrice,
      stock: product.stock || 0,
      flavor: product.flavor || "Khác",
      category: product.category?._id || product.category,
      images: product.images || [],
    });
    setShowModal(true);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewFile(file);
      setFormData({ ...formData, images: [{ url: URL.createObjectURL(file), alt: formData.name }] });
    }
  };

  const getDisplayImage = (img) => {
    if (!img) return null;
    if (img.url.startsWith("blob:") || img.url.startsWith("http")) return img.url;
    return `http://localhost:5000${img.url}`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản Lý Sản Phẩm</h1>
        <button onClick={openAddModal} className="bg-pink-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus size={20} /> Thêm sản phẩm
        </button>
      </div>

      {error && (
        <div className="bg-red-100 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        {loading ? (
          <div className="p-6 flex justify-center items-center">
            <Loader className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">Hình ảnh</th>
                <th className="p-4">Tên sản phẩm</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Vị</th>
                {/* ✅ SỬA TIÊU ĐỀ CỘT */}
                <th className="p-4">Tình trạng kho</th>
                <th className="p-4">Giá</th>
                <th className="p-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.length > 0 ? products.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="p-4 w-24">
                    {p.images?.[0]?.url ? (
                      <img src={getDisplayImage(p.images[0])} alt={p.name} className="w-16 h-16 object-cover rounded" />
                    ) : (
                      <ImageIcon size={24} className="text-gray-400" />
                    )}
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{p.category?.name || "Chưa phân loại"}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border border-gray-200">
                        {p.flavor || "Khác"}
                    </span>
                  </td>

                  {/* ✅ HIỂN THỊ TRẠNG THÁI KHO */}
                  <td className="p-4">
                    {p.stock > 0 ? (
                        <div className="flex flex-col items-start gap-1">
                            {/* Logic: <= 5 là Sắp hết (Vàng), > 5 là Còn hàng (Xanh) */}
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                                p.stock <= 5 
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200" 
                                : "bg-green-100 text-green-700 border-green-200"
                            }`}>
                                {p.stock <= 5 ? "Sắp hết" : "Còn hàng"}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">SL: {p.stock}</span>
                        </div>
                    ) : (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold border border-red-200">
                            Hết hàng
                        </span>
                    )}
                  </td>

                  <td className="p-4 font-semibold">{formatCurrency(p.salePrice > 0 ? p.salePrice : p.price)}</td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => openEditModal(p)} className="text-blue-600"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(p._id)} className="text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="p-6 text-center">Chưa có sản phẩm</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 overflow-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">{isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}</h2>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block mb-1 font-medium">Tên sản phẩm</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none" />
                </div>
                
                <div>
                    <label className="block mb-1 font-medium">Danh mục</label>
                    <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none">
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Hương vị chính</label>
                    <select 
                        required 
                        value={formData.flavor} 
                        onChange={e => setFormData({...formData, flavor: e.target.value})} 
                        className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none"
                    >
                        {FLAVORS.map(flav => (
                            <option key={flav} value={flav}>{flav}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-1 font-medium">Số lượng </label>
                    <input type="number" min="0" required value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none" />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Giá bán</label>
                    <input type="number" min="0" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none" />
                </div>
                <div>
                    <label className="block mb-1 font-medium">Giá khuyến mãi</label>
                    <input type="number" min="0" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Hình ảnh</label>
                <div className="border border-dashed p-4 rounded flex items-center gap-4 bg-gray-50">
                  <input type="file" accept="image/*" onChange={handleImageSelect} />
                  {previewFile && <span className="text-green-600 font-medium">Đã chọn ảnh</span>}
                </div>
              </div>

              <div>
                <label className="block mb-1 font-medium">Mô tả</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border px-3 py-2 rounded focus:border-pink-500 outline-none" rows={3} />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
                <button type="submit" disabled={isUploading} className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">{isUploading ? "Đang lưu..." : "Lưu sản phẩm"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;