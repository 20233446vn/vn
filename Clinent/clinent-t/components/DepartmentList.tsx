import React, { useState, useMemo, useEffect } from "react";
import {
  Building2,
  Users,
  Edit,
  Trash2,
  Plus,
  Briefcase,
  Search,
  X,
  Save,
} from "lucide-react";

const API_BASE = "http://localhost:3001";

interface DepartmentState {
  MaPB: string;
  TenPB: string;
}

interface Employee {
  MANV?: string;
  MaPB?: string | null;
  MaCV?: string | null;
  TenCV?: string | null;
  HONV: string;
  TENNV: string;
}

export default function DepartmentList() {
  const [departments, setDepartments] = useState<DepartmentState[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentDept, setCurrentDept] = useState<DepartmentState | null>(null);
  const [formData, setFormData] = useState({ MaPB: "", TenPB: "" });

  // Map ngày cập nhật theo Mã PB
  const [updatedAtMap, setUpdatedAtMap] = useState<Record<string, string>>({});

  // Modal chi tiết nhân viên theo phòng ban
  const [detailDept, setDetailDept] = useState<DepartmentState | null>(null);

  // Lấy dữ liệu từ backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [deptRes, empRes] = await Promise.all([
          fetch(`${API_BASE}/api/departments`),
          fetch(`${API_BASE}/api/employees`),
        ]);

        if (!deptRes.ok || !empRes.ok) {
          throw new Error("Không tải được dữ liệu phòng ban hoặc nhân viên");
        }

        const deptData: DepartmentState[] = await deptRes.json();
        const empData: Employee[] = await empRes.json();

        setDepartments(deptData);
        setEmployees(empData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Danh sách nhân viên theo phòng ban đang xem chi tiết
  const employeesInDetailDept = useMemo(() => {
    if (!detailDept) return [];
    return employees.filter((e) => e.MaPB === detailDept.MaPB);
  }, [detailDept, employees]);

  // Derived Data
  const enrichedDepartments = useMemo(() => {
    return departments
      .map((dept) => {
        const employeeCount = employees.filter(
          (e) => e.MaPB === dept.MaPB
        ).length;
        const manager = employees.find(
          (e) => e.MaPB === dept.MaPB && e.MaCV === "CV02"
        );

        return {
          ...dept,
          employeeCount,
          managerName: manager
            ? `${manager.HONV} ${manager.TENNV}`
            : "Đang hoạt động",
        };
      })
      .filter((d) =>
        d.TenPB.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [departments, employees, searchTerm]);

  // Handlers
  const handleOpenAdd = () => {
    setCurrentDept(null);
    // tạo mã PB mới: nếu backend tự tạo mã thì bạn có thể để rỗng
    setFormData({
      MaPB: `PB${departments.length + 1}`.padStart(4, "0"),
      TenPB: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentState) => {
    setCurrentDept(dept);
    setFormData({ ...dept });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (dept: DepartmentState) => {
    setCurrentDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let res: Response;

      if (currentDept) {
        // Edit – PUT /api/departments/:MaPB
        res = await fetch(`${API_BASE}/api/departments/${currentDept.MaPB}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Add – POST /api/departments
        res = await fetch(`${API_BASE}/api/departments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!res.ok) {
        throw new Error("Lưu phòng ban thất bại");
      }

      const saved: DepartmentState = await res.json();

      // Ngày hôm nay (format kiểu Việt Nam)
      const todayStr = new Date().toLocaleDateString("vi-VN");

      if (currentDept) {
        setDepartments((prev) =>
          prev.map((d) => (d.MaPB === currentDept.MaPB ? saved : d))
        );
      } else {
        setDepartments((prev) => [...prev, saved]);
      }

      // Lưu ngày cập nhật cho phòng ban
      setUpdatedAtMap((prev) => ({
        ...prev,
        [saved.MaPB]: todayStr,
      }));

      setIsModalOpen(false);
      setCurrentDept(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Có lỗi khi lưu phòng ban");
    }
  };

  const handleDelete = async () => {
    if (!currentDept) return;

    try {
      // DELETE /api/departments/:MaPB
      const res = await fetch(
        `${API_BASE}/api/departments/${currentDept.MaPB}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Xóa phòng ban thất bại");

      setDepartments((prev) =>
        prev.filter((d) => d.MaPB !== currentDept.MaPB)
      );
      setIsDeleteModalOpen(false);
      setCurrentDept(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Có lỗi khi xóa phòng ban");
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Phòng ban
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Danh sách các đơn vị và phòng ban trong công ty
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Thêm phòng ban</span>
        </button>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Đang tải dữ liệu phòng ban...</p>
      )}
      {error && <p className="text-sm text-red-600">Lỗi: {error}</p>}

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {enrichedDepartments.map((dept) => {
          const updatedText =
            updatedAtMap[dept.MaPB] != null
              ? `Cập nhật: ${updatedAtMap[dept.MaPB]}`
              : "Chưa cập nhật";

          return (
            <div
              key={dept.MaPB}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-blue-50 dark:bg-slate-700 rounded-lg text-blue-600 dark:text-blue-400">
                    <Building2 size={24} />
                  </div>
                  <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() =>
                        handleOpenEdit({
                          MaPB: dept.MaPB,
                          TenPB: dept.TenPB,
                        })
                      }
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() =>
                        handleOpenDelete({
                          MaPB: dept.MaPB,
                          TenPB: dept.TenPB,
                        })
                      }
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-md transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {dept.TenPB}
                  </h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    Mã: {dept.MaPB}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-slate-700 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                      <Users size={12} className="mr-1" />
                      Nhân sự
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-200">
                      {dept.employeeCount} người
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                      <Briefcase size={12} className="mr-1" />
                      Quản lý
                    </p>
                    <p
                      className="font-semibold text-gray-900 dark:text-gray-200 truncate"
                      title={dept.managerName}
                    >
                      {dept.managerName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick action footer */}
              <div className="bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-gray-500">{updatedText}</span>
                <button
                  onClick={() =>
                    setDetailDept({ MaPB: dept.MaPB, TenPB: dept.TenPB })
                  }
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Chi tiết &rarr;
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentDept ? "Cập nhật phòng ban" : "Thêm phòng ban mới"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mã phòng ban
                </label>
                <input
                  type="text"
                  value={formData.MaPB}
                  onChange={(e) =>
                    setFormData({ ...formData, MaPB: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên phòng ban
                </label>
                <input
                  type="text"
                  value={formData.TenPB}
                  onChange={(e) =>
                    setFormData({ ...formData, TenPB: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5"
                  placeholder="Ví dụ: Phòng Kế Toán"
                  required
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Save size={16} />
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Xác nhận xóa
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa phòng ban{" "}
              <span className="font-bold text-gray-800 dark:text-gray-200">
                "{currentDept?.TenPB}"
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết nhân viên */}
      {detailDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Nhân viên phòng {detailDept.TenPB}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Mã phòng ban: {detailDept.MaPB}
                </p>
              </div>
              <button
                onClick={() => setDetailDept(null)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {employeesInDetailDept.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 dark:text-gray-300">
                  Phòng ban hiện chưa có nhân viên nào.
                </p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Mã NV
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Họ và tên
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tên chức vụ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {employeesInDetailDept.map((emp, idx) => {
                      const fullName = `${emp.HONV ?? ""} ${
                        emp.TENNV ?? ""
                      }`
                        .trim()
                        .replace(/\s+/g, " ");
                      return (
                        <tr key={emp.MANV ?? idx}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 font-mono">
                            {emp.MANV || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {fullName}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                            {emp.TenCV || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
