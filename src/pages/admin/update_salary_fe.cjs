const fs = require('fs');

const p = 'c:\\Code\\WDP\\fe\\src\\pages\\admin\\AdminSalary.jsx';
let content = fs.readFileSync(p, 'utf8');

// 1. Add state variables
content = content.replace(
  "const [showOverrideModal, setShowOverrideModal] = useState(false);",
  `const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  // Penalty state
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedPenaltyUser, setSelectedPenaltyUser] = useState(null);
  const [userPenalties, setUserPenalties] = useState([]);
  const [penaltyForm, setPenaltyForm] = useState({ amount: '', reason: '' });
  const [loadingPenalties, setLoadingPenalties] = useState(false);
  const [showAddPenalty, setShowAddPenalty] = useState(false);`
);

// 2. Add Penalty functions (insert before useEffect)
const functionsToAdd = `
  const handleOpenPenalty = (row) => {
    setSelectedPenaltyUser(row);
    setShowPenaltyModal(true);
    setShowAddPenalty(false);
    setPenaltyForm({ amount: '', reason: '' });
    fetchPenalties(row.userId || row._id);
  };

  const fetchPenalties = async (userId) => {
    try {
      setLoadingPenalties(true);
      const res = await apiClient.get(\`/salary/users/\${userId}/penalties?month=\${filters.month}&year=\${filters.year}\`);
      if (res.data?.status === "success") {
        setUserPenalties(res.data.data);
      }
    } catch (e) {
      showToast("Lỗi khi tải danh sách nộp phạt", "error");
    } finally {
      setLoadingPenalties(false);
    }
  };

  const handleCreatePenalty = async () => {
    if (!penaltyForm.amount || !penaltyForm.reason) {
      return showToast("Vui lòng nhập đủ số tiền và lý do", "error");
    }
    try {
      const payload = {
        amount: Number(penaltyForm.amount),
        reason: penaltyForm.reason
      };
      await apiClient.post(\`/salary/users/\${selectedPenaltyUser.userId || selectedPenaltyUser._id}/penalties\`, payload);
      showToast("Thêm nộp phạt thành công", "success");
      fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id);
      setShowAddPenalty(false);
      setPenaltyForm({ amount: '', reason: '' });
      fetchData(); // Reload table data
    } catch (e) {
      showToast(e.response?.data?.message || "Lỗi khi thêm nộp phạt", "error");
    }
  };

  const handleDeletePenalty = async (penaltyId) => {
    if (!window.confirm('Hủy bỏ nộp phạt này?')) return;
    try {
      await apiClient.delete(\`/salary/penalties/\${penaltyId}\`);
      showToast("Đã hủy nộp phạt", "success");
      fetchPenalties(selectedPenaltyUser.userId || selectedPenaltyUser._id);
      fetchData(); 
    } catch (e) {
      showToast("Lỗi", "error");
    }
  };
`;

content = content.replace(
  "  useEffect(() => {",
  functionsToAdd + "\n  useEffect(() => {"
);

// 3. Update columns: add penalty and change Thao tác logic
// First, add Nộp phạt column before Tổng lương
content = content.replace(
  `      {
        key: "totalSalary",`,
  `      {
        key: "totalPenalty",
        title: "Nộp phạt",
        render: (_, row) => (
          <span className="text-red-500 font-medium tracking-tight">
            {row.totalPenalty ? "-" + fmt(row.totalPenalty) : "—"}
          </span>
        ),
      },
      {
        key: "totalSalary",`
);

// Replace actions column
content = content.replace(
  /key: "actions",\s*title: "Thao tác",\s*render: \(_, row\) => \([\s\S]*?\),\s*\}/,
  `key: "actions",
        title: "Thao tác",
        render: (_, row) => (
          <div className="relative group flex justify-end">
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 focus:bg-slate-100 focus:text-slate-600 flex items-center justify-center outline-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
            <div className="absolute right-8 top-0 min-w-[140px] bg-white border border-slate-100 shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-focus-within:opacity-100 group-hover:visible group-focus-within:visible transition-all z-[50] flex flex-col py-1 overflow-hidden">
              <button onClick={() => handleViewDetail(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors w-full">Chi tiết</button>
              <button onClick={() => handleOpenOverride(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition-colors w-full border-t border-slate-50">Chỉnh lương</button>
              <button onClick={() => handleOpenPenalty(row)} className="px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors w-full border-t border-slate-50">Nộp phạt</button>
            </div>
          </div>
        ),
      }`
);

// Make sure handleOpenPenalty is added to useMemo dependencies
content = content.replace(
  "}, [activeCourses, handleViewDetail, handleOpenOverride]);",
  "}, [activeCourses, handleViewDetail, handleOpenOverride, handleOpenPenalty]);"
);

// 4. Add Modal code
const modalCode = `
      {/* Penalty Modal */}
      {showPenaltyModal && selectedPenaltyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Danh sách nộp phạt
                </h3>
                <p className="text-sm text-slate-500">
                  Nhân viên: {selectedPenaltyUser.fullName || selectedPenaltyUser.userName} - {filters.month}/{filters.year}
                </p>
              </div>
              <button
                onClick={() => setShowPenaltyModal(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!showAddPenalty ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-slate-700">Lịch sử nộp phạt</h4>
                    <button
                      onClick={() => setShowAddPenalty(true)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      + Thêm nộp phạt
                    </button>
                  </div>

                  {loadingPenalties ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                    </div>
                  ) : userPenalties.length > 0 ? (
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Lý do</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Số tiền</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Ngày tạo</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {userPenalties.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50">
                              <td className="px-4 py-3 text-sm text-slate-800">{p.reason}</td>
                              <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">{fmt(p.amount)}</td>
                              <td className="px-4 py-3 text-sm text-slate-500">
                                {new Date(p.date).toLocaleDateString('vi-VN')}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <button
                                  onClick={() => handleDeletePenalty(p._id)}
                                  className="text-slate-400 hover:text-red-500 font-medium text-xs px-2 py-1 rounded hover:bg-red-50"
                                >
                                  Hủy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                      <p className="text-slate-500">Người này không có nộp phạt nào trong tháng.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h4 className="font-semibold text-slate-700 mb-4 text-lg">Tạo nộp phạt mới</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền phạt (VNĐ)</label>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="VD: 50000"
                        value={penaltyForm.amount}
                        onChange={e => setPenaltyForm(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Lý do nộp phạt</label>
                      <textarea
                        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Nhập lý do nộp phạt..."
                        rows="3"
                        value={penaltyForm.reason}
                        onChange={e => setPenaltyForm(prev => ({ ...prev, reason: e.target.value }))}
                      ></textarea>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        onClick={() => setShowAddPenalty(false)}
                        className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleCreatePenalty}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal footer just for closing the dialog when on list view */}
            {!showAddPenalty && (
              <div className="border-t border-slate-100 p-6 shrink-0 flex justify-end">
                <button
                  onClick={() => setShowPenaltyModal(false)}
                  className="rounded-xl px-6 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
`;

content = content.replace(
  "{showOverrideModal && selectedUser && (",
  modalCode + "\n\n      {showOverrideModal && selectedUser && ("
);

// We should also make sure table has space for dropdown to show right side
content = content.replace(
  `<div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">`,
  `<div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-slate-200">`
);

// We need to fix the case where the table hides dropdown elements.
// Wait, `overflow-hidden` on the parent `.rounded-2xl` might hide dropdowns!
content = content.replace(
  `overflow-hidden">
        {loading ?`,
  `overflow-visible">
        {loading ?`
);

// Write back
fs.writeFileSync(p, content, 'utf8');

console.log('Update complete');
