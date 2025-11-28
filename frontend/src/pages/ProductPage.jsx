import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Loader, Star, Heart, Banknote, Filter } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// --- HELPER: Xử lý link ảnh ---
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/400x400?text=No+Image';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

const ProductPage = () => { 
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Lấy giá trị filter từ URL
  const maxPriceFilter = parseInt(searchParams.get("maxPrice")) || 1000000; 
  const categoryId = searchParams.get("category") || "";
  const searchTerm = searchParams.get("q") || "";

  // 1. Load danh mục từ API (để hiển thị sidebar)
  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/categories');
            setCategories(res.data);
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
        }
    };
    fetchCategories();
  }, []);

  // 2. Load sản phẩm từ API (khi filter thay đổi)
  useEffect(() => {
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                limit: 20, // Phân trang nếu cần
                q: searchTerm || undefined,
                category: categoryId || undefined,
                // Logic maxPrice cần backend hỗ trợ lọc <= giá này
                // Nếu backend chưa hỗ trợ, ta có thể lọc tạm ở frontend sau khi fetch
            };

            const res = await axios.get('http://localhost:5000/api/products', { params });
            
            let fetchedProducts = res.data.items || []; // Giả sử backend trả về { items: [...] }

            // Lọc giá ở Frontend (nếu backend chưa làm)
            if (maxPriceFilter < 1000000) {
                fetchedProducts = fetchedProducts.filter(p => p.price <= maxPriceFilter);
            }

            setProducts(fetchedProducts);
            setTotal(res.data.total || fetchedProducts.length);
        } catch (err) {
            console.error("Lỗi tải sản phẩm:", err);
        } finally {
            setLoading(false);
        }
    };
    
    // Debounce call API
    const timeoutId = setTimeout(() => {
        fetchProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [maxPriceFilter, searchTerm, categoryId]);

  // --- HANDLERS ---
  const handlePriceChange = (e) => {
      const value = e.target.value;
      setSearchParams(prev => {
          prev.set("maxPrice", value);
          return prev;
      });
  }

  const handleCategoryChange = (id) => {
    setSearchParams(prev => {
        if(id) prev.set("category", id);
        else prev.delete("category");
        return prev;
    });
  };

  const handleSearch = (e) => {
      const val = e.target.value;
      setSearchParams(prev => {
          if(val) prev.set("q", val);
          else prev.delete("q");
          return prev;
      });
  }

  const clearFilters = () => {
      setSearchParams({});
  }

  const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans flex flex-col">
      {/* Header Banner */}
      <div className="bg-pink-100 py-12 mb-8">
        <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-pink-700 mb-3 font-serif">Thực Đơn Bánh Ngọt</h1>
            <p className="text-pink-500 text-lg">Hương vị ngọt ngào cho mọi khoảnh khắc</p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filter */}
          <aside className="w-full lg:w-1/4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 sticky top-4">
                
                {/* Filter: Categories */}
                <div className="mb-8">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                        <Filter className="w-5 h-5 text-pink-500" /> Danh Mục
                    </h3>
                    <ul className="space-y-2">
                        <li>
                            <button 
                                onClick={() => handleCategoryChange("")}
                                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                                    categoryId === "" 
                                    ? "bg-pink-50 text-pink-700 font-bold" 
                                    : "hover:bg-gray-50 text-gray-600"
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
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                                        categoryId === cat._id 
                                        ? "bg-pink-50 text-pink-700 font-bold" 
                                        : "hover:bg-gray-50 text-gray-600"
                                    }`}
                                >
                                    <span>{cat.name}</span>
                                    {categoryId === cat._id && <div className="w-2 h-2 bg-pink-500 rounded-full"></div>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Filter: Price Slider */}
                <div>
                    <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gray-800 border-b border-gray-100 pb-2">
                        <Banknote className="w-5 h-5 text-pink-500" /> Lọc Theo Giá
                    </h3>
                    <div className="px-2">
                        <div className="flex justify-between items-center mb-4 text-sm font-medium text-gray-600">
                            <span>0 ₫</span>
                            <span className="text-pink-600 font-bold">{formatCurrency(maxPriceFilter)}</span>
                        </div>
                        <input 
                            type="range" min="0" max="1000000" step="10000"
                            value={maxPriceFilter} 
                            onChange={handlePriceChange}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-600"
                        />
                        <div className="mt-4 text-xs text-gray-500 text-center">Kéo để xem các bánh có giá dưới mức này</div>
                    </div>
                </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="w-full lg:w-3/4">
            
            {/* Search & Status Bar */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-pink-100 gap-4">
                    <div className="relative w-full md:w-96">
                        <input 
                            type="text" placeholder="Bạn đang tìm bánh gì..." 
                            value={searchTerm} onChange={handleSearch}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-pink-300 rounded-xl focus:outline-none transition-all placeholder-gray-400 text-gray-700"
                        />
                        <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
                    </div>
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                        Hiển thị <span className="font-bold text-gray-800">{products.length}</span> sản phẩm
                    </div>
                </div>

                {/* Active Filters Chips */}
                {(categoryId || maxPriceFilter < 1000000 || searchTerm) && (
                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-gray-500 mr-2">Đang lọc theo:</span>
                        {categoryId && (
                            <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                {categories.find(c => c._id === categoryId)?.name || 'Danh mục'}
                                <button onClick={() => handleCategoryChange("")} className="hover:text-pink-900">×</button>
                            </span>
                        )}
                        {maxPriceFilter < 1000000 && (
                             <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                Giá dưới {formatCurrency(maxPriceFilter)}
                                <button onClick={() => setSearchParams(prev => { prev.delete("maxPrice"); return prev; })} className="hover:text-pink-900">×</button>
                            </span>
                        )}
                        {searchTerm && (
                            <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                "{searchTerm}"
                                <button onClick={() => handleSearch({target: {value: ""}})} className="hover:text-pink-900">×</button>
                            </span>
                        )}
                        <button onClick={clearFilters} className="text-xs text-gray-500 underline hover:text-pink-600 ml-2">Xóa tất cả</button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 h-64">
                    <Loader className="w-10 h-10 text-pink-500 animate-spin mb-4"/> 
                    <p className="text-gray-500 animate-pulse">Đang lấy bánh từ lò nướng...</p>
                </div>
            ) : (
                products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <Link to={`/san-pham/${product.slug}`} key={product._id} 
                                className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-pink-100 relative flex flex-col"
                            >
                                <div className="relative h-60 overflow-hidden rounded-xl bg-gray-100 mb-4">
                                    <img 
                                        src={getImageUrl(product.images?.[0]?.url)} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out"
                                        onError={(e) => {e.target.src = 'https://via.placeholder.com/400x400?text=No+Image'}} 
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                        <button className="bg-white p-2.5 rounded-full text-pink-600 hover:bg-pink-600 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 shadow-lg">
                                            <ShoppingCart size={20} />
                                        </button>
                                        <button className="bg-white p-2.5 rounded-full text-pink-600 hover:bg-pink-600 hover:text-white transition-colors transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 shadow-lg">
                                            <Heart size={20} />
                                        </button>
                                    </div>
                                    {product.category && (
                                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-pink-600 shadow-sm">
                                            {product.category.name}
                                        </span>
                                    )}
                                </div>

                                <div className="px-2 pb-2 flex-grow flex flex-col">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-pink-600 transition-colors line-clamp-1" title={product.name}>
                                        {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-3">
                                        {[1,2,3,4,5].map(star => (<Star key={star} size={14} className="fill-yellow-400 text-yellow-400" />))}
                                        <span className="text-xs text-gray-400 ml-1">(50+)</span>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between">
                                        <div><span className="text-xl font-bold text-pink-600">{product.price?.toLocaleString()}đ</span></div>
                                        <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                                            <ShoppingCart size={16} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-dashed border-gray-300">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Không tìm thấy bánh nào</h3>
                        <p className="text-gray-500">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác nhé.</p>
                        <button onClick={clearFilters} className="mt-4 text-pink-600 font-medium hover:underline">Xóa tất cả bộ lọc</button>
                    </div>
                )
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;