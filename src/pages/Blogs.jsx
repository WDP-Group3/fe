import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from '../components/layout/PortalLayout';
import apiClient from '../services/apiClient';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
};

const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
};

const Blogs = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const category = searchParams.get('category');
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(category || 'Tất cả');

    useEffect(() => {
        setSelectedCategory(category || 'Tất cả');
        loadBlogs();
    }, [category]);

    const loadBlogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get('/blogs');
            // Backend trả về { total, blogs }
            const data = response.blogs || response.data?.blogs || response.data || [];
            setBlogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading blogs:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Tạo danh sách chuyên mục từ category
    const categories = ['Tất cả', ...Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)))];

    const filteredBlogs =
        selectedCategory === 'Tất cả'
            ? blogs
            : blogs.filter((b) => b.category === selectedCategory);

    return (
        <PortalLayout>
            {/* Page Header */}
            <div className="mb-6 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Bài Viết</h1>
                <nav className="mt-2 flex items-center gap-1 text-sm text-slate-500">
                    <Link to="/" className="text-indigo-600 hover:underline">
                        Trang chủ
                    </Link>
                    <span>/</span>
                    <span className="text-slate-700 font-medium">Bài viết</span>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex gap-8">
                {/* Left: Blog List */}
                <div className="flex-1 min-w-0">
                    {loading && (
                        <div className="flex justify-center py-16">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-10 text-red-600">
                            <p>Lỗi tải dữ liệu: {error}</p>
                            <button
                                onClick={loadBlogs}
                                className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && filteredBlogs.length === 0 && (
                        <div className="text-center py-16 text-slate-500">
                            <p className="text-lg">Chưa có bài viết nào</p>
                        </div>
                    )}

                    {!loading && !error && filteredBlogs.length > 0 && (
                        <div className="space-y-8">
                            {filteredBlogs.map((blog) => (
                                <div
                                    key={blog._id}
                                    className="flex gap-5 border-b border-slate-100 pb-8 cursor-pointer group"
                                    onClick={() => navigate(`/blogs/${blog._id}`)}
                                >
                                    {/* Thumbnail */}
                                    <div className="flex-shrink-0 w-44 h-32 overflow-hidden rounded-md bg-slate-100">
                                        {blog.thumbnail ? (
                                            <img
                                                src={blog.thumbnail}
                                                alt={blog.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-300">
                                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-base font-bold text-slate-800 uppercase leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                                            {blog.title}
                                        </h2>
                                        <p className="mt-2 text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                            {stripHtml(blog.content)} ...
                                        </p>
                                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                            {blog.author && (
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    {blog.author}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatDate(blog.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24">
                        {/* Category Box */}
                        <div className="rounded-sm overflow-hidden border border-slate-200">
                            <div className="bg-slate-800 px-4 py-3">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chuyên Mục</h3>
                            </div>
                            <ul>
                                {categories.map((cat) => (
                                    <li key={cat}>
                                        <button
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100 transition-colors text-left ${selectedCategory === cat
                                                ? 'text-indigo-600 font-semibold bg-indigo-50'
                                                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span>{cat}</span>
                                            <span className="text-xs text-slate-400">
                                                {cat === 'Tất cả'
                                                    ? blogs.length
                                                    : blogs.filter((b) => b.category === cat).length}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>
            </div>
        </PortalLayout>
    );
};

export default Blogs;
