import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../services/axios';
import Button from '../components/ui/Button';
import { useAuthContext } from '../context/AuthContext';

const ExamTaking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthContext();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 phút = 900 giây
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());
  const [examCategory, setExamCategory] = useState(null);

  useEffect(() => {
    // Lấy category từ query params nếu có
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category');
    if (category) {
      setExamCategory(category);
    }
    loadQuestions(category);
  }, [location]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const loadQuestions = async (category = null) => {
    try {
      setLoading(true);
      let url = '/exam-questions/random?count=25';
      if (category) {
        url += `&category=${category}`;
      }
      const response = await axios.get(url);
      if (response.status === 'success') {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Không thể tải đề thi. Vui lòng thử lại!');
      navigate('/portal/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const confirmed = window.confirm('Bạn có chắc chắn muốn nộp bài?');
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const duration = Math.floor((Date.now() - startTime) / 1000);

      // Calculate results locally
      let correctCount = 0;
      const wrongQuestionNumbers = [];

      const processedQuestions = questions.map(q => {
        const selectedAnswer = answers[q._id] || null;
        const isCorrect = selectedAnswer === q.correctAnswer;

        if (isCorrect) {
          correctCount++;
        } else {
          // Note: If no answer selected, it's also wrong
          wrongQuestionNumbers.push(q.number);
        }

        return {
          questionId: q._id,
          selectedAnswer: selectedAnswer,
          isCorrect: isCorrect
        };
      });

      const totalQuestions = questions.length;
      const score = Math.round((correctCount / totalQuestions) * 100);

      const categoryMap = {
        'khai-niem': 'Khái niệm',
        'van-hoa': 'Văn hóa',
        'ky-thuat': 'Kỹ thuật',
        'cau-tao': 'Cấu tạo sửa chữa',
        'bien-bao': 'Biển báo',
        'tinh-huong': 'Tình huống',
      };

      const categoryName = examCategory ? (categoryMap[examCategory] || 'Ngẫu nhiên') : 'Ngẫu nhiên';

      const submitData = {
        studentId: user?.id || user?._id,
        questions: processedQuestions,
        duration,
        score,
        correctAnswers: correctCount,
        wrongQuestionNumbers,
        totalQuestions,
        category: categoryName
      };

      const response = await axios.post('/exam-results/submit', submitData);

      if (response.status === 'success') {
        navigate(`/portal/exam-result/${response.data._id}`);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Không thể nộp bài. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Không có câu hỏi nào!</p>
          <Button onClick={() => navigate('/portal/exams')} className="mt-4">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const isAnswered = answers[currentQuestion._id];

  return (
    <div className="mx-auto max-w-7xl px-4">
      {/* Header với timer và thông tin */}
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Thi thử lý thuyết</h1>
            <p className="text-sm text-slate-600">
              Câu {currentQuestionIndex + 1} / {questions.length} · Đã trả lời: {answeredCount}/{questions.length}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${timeLeft <= 300 ? 'text-rose-600' : 'text-indigo-600'}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-slate-500">Thời gian còn lại</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Danh sách câu hỏi */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Danh sách câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2 lg:grid-cols-3 overflow-y-scroll h-[500px]">
              {questions.map((q, index) => {
                const isAnswered = answers[q._id];
                const isCurrent = index === currentQuestionIndex;
                return (
                  <button
                    key={q._id}
                    onClick={() => handleQuestionClick(index)}
                    className={`h-10 rounded-lg text-sm font-semibold transition-all ${isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isAnswered
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Câu hỏi hiện tại */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="mb-4 flex items-start gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600">
                  {currentQuestionIndex + 1}
                </span>
                <p className="flex-1 text-lg text-slate-900">{currentQuestion.content}</p>
              </div>

              {currentQuestion.image && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={`https://taplai.com${currentQuestion.image}`}
                    alt="Câu hỏi"
                    className="max-h-64 rounded-lg border border-slate-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(option => {
                  if (!currentQuestion.options[option]) return null;
                  const isSelected = answers[currentQuestion._id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(currentQuestion._id, option)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                          {option}
                        </span>
                        <span>{currentQuestion.options[option]}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-6">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                ← Câu trước
              </Button>

              <div className="flex gap-2">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button variant="primary" onClick={handleNext}>
                    Câu sau →
                  </Button>
                ) : (
                  <Button variant="success" onClick={handleSubmit} loading={submitting}>
                    Nộp bài
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default ExamTaking;

