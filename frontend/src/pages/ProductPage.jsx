import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Loader, Star, Heart, Banknote, Filter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// Xử lý ảnh chuẩn
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (path.startsWith("http")) return path;
    return `http://localhost:5000${path}`;
};

const ProductPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    const maxPriceFilter = parseInt(searchParams.get("maxPrice")) || 1000000;
    const categoryId = searchParams.get("category") || "";
    const searchTerm = searchParams.get("q") || "";

    // Load categories
    useEffect(() => {
        axios
            .get("http://localhost:5000/api/categories")
            .then(res => setCategories(res.data))
            .catch(err => console.log("Lỗi tải danh mục:", err));
    }, []);

    // Load products
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                const params = {
                    q: searchTerm || undefined,
                    category: categoryId || undefined,
                };

                const res = await axios.get("http://localhost:5000/api/products", { params });
                let fetched = res.data.items || [];

                // Lọc giá ở FE
                if (maxPriceFilter < 1000000) {
                    fetched = fetched.filter(p => p.price <= maxPriceFilter);
                }

                setProducts(fetched);
            } catch (err) {
                console.log("Lỗi tải sản phẩm:", err);
            } finally {
                setLoading(false);
            }
        };

        const t = setTimeout(fetchProducts, 300);
        return () => clearTimeout(t);
    }, [maxPriceFilter, categoryId, searchTerm]);

    // --- HANDLERS ---
    const handlePriceChange = (e) => {
        const value = e.target.value;
        setSearchParams(prev => {
            prev.set("maxPrice", value);
            return prev;
        });
    };

    const handleCategoryChange = (id) => {
        setSearchParams(prev => {
            if (id) prev.set("category", id);
            else prev.delete("category");
            return prev;
        });
    };

    const handleSearch = (e) => {
        const val = e.target.value;
        setSearchParams(prev => {
            if (val) prev.set("q", val);
            else prev.delete("q");
            return prev;
        });
    };

    const clearFilters = () => setSearchParams({});

    const formatCurrency = (n) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

    return (
        <div className="bg-gray-50 min-h-screen font-sans flex flex-col">

            {/* Banner */}
            <div className="bg-pink-100 py-12 mb-8 text-center">
                <h1 className="text-5xl font-extrabold text-pink-700 mb-3 font-serif">Thực Đơn Bánh Ngọt</h1>
                <p className="text-pink-500 text-lg">Hương vị ngọt ngào cho mọi khoảnh khắc</p>
            </div>

            <div className="container mx-auto px-4 pb-16 flex-grow">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-1/4 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-4">

                            {/* CATEGORIES */}
                            <div className="mb-8">
                                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-pink-500" /> Danh Mục
                                </h3>
                                <ul className="space-y-2">
                                    <li>
                                        <button
                                            onClick={() => handleCategoryChange("")}
                                            className={`w-full px-3 py-2 rounded-lg flex justify-between ${
                                                categoryId === "" ? "bg-pink-50 text-pink-700 font-bold" : "hover:bg-gray-50"
                                            }`}
                                        >
                                            <span>Tất cả bánh</span>
                                            {categoryId === "" && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                        </button>
                                    </li>

                                    {categories.map(cat => (
                                        <li key={cat._id}>
                                            <button
                                                onClick={() => handleCategoryChange(cat._id)}
                                                className={`w-full px-3 py-2 rounded-lg flex justify-between ${
                                                    categoryId === cat._id
                                                        ? "bg-pink-50 text-pink-700 font-bold"
                                                        : "hover:bg-gray-50"
                                                }`}
                                            >
                                                <span>{cat.name}</span>
                                                {categoryId === cat._id && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* PRICE FILTER */}
                            <div>
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                                    <Banknote className="w-5 h-5 text-pink-500" /> Lọc Theo Giá
                                </h3>

                                <input
                                    type="range"
                                    min="0"
                                    max="1000000"
                                    step="10000"
                                    value={maxPriceFilter}
                                    onChange={handlePriceChange}
                                    className="w-full accent-pink-500"
                                />

                                <p className="mt-2 text-center text-sm text-gray-700">
                                    Giá dưới <b>{formatCurrency(maxPriceFilter)}</b>
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* PRODUCT LIST */}
                    <main className="w-full lg:w-3/4">

                        {/* SEARCH */}
                        <div className="mb-8 bg-white p-4 rounded-2xl shadow-sm border border-pink-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Bạn đang tìm bánh gì..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl"
                                />
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center py-20">
                                <Loader className="w-10 h-10 animate-spin text-pink-500" />
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-24">
                                <Search className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">Không tìm thấy bánh nào</p>
                                <button className="text-pink-600 underline mt-3" onClick={clearFilters}>
                                    Xóa bộ lọc
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

                                {products.map(product => {
                                    const productSlug = product.slug || product?.slug?.current;
                                    const img = getImageUrl(product?.images?.[0]?.url);

                                    return (
                                        <Link
                                            to={`/san-pham/${productSlug}`}
                                            key={product._id}
                                            className="group bg-white p-3 rounded-2xl shadow-sm hover:shadow-xl transition"
                                        >
                                            <div className="h-60 rounded-xl overflow-hidden bg-gray-100 mb-4">
                                                <img
                                                    src={img}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                                />
                                            </div>

                                            <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                                            <p className="text-pink-600 text-xl font-bold">
                                                {product.price.toLocaleString()}đ
                                            </p>
                                        </Link>
                                    );
                                })}

                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
