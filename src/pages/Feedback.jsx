import { useState, useEffect } from 'react';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import apiClient from '../services/apiClient';

const Feedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterLow, setFilterLow] = useState(false);

    useEffect(() => {
        loadFeedbacks();
    }, [filterLow]);

    const loadFeedbacks = async () => {
        try {
            setLoading(true);
            const params = filterLow ? { minRating: 3 } : {};
            // Append params to url manually or use axios params
            const query = filterLow ? '?minRating=3' : '';
            const response = await apiClient.get(`/feedbacks${query}`);
            if (response.status === 'success') {
                setFeedbacks(response.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Đánh giá & Phản hồi"
                description="Ý kiến học viên về giảng viên và trung tâm"
                action={
                    <button
                        onClick={() => setFilterLow(!filterLow)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filterLow ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}
                    >
                        {filterLow ? 'Đang lọc: Đánh giá thấp' : 'Lọc đánh giá thấp (< 3 sao)'}
                    </button>
                }
            />

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">Đang tải...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">Chưa có phản hồi nào</div>
                ) : (
                    feedbacks.map((item) => (
                        <div key={item._id} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-slate-900">{item.instructorId?.fullName || 'Giảng viên'}</h4>
                                        <span className="text-xs text-slate-500">• Được đánh giá bởi {item.learnerId?.fullName || 'Học viên'}</span>
                                    </div>
                                    <div className="mt-1 flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i}>{i < item.rating ? '★' : '☆'}</span>
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                            </div>
                            <p className="mt-3 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl italic">
                                "{item.comment || 'Không có bình luận'}"
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Feedback;
