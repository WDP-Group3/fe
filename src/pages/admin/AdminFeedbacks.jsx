import { useState, useEffect } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { SectionHeader } from '../../components/ui';
import apiClient from '../../services/apiClient';
import Pagination from '../../components/common/Pagination';

const AdminFeedbacks = () => {
    const { user } = useAuthContext();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterInstructor, setFilterInstructor] = useState('');
    const [filterMinRating, setFilterMinRating] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [instructors, setInstructors] = useState([]);
    
    // Statistics
    const [statistics, setStatistics] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });

    // Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);

    useEffect(() => {
        loadFeedbacks();
    }, [filterInstructor, filterMinRating, filterStatus, filterType, filterStartDate, filterEndDate, currentPage]);

    useEffect(() => {
        loadInstructors();
    }, []);

    const loadInstructors = async () => {
        try {
            const response = await apiClient.get('/users?role=INSTRUCTOR&limit=500');
            if (response.status === 'success') {
                setInstructors(response.data || []);
            }
        } catch (err) {
            console.error('Error loading instructors:', err);
        }
    };

    const loadFeedbacks = async () => {
        try {
            setLoading(true);
            let query = '';
            if (filterInstructor) query += `instructorId=${filterInstructor}&`;
            if (filterMinRating) query += `minRating=${filterMinRating}&`;
            if (filterStatus) query += `feedbackStatus=${filterStatus}&`;
            if (filterType) query += `feedbackType=${filterType}&`;
            if (filterStartDate) query += `startDate=${filterStartDate}&`;
            if (filterEndDate) query += `endDate=${filterEndDate}&`;
            query += `page=${currentPage}&limit=10`;
            query = '?' + query;
            
            const response = await apiClient.get(`/bookings/feedbacks${query}`);
            if (response.status === 'success') {
                setFeedbacks(response.data);
                setStatistics(response.statistics);
                if (response.pagination) {
                    setPagination(response.pagination);
                }
            }
        } catch (err) {
            console.error('Error loading feedbacks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (feedback) => {
        // Optimistic update locally
        const updatedFeedback = { ...feedback };
        if (!updatedFeedback.feedbackStatus || updatedFeedback.feedbackStatus === 'UNREAD') {
            updatedFeedback.feedbackStatus = 'READ';
        }
        
        setSelectedFeedback(updatedFeedback);
        setShowDetailModal(true);

        if (!feedback.feedbackStatus || feedback.feedbackStatus === 'UNREAD') {
            try {
                await apiClient.patch(`/bookings/feedbacks/${feedback._id}/status`, { feedbackStatus: 'READ' });
                // We don't block the UI while waiting for the background reload
                loadFeedbacks();
            } catch (e) {
                console.error('Error auto-updating status:', e);
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            const newStatus = (!currentStatus || currentStatus === 'UNREAD') ? 'READ' : 'UNREAD';
            const res = await apiClient.patch(`/bookings/feedbacks/${id}/status`, { feedbackStatus: newStatus });
            if (res.status === 'success') {
                loadFeedbacks(); // Reload current view
            }
        } catch (e) {
            console.error('Toggle status error:', e);
        }
    };

    const getRatingStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const SLOT_LABELS = {
        "1": "Ca 1 (07:00 - 08:00)",
        "2": "Ca 2 (08:00 - 09:00)",
        "3": "Ca 3 (09:00 - 10:00)",
        "4": "Ca 4 (10:00 - 11:00)",
        "5": "Ca 5 (11:00 - 12:00)",
        "6": "Ca 6 (13:00 - 14:00)",
        "7": "Ca 7 (16:00 - 17:00)",
        "8": "Ca 8 (17:30 - 18:30)",
        "9": "Ca 9 (19:00 - 20:00)",
        "10": "Ca 10 (20:30 - 21:30)",
    };

    return (
        <div className="p-6">
            <SectionHeader title="Quản lý đánh giá & phản hồi" subtitle="Xem phản hồi từ học viên sau các buổi học" />

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm opacity-80">Tổng số đánh giá</div>
                        <div className="text-3xl font-bold">{statistics.totalFeedbacks}</div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm opacity-80">Điểm trung bình</div>
                        <div className="text-3xl font-bold">{statistics.avgRating} ⭐</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm opacity-80">5 sao</div>
                        <div className="text-3xl font-bold">{statistics.ratingDistribution[5]}</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white shadow-lg">
                        <div className="text-sm opacity-80">1-2 sao</div>
                        <div className="text-3xl font-bold">
                            {statistics.ratingDistribution[1] + statistics.ratingDistribution[2]}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lọc theo giáo viên
                        </label>
                        <select
                            value={filterInstructor}
                            onChange={(e) => setFilterInstructor(e.target.value)}
                            className="border rounded px-3 py-2 text-sm w-64"
                        >
                            <option value="">Tất cả giáo viên</option>
                            {instructors.map((ins) => (
                                <option key={ins._id} value={ins._id}>{ins.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lọc theo đánh giá thấp
                        </label>
                        <select
                            value={filterMinRating}
                            onChange={(e) => setFilterMinRating(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Tất cả</option>
                            <option value="3">3 sao trở xuống</option>
                            <option value="2">2 sao trở xuống</option>
                            <option value="1">1 sao</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Trạng thái đọc: Tất cả</option>
                            <option value="UNREAD">Chưa đọc</option>
                            <option value="READ">Đã đọc</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">Loại: Tất cả</option>
                            <option value="NORMAL">Bình thường</option>
                            <option value="COMPLAINT">Khiếu nại</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Từ ngày
                        </label>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Đến ngày
                        </label>
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={loadFeedbacks}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                        >
                            Tải lại
                        </button>
                        <button
                            onClick={() => {
                                setFilterInstructor('');
                                setFilterMinRating('');
                                setFilterStatus('');
                                setFilterType('');
                                setFilterStartDate('');
                                setFilterEndDate('');
                                setCurrentPage(1);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-sm"
                        >
                            Xóa lọc
                        </button>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            {statistics && (
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <h3 className="font-semibold mb-3">Phân bố đánh giá</h3>
                    <div className="flex gap-2">
                        {[5, 4, 3, 2, 1].map(star => (
                            <div key={star} className="flex-1 text-center">
                                <div className="text-lg font-bold">{star} ⭐</div>
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                        className="bg-yellow-500 h-2 rounded-full" 
                                        style={{ 
                                            width: `${(statistics.ratingDistribution[star] / statistics.totalFeedbacks) * 100}%` 
                                        }}
                                    />
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {statistics.ratingDistribution[star]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Feedbacks Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Đang tải...</div>
                ) : feedbacks.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Chưa có đánh giá nào</div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">STT</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Học viên</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Giáo viên</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ngày học</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Loại</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Trạng thái</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Đánh giá</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Ngày đánh giá</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {feedbacks.map((feedback, index) => (
                                    <tr key={feedback._id} className={feedback.feedbackType === 'COMPLAINT' ? "border-t hover:bg-red-100 bg-red-50" : "border-t hover:bg-gray-50 bg-white"}>
                                        <td className="px-4 py-3 text-sm">
                                            {(currentPage - 1) * 10 + index + 1}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-medium">{feedback.learnerId?.fullName || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{feedback.learnerId?.email || ''}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {feedback.instructorId?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <div>{new Date(feedback.date).toLocaleDateString('vi-VN')}</div>
                                            <div className="text-xs text-gray-500">
                                                {SLOT_LABELS[String(feedback.timeSlot)] || `Ca ${feedback.timeSlot}`}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold">
                                            {feedback.feedbackType === 'COMPLAINT' ? <span className="text-red-600">Khiếu nại</span> : <span className="text-slate-500">Bình thường</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button 
                                                onClick={() => toggleStatus(feedback._id, feedback.feedbackStatus)}
                                                className={`px-3 py-1 rounded-full text-xs font-bold ${(!feedback.feedbackStatus || feedback.feedbackStatus === 'UNREAD') ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
                                            >
                                                {(!feedback.feedbackStatus || feedback.feedbackStatus === 'UNREAD') ? 'Chưa đọc' : 'Đã đọc'}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`font-bold ${
                                                feedback.rating >= 4 ? 'text-green-600' : 
                                                feedback.rating >= 3 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {getRatingStars(feedback.rating)}
                                            </span>
                                            <div className="text-xs text-gray-500">({feedback.rating}/5)</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDate(feedback.feedbackDate)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleViewDetail(feedback)}
                                                className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="px-4 py-3 border-t border-gray-100">
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedFeedback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="absolute inset-0" onClick={() => setShowDetailModal(false)} aria-hidden="true" />
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-lg w-full relative z-10" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Chi tiết đánh giá</h2>
                        
                        <div className="space-y-3">
                            {/* Học viên info */}
                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-lg">
                                        {selectedFeedback.learnerId?.fullName?.charAt(0) || 'HV'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{selectedFeedback.learnerId?.fullName || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{selectedFeedback.learnerId?.email || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{selectedFeedback.learnerId?.phone || 'N/A'}</div>
                                    </div>
                                </div>
                                {selectedFeedback.learnerId?.role && (
                                    <div className="mt-2 text-xs text-slate-600">
                                        <span className="font-medium">Hạng:</span> {selectedFeedback.learnerId.role}
                                    </div>
                                )}
                                {(selectedFeedback.batchId?.name || selectedFeedback.batchId?.courseId) && (
                                    <div className="mt-2 text-xs text-slate-600">
                                        <span className="font-medium">Lớp:</span> {selectedFeedback.batchId?.name || 'N/A'}
                                        {selectedFeedback.batchId?.courseId && (
                                            <> — <span className="font-medium">Khóa:</span> {selectedFeedback.batchId.courseId.name || selectedFeedback.batchId.courseId.code || 'N/A'}</>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            <hr />
                            
                            {/* Giáo viên info */}
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-lg">
                                        {selectedFeedback.instructorId?.fullName?.charAt(0) || 'GV'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{selectedFeedback.instructorId?.fullName || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{selectedFeedback.instructorId?.email || 'N/A'}</div>
                                        <div className="text-xs text-slate-500">{selectedFeedback.instructorId?.phone || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <hr />
                            
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ngày học:</span>
                                <span className="font-medium">
                                    {new Date(selectedFeedback.date).toLocaleDateString('vi-VN')} - {
                                        SLOT_LABELS[String(selectedFeedback.timeSlot)] || `Ca ${selectedFeedback.timeSlot}`
                                    }
                                </span>
                            </div>
                            <hr />
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Đánh giá:</span>
                                <span className="text-2xl">
                                    {getRatingStars(selectedFeedback.rating)}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-600 block mb-1">Loại phản hồi:</span>
                                <div className="font-bold mb-2">
                                    {selectedFeedback.feedbackType === 'COMPLAINT' ? <span className="text-red-600">Khiếu nại</span> : <span className="text-slate-600">Bình thường</span>}
                                </div>
                                <span className="text-gray-600 block mb-1">Phản hồi:</span>
                                <div className="bg-gray-50 p-3 rounded border text-sm">
                                    {selectedFeedback.learnerFeedback || 'Không có phản hồi'}
                                </div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Ngày đánh giá:</span>
                                <span>{formatDate(selectedFeedback.feedbackDate)}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminFeedbacks;
