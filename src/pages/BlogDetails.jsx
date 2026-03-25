import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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

// Star Rating Component
const StarRating = ({ rating = 0, total = 0 }) => {
    const stars = [1, 2, 3, 4, 5];
    return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>({total} votes)</span>
            <span className="font-medium text-slate-700">{rating.toFixed(1)}/5</span>
            <div className="flex items-center gap-0.5">
                {stars.map((s) => (
                    <svg
                        key={s}
                        className={`w-5 h-5 ${s <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        </div>
    );
};

const BlogDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [allBlogs, setAllBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Tất cả');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        loadBlog();
        loadAllBlogs();
    }, [id]);

    const loadBlog = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get(`/blogs/${id}`);
            // Backend returns blog object directly
            setBlog(response);
        } catch (err) {
            console.error('Error loading blog:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loadAllBlogs = async () => {
        try {
            const response = await apiClient.get('/blogs');
            const data = response.blogs || [];
            setAllBlogs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading blogs:', err);
        }
    };

    // Categories from all blogs
    const categories = ['Tất cả', ...Array.from(new Set(allBlogs.map((b) => b.category).filter(Boolean)))];

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const shareUrl = encodeURIComponent(window.location.href);
    const shareTitle = encodeURIComponent(blog?.title || '');

    return (
        <PortalLayout>
            {/* Page Header */}
            <div className="mb-6 border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Bài Viết</h1>
                <nav className="mt-2 flex items-center gap-1 text-sm text-slate-500 flex-wrap">
                    <Link to="/" className="text-indigo-600 hover:underline">
                        Trang chủ
                    </Link>
                    <span>/</span>
                    <Link to="/blogs" className="text-indigo-600 hover:underline">
                        Bài viết
                    </Link>
                    {blog && (
                        <>
                            <span>/</span>
                            <span className="text-slate-700 line-clamp-1 max-w-xs" title={blog.title}>{blog.title}</span>
                        </>
                    )}
                </nav>
            </div>

            {/* Main Layout */}
            <div className="flex gap-8">
                {/* Left: Article */}
                <div className="flex-1 min-w-0">
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                        </div>
                    )}

                    {error && (
                        <div className="text-center py-10">
                            <p className="text-red-600">Không tìm thấy bài viết</p>
                            <button
                                onClick={() => navigate('/blogs')}
                                className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                ← Quay lại danh sách
                            </button>
                        </div>
                    )}

                    {!loading && !error && blog && (
                        <article>
                            {/* Hero Banner */}
                            <div className="relative rounded-lg overflow-hidden">
                                {/* Dark blue background with thumbnail */}
                                <div
                                    className="w-full h-64 bg-indigo-900 flex items-center justify-center relative"
                                    style={
                                        blog.thumbnail
                                            ? {
                                                backgroundImage: `url(${blog.thumbnail})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }
                                            : {}
                                    }
                                >
                                    {/* Dark overlay */}
                                    <div className="absolute inset-0 bg-indigo-900/80" />

                                    {/* Title card */}
                                    <div className="relative z-10 bg-white mx-8 rounded-sm p-6 text-center shadow-lg max-w-lg">
                                        <h1 className="text-lg font-extrabold text-slate-900 uppercase leading-snug">
                                            {blog.title}
                                        </h1>

                                        {/* Meta */}
                                        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500">
                                            {blog.author && (
                                                <span className="flex items-center gap-1 text-indigo-600">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                    {blog.author}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-indigo-600">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {formatDate(blog.createdAt)}
                                            </span>

                                            {/* Social Share */}
                                            <div className="flex items-center gap-2 ml-2">
                                                {/* Facebook */}
                                                <a
                                                    href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                                                    title="Chia sẻ Facebook"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                                    </svg>
                                                </a>
                                                {/* Twitter/X */}
                                                <a
                                                    href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-full bg-sky-500 flex items-center justify-center text-white hover:bg-sky-600 transition-colors"
                                                    title="Chia sẻ Twitter"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                                    </svg>
                                                </a>
                                                {/* Telegram */}
                                                <a
                                                    href={`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-7 h-7 rounded-full bg-sky-400 flex items-center justify-center text-white hover:bg-sky-500 transition-colors"
                                                    title="Chia sẻ Telegram"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 17.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
                                                    </svg>
                                                </a>
                                                {/* Copy Link */}
                                                <button
                                                    onClick={handleCopyLink}
                                                    className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white hover:bg-slate-500 transition-colors"
                                                    title={copySuccess ? 'Đã sao chép!' : 'Sao chép liên kết'}
                                                >
                                                    {copySuccess ? (
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Rating */}
                            <div className="mt-5 flex justify-end">
                                <StarRating rating={blog.rating || 0} total={blog.ratingCount || 0} />
                            </div>

                            {/* Article Content */}
                            <div
                                className="mt-4 prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line"
                                dangerouslySetInnerHTML={{ __html: blog.content }}
                            />

                            {/* Back button */}
                            <div className="mt-10 pt-6 border-t border-slate-200">
                                <button
                                    onClick={() => navigate('/blogs')}
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                                >
                                    ← Quay lại danh sách bài viết
                                </button>
                            </div>
                        </article>
                    )}
                </div>

                {/* Sidebar */}
                <aside className="hidden lg:block w-64 flex-shrink-0">
                    <div className="sticky top-24 space-y-6">
                        {/* Category Box */}
                        <div className="rounded-sm overflow-hidden border border-slate-200">
                            <div className="bg-slate-800 px-4 py-3">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Chuyên Mục</h3>
                            </div>
                            <ul>
                                {categories.map((cat) => (
                                    <li key={cat}>
                                        <button
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                navigate(`/blogs?category=${encodeURIComponent(cat)}`);
                                            }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 text-sm border-b border-slate-100 transition-colors text-left text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                                        >
                                            <span>{cat}</span>
                                            <span className="text-xs text-slate-400">
                                                {cat === 'Tất cả'
                                                    ? allBlogs.length
                                                    : allBlogs.filter((b) => b.category === cat).length}
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

export default BlogDetails;
