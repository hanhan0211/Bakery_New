import React, { useState, useEffect } from 'react';
import { Search, Loader, Filter, ChevronDown, Banknote } from 'lucide-react'; // Đổi icon Chevron
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
};

const ProductPage = () => {
    const [products, setProducts] = useState([]); // Danh sách sản phẩm tích lũy
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // State quản lý Load More
    const [page, setPage] = useState(1); // Trang hiện tại (Internal State)
    const [hasMore, setHasMore] = useState(true); // Còn dữ liệu để load không?

    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy filter từ URL
    const maxPriceFilter = parseInt(searchParams.get("maxPrice")) || 1000000;
    const categoryId = searchParams.get("category") || "";
    const searchTerm = searchParams.get("q") || "";

    // 1. Load Categories
    useEffect(() => {
        axios.get("http://localhost:5000/api/categories")
            .then(res => setCategories(res.data))
            .catch(err => console.log(err));
    }, []);

    // 2. Reset khi thay đổi bộ lọc (Search, Category, Price)
    // Khi lọc, ta phải quay về trang 1 và xóa sạch list cũ
    useEffect(() => {
        setProducts([]);
        setPage(1);
        setHasMore(true);
        // Gọi hàm fetch ngay lập tức hoặc để useEffect dưới xử lý
    }, [maxPriceFilter, categoryId, searchTerm]);

    // 3. Load Products (Chạy khi page thay đổi hoặc bộ lọc thay đổi)
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                const params = {
                    q: searchTerm || undefined,
                    category: categoryId || undefined,
                    page: page, // Dùng state page
                    limit: 6,   // Mỗi lần bấm xem thêm tải 9 cái
                    maxPrice: maxPriceFilter < 1000000 ? maxPriceFilter : undefined
                };

                const res = await axios.get("http://localhost:5000/api/products", { params });
                const newItems = res.data.items || [];

                // --- 🌟 LOGIC QUAN TRỌNG: NỐI MẢNG ---
                if (page === 1) {
                    setProducts(newItems); // Nếu trang 1 (mới lọc) -> Thay thế hoàn toàn
                } else {
                    setProducts(prev => [...prev, ...newItems]); // Nếu trang > 1 -> Nối thêm vào đuôi
                }

                // Kiểm tra xem còn trang sau không
                // Nếu số trang hiện tại >= tổng số trang trả về -> Hết hàng để load
                if (page >= res.data.pages || newItems.length === 0) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }

            } catch (err) {
                console.log("Lỗi tải sản phẩm:", err);
            } finally {
                setLoading(false);
            }
        };

        // Debounce nhẹ
        const t = setTimeout(fetchProducts, 300);
        return () => clearTimeout(t);
    }, [page, maxPriceFilter, categoryId, searchTerm]); 


    // --- HANDLERS ---
    const handlePriceChange = (e) => {
        setSearchParams(prev => { prev.set("maxPrice", e.target.value); return prev; });
    };

    const handleCategoryChange = (id) => {
        setSearchParams(prev => { 
            if (id) prev.set("category", id); else prev.delete("category"); 
            return prev; 
        });
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchParams(prev => { 
            if (val) prev.set("q", val); else prev.delete("q"); 
            return prev; 
        });
    };

    const clearFilters = () => setSearchParams({});

    // Hàm bấm nút Xem thêm
    const handleLoadMore = () => {
        setPage(prev => prev + 1); // Tăng page lên -> useEffect sẽ chạy lại và nối thêm data
    };

    const formatCurrency = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
            <div className="bg-pink-100 py-12 mb-8 text-center">
                <h1 className="text-5xl font-extrabold text-pink-700 mb-3 font-serif">Thực Đơn Bánh Ngọt</h1>
                <p className="text-pink-500 text-lg">Hương vị ngọt ngào cho mọi khoảnh khắc</p>
            </div>

            <div className="container mx-auto px-4 pb-16 flex-grow">
                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* SIDEBAR (Giữ nguyên) */}
                    <aside className="w-full lg:w-1/4 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-4">
                            <div className="mb-8">
                                <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Filter className="w-5 h-5 text-pink-500" /> Danh Mục</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button onClick={() => handleCategoryChange("")} className={`w-full px-3 py-2 rounded-lg flex justify-between ${categoryId === "" ? "bg-pink-50 text-pink-700 font-bold" : "hover:bg-gray-50"}`}>
                                            <span>Tất cả bánh</span>{categoryId === "" && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                        </button>
                                    </li>
                                    {categories.map(cat => (
                                        <li key={cat._id}>
                                            <button onClick={() => handleCategoryChange(cat._id)} className={`w-full px-3 py-2 rounded-lg flex justify-between ${categoryId === cat._id ? "bg-pink-50 text-pink-700 font-bold" : "hover:bg-gray-50"}`}>
                                                <span>{cat.name}</span>{categoryId === cat._id && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><Banknote className="w-5 h-5 text-pink-500" /> Lọc Theo Giá</h3>
                                <input type="range" min="0" max="1000000" step="10000" value={maxPriceFilter} onChange={handlePriceChange} className="w-full accent-pink-500 cursor-pointer" />
                                <p className="mt-2 text-center text-sm text-gray-700">Giá dưới <b>{formatCurrency(maxPriceFilter)}</b></p>
                            </div>
                        </div>
                    </aside>

                    {/* PRODUCT LIST */}
                    <main className="w-full lg:w-3/4">
                        <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-pink-100">
                            <div className="relative">
                                <input type="text" placeholder="Bạn đang tìm bánh gì..." value={searchTerm} onChange={handleSearch} className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition" />
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                            </div>
                        </div>

                        {/* List sản phẩm */}
                        {products.length === 0 && !loading ? (
                            <div className="text-center py-24">
                                <Search className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Không tìm thấy bánh nào</p>
                                <button className="text-pink-600 underline mt-3 hover:text-pink-800" onClick={clearFilters}>Xóa bộ lọc</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {products.map(product => {
                                    const productSlug = product.slug || product?.slug?.current;
                                    const img = getImageUrl(product?.images?.[0]?.url);
                                    return (
                                        <Link to={`/san-pham/${productSlug}`} key={product._id} className="group bg-white p-3 rounded-2xl shadow-sm hover:shadow-xl transition border border-transparent hover:border-pink-100 block">
                                            <div className="h-60 rounded-xl overflow-hidden bg-gray-100 mb-4 relative">
                                                <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" onError={(e) => {e.target.src = 'https://via.placeholder.com/400x400?text=Error'}} />
                                                {product.stock === 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold uppercase">Hết hàng</div>}
                                            </div>
                                            <h3 className="font-bold text-lg mb-1 text-gray-800 group-hover:text-pink-600 transition line-clamp-1">{product.name}</h3>
                                            <p className="text-pink-600 text-xl font-bold">{formatCurrency(product.price)}</p>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}

                        {/* ✅ NÚT XEM THÊM (LOAD MORE) */}
                        <div className="mt-12 text-center">
                            {loading && (
                                <div className="flex justify-center mb-4"><Loader className="w-8 h-8 animate-spin text-pink-500" /></div>
                            )}
                            
                            {!loading && hasMore && products.length > 0 && (
                                <button 
                                    onClick={handleLoadMore}
                                    className="bg-white border border-pink-200 text-pink-600 hover:bg-pink-50 font-bold py-3 px-8 rounded-full shadow-sm hover:shadow-md transition-all transform active:scale-95 flex items-center gap-2 mx-auto"
                                >
                                    Xem thêm bánh <ChevronDown size={20} />
                                </button>
                            )}

                            {!loading && !hasMore && products.length > 0 && (
                                <p className="text-gray-400 italic">Đã hiển thị tất cả sản phẩm</p>
                            )}
                        </div>

                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
