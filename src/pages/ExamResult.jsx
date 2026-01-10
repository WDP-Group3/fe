import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/axios';
import Button from '../components/ui/Button';

const ExamResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  useEffect(() => {
    loadResult();
  }, [id]);

  const loadResult = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/exam-results/${id}`);
      if (response.status === 'success') {
        console.log(response)
        setResult(response.data);
      }
    } catch (error) {
      console.error('Error loading result:', error);
      alert('Không thể tải kết quả thi!');
      navigate('/portal/exams');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-slate-600">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Không tìm thấy kết quả thi!</p>
          <Button onClick={() => navigate('/portal/exams')} className="mt-4">
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const isPassed = result.score >= 80; // Điểm đạt là 80/100
  const wrongQuestions = result.questions?.filter(q => !q.isCorrect) || [];
  const correctQuestions = result.questions?.filter(q => q.isCorrect) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl">
        {/* Kết quả tổng quan */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center">
            <div
              className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-4xl font-bold ${
                isPassed
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {result.score}
            </div>
            <h1 className="mb-2 text-3xl font-bold text-slate-900">
              {isPassed ? 'Chúc mừng! Bạn đã đạt!' : 'Rất tiếc! Bạn chưa đạt'}
            </h1>
            <p className="mb-6 text-slate-600">
              Điểm số: {result.correctAnswers}/{result.totalQuestions} câu đúng ({result.score}%)
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Tổng câu hỏi</p>
                <p className="text-2xl font-bold text-slate-900">{result.totalQuestions}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-600">Câu đúng</p>
                <p className="text-2xl font-bold text-emerald-700">{result.correctAnswers}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm text-rose-600">Câu sai</p>
                <p className="text-2xl font-bold text-rose-700">
                  {result.totalQuestions - result.correctAnswers}
                </p>
              </div>
            </div>

            {result.duration > 0 && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">Thời gian làm bài</p>
                <p className="text-xl font-bold text-slate-900">{formatTime(result.duration)}</p>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Hoàn thành lúc: {formatDate(result.createdAt)}
            </p>

            <div className="mt-6 flex justify-center gap-4">
              <Button variant="outline" onClick={() => navigate('/portal/exams')}>
                Quay lại danh sách
              </Button>
              <Button variant="primary" onClick={() => navigate('/portal/exam-taking')}>
                Thi lại
              </Button>
            </div>
          </div>
        </div>

        {/* Chi tiết tất cả câu hỏi */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              Chi tiết bài làm ({result.totalQuestions} câu)
            </h2>
            <div className="flex gap-2">
              <Button
                variant={showAllQuestions ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setShowAllQuestions(!showAllQuestions)}
              >
                {showAllQuestions ? 'Ẩn tất cả' : 'Xem tất cả'}
              </Button>
              {wrongQuestions.length > 0 && (
                <Button
                  variant={showWrongAnswers ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setShowWrongAnswers(!showWrongAnswers)}
                >
                  {showWrongAnswers ? 'Ẩn câu sai' : `Xem câu sai (${wrongQuestions.length})`}
                </Button>
              )}
            </div>
          </div>

          {/* Hiển thị tất cả câu hỏi */}
          {showAllQuestions && (
            <div className="space-y-6">
              {result.questions?.map((item, index) => {
                return (
                  <div
                    key={item.questionNumber || index}
                    className={`rounded-xl border-2 p-4 ${
                      item.isCorrect
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-rose-200 bg-rose-50'
                    }`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
                          item.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="flex-1 font-semibold text-slate-900">
                        Câu {item.questionNumber}: {item.questionContent}
                      </p>
                      {item.isCorrect ? (
                        <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                          Đúng
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">
                          Sai
                        </span>
                      )}
                    </div>

                    {item.questionImage && (
                      <div className="mb-3 flex justify-center">
                        <img
                          src={`https://taplai.com${item.questionImage}`}
                          alt="Câu hỏi"
                          className="max-h-48 rounded-lg border border-slate-200"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {['A', 'B', 'C', 'D'].map(option => {
                        if (!item.options?.[option]) return null;
                        const isSelected = item.selectedAnswer === option;
                        const isCorrect = item.correctAnswer === option;
                        return (
                          <div
                            key={option}
                            className={`rounded-lg border-2 p-3 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-100'
                                : isSelected
                                ? 'border-rose-500 bg-rose-100'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isSelected
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {option}
                              </span>
                              <span
                                className={`text-sm ${
                                  isCorrect ? 'font-bold text-emerald-900' : 'text-slate-700'
                                }`}
                              >
                                {item.options[option]}
                              </span>
                              {isCorrect && (
                                <span className="ml-auto rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                                  Đáp án đúng
                                </span>
                              )}
                              {isSelected && !isCorrect && (
                                <span className="ml-auto rounded-full bg-rose-600 px-2 py-1 text-xs font-bold text-white">
                                  Bạn chọn
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {item.explanation && (
                      <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-900 mb-1">Giải thích:</p>
                        <p className="text-sm text-blue-800">{item.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Hiển thị chỉ câu sai */}
          {!showAllQuestions && wrongQuestions.length > 0 && showWrongAnswers && (
              <div className="space-y-6">
                {wrongQuestions.map((item, index) => {
                  return (
                    <div
                      key={item.questionNumber || index}
                      className="rounded-xl border border-rose-200 bg-rose-50 p-4"
                    >
                      <div className="mb-3 flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="flex-1 font-semibold text-slate-900">
                          Câu {item.questionNumber}: {item.questionContent}
                        </p>
                      </div>

                      {item.questionImage && (
                        <div className="mb-3 flex justify-center">
                          <img
                            src={`https://taplai.com${item.questionImage}`}
                            alt="Câu hỏi"
                            className="max-h-48 rounded-lg border border-slate-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map(option => {
                          if (!item.options?.[option]) return null;
                          const isSelected = item.selectedAnswer === option;
                          const isCorrect = item.correctAnswer === option;
                          return (
                            <div
                              key={option}
                              className={`rounded-lg border-2 p-3 ${
                                isCorrect
                                  ? 'border-emerald-500 bg-emerald-100'
                                  : isSelected
                                  ? 'border-rose-500 bg-rose-100'
                                  : 'border-slate-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : isSelected
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {option}
                                </span>
                                <span
                                  className={`text-sm ${
                                    isCorrect ? 'font-bold text-emerald-900' : 'text-slate-700'
                                  }`}
                                >
                                  {item.options[option]}
                                </span>
                                {isCorrect && (
                                  <span className="ml-auto rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                                    Đáp án đúng
                                  </span>
                                )}
                                {isSelected && !isCorrect && (
                                  <span className="ml-auto rounded-full bg-rose-600 px-2 py-1 text-xs font-bold text-white">
                                    Bạn chọn
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {item.explanation && (
                        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3">
                          <p className="text-xs font-semibold text-blue-900 mb-1">Giải thích:</p>
                          <p className="text-sm text-blue-800">{item.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;

