import axios from 'axios';

const axiosClient = axios.create({
    // baseURL trỏ đúng vào port server và prefix /api bạn đã khai báo
    baseURL: 'http://localhost:5000/api', 
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true, // Bật dòng này nếu bạn muốn gửi Cookie
});

// Interceptor: Tự động gắn Token vào mọi request
axiosClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('ACCESS_TOKEN');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor: Xử lý lỗi trả về (ví dụ token hết hạn)
axiosClient.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // Nếu lỗi 401 (Unauthorized), xóa token và đá về login
        localStorage.removeItem('ACCESS_TOKEN');
        localStorage.removeItem('USER_INFO');
        // window.location.href = '/login'; 
    }
    throw error;
});

export default axiosClient;