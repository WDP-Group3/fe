import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import axios from '../services/axios';
import { useAuthContext } from '../context/AuthContext';

const Exams = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamResults();
  }, []);

  const loadExamResults = async () => {
    try {
      setLoading(true);
      const studentId = user?.id || user?._id;
      if (studentId) {
        const response = await axios.get(`/exam-results?studentId=${studentId}`);
        if (response.status === 'success') {
          setExamResults(response.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading exam results:', error);
    } finally {
      setLoading(false);
    }
  };

  const [topics, setTopics] = useState([]);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await axios.get('/exam-questions/topics');
      if (response.status === 'success') {
        setTopics(response.data || []);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      // Fallback nếu API lỗi
      setTopics([
        { name: 'Khái niệm', slug: 'khai-niem', totalQuestions: 180 },
        { name: 'Văn hóa', slug: 'van-hoa', totalQuestions: 25 },
        { name: 'Kỹ thuật', slug: 'ky-thuat', totalQuestions: 58 },
        { name: 'Cấu tạo', slug: 'cau-tao', totalQuestions: 37 },
        { name: 'Biển báo', slug: 'bien-bao', totalQuestions: 185 },
        { name: 'Tình huống', slug: 'tinh-huong', totalQuestions: 115 },
      ]);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStartExamByTopic = (topicSlug) => {
    navigate(`/portal/exam-taking?category=${topicSlug}`);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Thi thử lý thuyết"
          description="600 câu Bộ GTVT · Thi ngẫu nhiên / theo chủ đề"
          action={
            <Button
              variant="primary"
              onClick={() => navigate('/portal/exam-taking')}
            >
              Bắt đầu đề ngẫu nhiên
            </Button>
          }
        />
        <div className="grid gap-4 md:grid-cols-3">
          {topics.map((topic) => (
            <div key={topic.slug || topic.name} className="rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{topic.name}</p>
                <StatusBadge status="doing" label="Luyện tập" />
              </div>
              <p className="text-3xl font-bold text-indigo-700">{topic.totalQuestions}</p>
              <p className="text-xs text-slate-500">câu hỏi</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => handleStartExamByTopic(topic.slug)}
              >
                Thi theo chủ đề
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white/90 p-6 shadow-sm backdrop-blur">
        <SectionHeader
          title="Lịch sử thi thử"
          description="Lưu kết quả, thống kê câu sai để ôn tập"
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : examResults.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <p>Bạn chưa có lịch sử thi thử nào</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/portal/exam-taking')}
            >
              Bắt đầu thi thử
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {examResults.map((result, idx) => (
              <div
                key={result._id || idx}
                className="flex items-center justify-between rounded-2xl border border-slate-100 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Đề ngẫu nhiên #{examResults.length - idx}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(result.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p
                    className={`text-2xl font-bold ${
                      result.score >= 80
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {result.correctAnswers}/{result.totalQuestions}
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      result.score >= 80
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    ({result.score}%)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/portal/exam-result/${result._id}`)}
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exams;

