import React, { useState, useEffect } from 'react';
import { 
  Star, Minus, Plus, ShoppingCart, ShieldCheck, 
  Check, ChevronRight, Search, MessageSquare, User 
} from 'lucide-react';
// ✅ THÊM: import useLocation
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Footer from '../components/Footer'; // Giả sử bạn tách Footer ra, nếu chưa thì giữ nguyên Footer cũ

// --- HELPER: Xử lý link ảnh ---
const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/500x500?text=No+Image';
    if (path.startsWith('http')) return path;
    return `http://localhost:5000${path}`;
};

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Hook lấy thông tin URL
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  // --- STATE CHO REVIEW ---
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Scroll lên đầu trang khi đổi sản phẩm
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // ✅ EFFECT MỚI: Tự động cuộn xuống phần review nếu có #reviews trên URL
  useEffect(() => {
    if (location.hash === '#reviews' && !loading && reviews) {
        const element = document.getElementById('reviews');
        if (element) {
            // Đợi 1 xíu cho giao diện render ổn định rồi cuộn
            setTimeout(() => {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }
  }, [location, loading, reviews]);

  // Fetch dữ liệu sản phẩm
  useEffect(() => {
    const fetchProductData = async () => {
        if (!slug || slug === "undefined") {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(false);
        try {
            const res = await axios.get(`http://localhost:5000/api/products/slug/${slug}`);
            const productData = res.data;
            setProduct(productData);

            if (productData && productData.category) {
                const catId = productData.category._id || productData.category;
                const relatedRes = await axios.get(`http://localhost:5000/api/products`, {
                    params: { category: catId, limit: 4 }
                });
                const relatedItems = relatedRes.data.items || [];
                setRelatedProducts(relatedItems.filter(p => p._id !== productData._id));
            }
        } catch (err) {
            console.error("Lỗi tải sản phẩm:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    fetchProductData();
  }, [slug]);

  // --- LẤY DANH SÁCH REVIEW ---
  useEffect(() => {
    if (product?._id) {
        const fetchReviews = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/reviews?productId=${product._id}`);
                setReviews(res.data);
            } catch (err) {
                console.error("Lỗi tải review:", err);
            }
        };
        fetchReviews();
    }
  }, [product]);

  // --- HÀM XỬ LÝ THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = async () => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
        if(window.confirm("Bạn cần đăng nhập để mua bánh. Đi đến trang đăng nhập ngay?")) {
            navigate("/login");
        }
        return;
    }

    setAddingToCart(true);
    try {
        await axios.post('http://localhost:5000/api/cart/add', {
            productId: product._id,
            qty: quantity,
            attrs: {}
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        // BẮN SỰ KIỆN ĐỂ APP.JS CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG
        window.dispatchEvent(new Event("CART_UPDATED"));

        alert(`Đã thêm thành công ${quantity} chiếc "${product.name}" vào giỏ hàng!`);
    } catch (err) {
        console.error(err);
        alert("Lỗi: Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    } finally {
        setAddingToCart(false);
    }
  };

  // --- HÀM GỬI REVIEW ---
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("ACCESS_TOKEN");
    
    if (!token) {
        alert("Bạn cần đăng nhập để đánh giá!");
        navigate("/login");
        return;
    }
    if (userRating === 0) {
        alert("Vui lòng chọn số sao!");
        return;
    }

    setSubmittingReview(true);
    try {
        await axios.post('http://localhost:5000/api/reviews', {
            productId: product._id,
            rating: userRating,
            title: reviewTitle,
            content: reviewContent 
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        alert("Cảm ơn bạn đã đánh giá!");
        
        // Reset form
        setUserRating(0);
        setReviewTitle("");
        setReviewContent("");
        
        // Load lại danh sách review ngay lập tức
        const res = await axios.get(`http://localhost:5000/api/reviews?productId=${product._id}`);
        setReviews(res.data);

    } catch (err) {
        console.error(err);
        alert("Lỗi: " + (err.response?.data?.message || "Không thể gửi đánh giá"));
    } finally {
        setSubmittingReview(false);
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
                  <div className="text-pink-500 font-medium animate-pulse">Đang tải chi tiết bánh...</div>
              </div>
          </div>
      );
  }

  if (error || !product) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 bg-gray-50">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy sản phẩm</h2>
                <p className="text-gray-500 mb-6">Sản phẩm này có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
                <Link to="/san-pham" className="bg-pink-600 text-white px-6 py-3 rounded-full hover:bg-pink-700 transition font-medium">
                    Quay lại thực đơn
                </Link>
            </div>
        </div>
      );
  }

  const images = product.images && product.images.length > 0 ? product.images : [{ url: '' }];
  const mainImage = getImageUrl(images[selectedImageIndex]?.url);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800 flex flex-col">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3 text-sm text-gray-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <Link to="/" className="hover:text-pink-600">Trang chủ</Link>
              <ChevronRight size={14} />
              <Link to="/san-pham" className="hover:text-pink-600">Thực đơn</Link>
              <ChevronRight size={14} />
              {product.category && (
                  <>
                    <Link to={`/san-pham?category=${product.category._id}`} className="hover:text-pink-600">
                        {product.category.name}
                    </Link>
                    <ChevronRight size={14} />
                  </>
              )}
              <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-pink-50">
            <div className="flex flex-col lg:flex-row gap-10">
                {/* LEFT: Images */}
                <div className="w-full lg:w-1/2 space-y-4">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group border border-gray-100">
                        <img 
                            src={mainImage} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {e.target.src = 'https://via.placeholder.com/500x500?text=No+Image'}}
                        />
                        {/* SALE BADGE */}
                        {product.salePrice > 0 && product.salePrice < product.price && (
                             <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                -{Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                             </div>
                        )}
                    </div>
                    {images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-pink-200">
                            {images.map((img, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${selectedImageIndex === idx ? 'border-pink-500 opacity-100 ring-2 ring-pink-200' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                >
                                    <img 
                                        src={getImageUrl(img.url)} 
                                        alt="" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {e.target.src = 'https://via.placeholder.com/100?text=Error'}}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT: Info */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                        {product.category && (
                            <span className="bg-pink-100 text-pink-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide hover:bg-pink-200 transition cursor-pointer">
                                <Link to={`/san-pham?category=${product.category._id}`}>{product.category.name}</Link>
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 font-serif leading-tight">{product.name}</h1>
                    
                    <div className="mb-8 bg-pink-50/50 p-5 rounded-2xl border border-pink-100 inline-block w-full mt-4">
                          <div className="flex items-end gap-3">
                            {product.salePrice > 0 && product.salePrice < product.price ? (
                                <>
                                    <span className="text-4xl font-bold text-pink-600">{product.salePrice.toLocaleString()}đ</span>
                                    <span className="text-xl text-gray-400 line-through mb-1.5 font-medium">{product.price.toLocaleString()}đ</span>
                                </>
                            ) : (
                                <span className="text-4xl font-bold text-pink-600">{product.price.toLocaleString()}đ</span>
                            )}
                          </div>
                    </div>

                    <p className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line text-base">
                        {product.description || "Đang cập nhật mô tả cho chiếc bánh thơm ngon này..."}
                    </p>

                    {/* HIỂN THỊ TRẠNG THÁI KHO */}
                    <div className="mb-6">
                        {product.stock > 0 ? (
                            <div className="flex items-center gap-2 text-green-600 font-medium bg-green-50 px-3 py-1 rounded-lg w-fit">
                                <Check size={18} /> 
                                <span>Còn hàng (<b>{product.stock}</b> sản phẩm)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-500 font-medium bg-red-50 px-3 py-1 rounded-lg w-fit">
                                <ShieldCheck size={18} /> 
                                <span>Tạm hết hàng</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8 pt-4 border-t border-gray-100">
                        {/* 1. Nút tăng giảm số lượng */}
                        <div className="flex items-center border border-gray-300 rounded-xl w-fit bg-white h-12 shadow-sm">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                disabled={product.stock === 0}
                                className="px-4 h-full hover:bg-gray-100 text-gray-600 transition-colors flex items-center justify-center rounded-l-xl disabled:opacity-50"
                            >
                                <Minus size={16} />
                            </button>
                            
                            <span className="w-12 text-center font-bold text-lg text-gray-800">
                                {product.stock === 0 ? 0 : quantity}
                            </span>
                            
                            <button 
                                onClick={() => {
                                    if (quantity < product.stock) {
                                        setQuantity(quantity + 1);
                                    } else {
                                        alert(`Xin lỗi, chỉ còn ${product.stock} sản phẩm trong kho!`);
                                    }
                                }}
                                disabled={quantity >= product.stock || product.stock === 0}
                                className={`px-4 h-full flex items-center justify-center rounded-r-xl transition-colors
                                    ${quantity >= product.stock 
                                        ? 'text-gray-300 cursor-not-allowed' 
                                        : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        
                        {/* 2. Nút Thêm vào giỏ hàng */}
                        <button 
                            onClick={handleAddToCart}
                            disabled={addingToCart || product.stock === 0} 
                            className={`flex-1 font-bold py-3 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform h-12 
                                ${product.stock === 0
                                    ? 'bg-gray-400 text-white cursor-not-allowed shadow-none'
                                    : addingToCart 
                                        ? 'bg-pink-400 text-white cursor-wait' 
                                        : 'bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200 active:scale-[0.98]'
                                }`}
                        >
                            {product.stock === 0 ? (
                                <>HẾT HÀNG</>
                            ) : addingToCart ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={20} />
                                    Thêm vào giỏ hàng
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- PHẦN ĐÁNH GIÁ SẢN PHẨM --- */}
            {/* ✅ QUAN TRỌNG: Thêm id="reviews" vào đây để link cuộn tới */}
            <div id="reviews" className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12 border-t border-gray-100 pt-12">
                
                {/* CỘT TRÁI: DANH SÁCH ĐÁNH GIÁ */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <MessageSquare className="text-pink-600" /> Đánh giá từ khách hàng
                    </h3>

                    {reviews.length === 0 ? (
                        <p className="text-gray-500 italic">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                    ) : (
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                            {reviews.map((rv) => (
                                <div key={rv._id} className="border-b border-gray-100 pb-6 last:border-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800">{rv.user?.name || "Khách hàng"}</div>
                                                <div className="text-xs text-gray-400">{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        </div>
                                        <div className="flex bg-yellow-50 px-2 py-1 rounded-lg">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={14} 
                                                    className={i < rv.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {rv.title && <h4 className="font-bold text-gray-700 text-sm mb-1">{rv.title}</h4>}
                                    <p className="text-gray-600 text-sm leading-relaxed">{rv.content}</p>
                                    
                                    {/* Hiển thị phản hồi của Admin nếu có */}
                                    {rv.adminResponse && (
                                        <div className="mt-3 ml-4 bg-gray-50 p-3 rounded-lg border-l-4 border-pink-400">
                                            <p className="text-xs font-bold text-pink-600 mb-1">Phản hồi từ cửa hàng:</p>
                                            <p className="text-sm text-gray-600">{rv.adminResponse}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CỘT PHẢI: FORM VIẾT ĐÁNH GIÁ */}
                <div className="bg-pink-50/50 p-8 rounded-2xl border border-pink-100 h-fit">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Viết nhận xét của bạn</h3>
                    
                    <form onSubmit={handleSubmitReview}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bạn chấm mấy sao?</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setUserRating(star)}
                                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Star 
                                            size={32} 
                                            className={star <= userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề (Không bắt buộc)</label>
                            <input 
                                type="text"
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 bg-white"
                                placeholder="Ví dụ: Bánh rất ngon, giao hàng nhanh..."
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nội dung chi tiết</label>
                            <textarea 
                                rows="4"
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-pink-500 bg-white"
                                placeholder="Chia sẻ cảm nhận của bạn về sản phẩm này..."
                                required
                            ></textarea>
                        </div>

                        <button 
                            type="submit"
                            disabled={submittingReview}
                            className="w-full bg-pink-600 text-white font-bold py-3 rounded-xl hover:bg-pink-700 transition shadow-lg shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submittingReview ? "Đang gửi..." : "Gửi Đánh Giá"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <div className="mt-16 border-t border-gray-100 pt-10">
                    <div className="flex justify-between items-end mb-8">
                        <h3 className="text-2xl font-bold text-gray-900 font-serif">Có thể bạn sẽ thích</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {relatedProducts.map(rel => (
                            <Link to={`/san-pham/${rel.slug}`} key={rel._id} className="group cursor-pointer block bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:border-pink-100 transition-all duration-300 overflow-hidden h-full flex flex-col">
                                <div className="overflow-hidden bg-gray-100 aspect-square relative">
                                    <img 
                                        src={getImageUrl(rel.images?.[0]?.url)} 
                                        alt={rel.name} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={(e) => {e.target.src = 'https://via.placeholder.com/300x300?text=No+Image'}} 
                                    />
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h4 className="font-bold text-gray-800 group-hover:text-pink-600 transition-colors text-base mb-1 line-clamp-2">{rel.name}</h4>
                                    <div className="mt-auto pt-2">
                                        <span className="text-pink-600 font-bold">{rel.price.toLocaleString()}đ</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </main>
      {/* <Footer /> // Tạm ẩn để tránh lỗi nếu bạn chưa import */}
    </div>
  );
};

export default ProductDetailPage;