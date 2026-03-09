import { useState, useEffect } from "react";
import { SectionHeader } from "../../components/ui";
import apiClient from "../../services/apiClient";

const CATEGORIES = [
    "Những lỗi thường gặp",
    "Kinh nghiệm sa hình",
    "Những điều cần lưu ý khi đi thi",
];

const initialFormState = {
    title: "",
    content: "",
    category: CATEGORIES[2],
    thumbnail: "",
    author: "",
};

const AdminBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);
    const [formData, setFormData] = useState(initialFormState);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await apiClient.get("/blogs/admin/all");
            const data = response?.data || response;
            setBlogs(data?.blogs || data || []);
        } catch (err) {
            console.error("Error loading blogs:", err);
            setError(err.message || "Không thể tải danh sách bài viết");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingBlog(null);
        setFormData(initialFormState);
        setShowModal(true);
    };

    const openEditModal = (blog) => {
        setEditingBlog(blog);
        setFormData({
            title: blog.title || "",
            content: blog.content || "",
            category: blog.category || CATEGORIES[2],
            thumbnail: blog.thumbnail || "",
            author: blog.author || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editingBlog) {
                await apiClient.put(`/blogs/${editingBlog._id}`, formData);
            } else {
                await apiClient.post("/blogs", formData);
            }
            setShowModal(false);
            setEditingBlog(null);
            setFormData(initialFormState);
            loadBlogs();
        } catch (err) {
            console.error("Error saving blog:", err);
            alert("Lỗi lưu bài viết: " + (err.message || "Thử lại sau"));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVisibility = async (blog) => {
        try {
            setTogglingId(blog._id);
            if (blog.status === "VISIBLE") {
                await apiClient.patch(`/blogs/hide/${blog._id}`);
            } else {
                await apiClient.patch(`/blogs/unhide/${blog._id}`);
            }
            loadBlogs();
        } catch (err) {
            console.error("Error toggling visibility:", err);
            alert("Lỗi thay đổi trạng thái: " + (err.message || "Thử lại sau"));
        } finally {
            setTogglingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 mb-4">Lỗi: {error}</p>
                <button
                    onClick={loadBlogs}
                    className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Quản lý Bài viết"
                description="Đăng bài, chỉnh sửa và ẩn/hiện các bài viết trên hệ thống"
                action={
                    <button
                        onClick={openCreateModal}
                        className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                    >
                        + Đăng bài mới
                    </button>
                }
            />

            {/* Modal Create / Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h3 className="mb-5 text-lg font-bold text-slate-900">
                            {editingBlog ? "Sửa bài viết" : "Đăng bài mới"}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Nhập tiêu đề bài viết..."
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Chuyên mục
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">
                                        Tác giả
                                    </label>
                                    <input
                                        value={formData.author}
                                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                        placeholder="Tên tác giả..."
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    URL Hình ảnh (Thumbnail)
                                </label>
                                <input
                                    value={formData.thumbnail}
                                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                {formData.thumbnail && (
                                    <img
                                        src={formData.thumbnail}
                                        alt="preview"
                                        className="mt-2 h-24 w-full rounded-lg object-cover border border-slate-200"
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                    />
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Nội dung <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    rows={8}
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Viết nội dung bài viết..."
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
                                />
                            </div>

                            <div className="flex gap-3 pt-2 border-t mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                                >
                                    {saving ? "Đang lưu..." : "Lưu bài viết"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Blog List */}
            {blogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
                    <span className="text-5xl mb-3">📝</span>
                    <p className="text-slate-500 font-medium">Chưa có bài viết nào</p>
                    <p className="text-sm text-slate-400 mt-1">Nhấn "+ Đăng bài mới" để tạo bài đầu tiên</p>
                    <button
                        onClick={openCreateModal}
                        className="mt-4 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        + Đăng bài mới
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600 w-16">#</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600">Bài viết</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden md:table-cell">Chuyên mục</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Tác giả</th>
                                <th className="px-4 py-3 text-left font-semibold text-slate-600 hidden lg:table-cell">Ngày đăng</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-600">Trạng thái</th>
                                <th className="px-4 py-3 text-center font-semibold text-slate-600">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {blogs.map((blog, idx) => (
                                <tr key={blog._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-400 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {blog.thumbnail ? (
                                                <img
                                                    src={blog.thumbnail}
                                                    alt={blog.title}
                                                    className="h-10 w-16 rounded-lg object-cover flex-shrink-0 border border-slate-100"
                                                    onError={(e) => {
                                                        e.target.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="h-10 w-16 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 text-lg">
                                                    📄
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-slate-900 truncate max-w-xs" title={blog.title}>
                                                    {blog.title}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                                    {blog.content?.substring(0, 60)}...
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <span className="inline-block max-w-[160px] truncate rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700" title={blog.category}>
                                            {blog.category || "—"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                                        {blog.author || <span className="text-slate-400 italic">Ẩn danh</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                                        {formatDate(blog.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {blog.status === "VISIBLE" ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                Hiển thị
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                                Đã ẩn
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Edit button */}
                                            <button
                                                onClick={() => openEditModal(blog)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Sửa bài viết"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>

                                            {/* Hide / Unhide button */}
                                            <button
                                                onClick={() => handleToggleVisibility(blog)}
                                                disabled={togglingId === blog._id}
                                                className={`p-1.5 rounded-lg transition-colors ${blog.status === "VISIBLE"
                                                        ? "text-amber-600 hover:bg-amber-50"
                                                        : "text-green-600 hover:bg-green-50"
                                                    } disabled:opacity-40`}
                                                title={blog.status === "VISIBLE" ? "Ẩn bài viết" : "Hiện bài viết"}
                                            >
                                                {togglingId === blog._id ? (
                                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                ) : blog.status === "VISIBLE" ? (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminBlogs;
