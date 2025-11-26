import React, { useEffect, useMemo, useState } from "react";
import { Users, Search, Plus, X, Save, RotateCcw } from "lucide-react";

const API_BASE = "http://localhost:3001";

interface SystemUser {
  id: number;
  TenDN: string; // Tên đăng nhập
  MatKhau: string; // Mật khẩu 
  HoTen: string; // Họ và tên
  MaPQ: string;  // Mã quyền
  TenPQ?: string; // Tên quyền (join từ system_roles)
  TrangThai: "Hoạt động" | "Khóa";
}

interface SystemRole {
  id: number;
  MaPQ: string;
  TenPQ: string;
  MoTa?: string;
}

interface UserForm {
  TenDN: string;
  HoTen: string;
  MaPQ: string;
  TrangThai: "Hoạt động" | "Khóa";
  MatKhau: string; // chỉ dùng trong form (POST/PUT), không hiển thị trong bảng
}

const Settings: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [form, setForm] = useState<UserForm>({
    TenDN: "",
    HoTen: "",
    MaPQ: "",
    TrangThai: "Hoạt động",
    MatKhau: "",
  });

  // ------------------ LOAD DATA ------------------

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/system-users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemUser[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách tài khoản hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const res = await fetch(`${API_BASE}/api/system-roles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemRole[] = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
      // Không cần báo lỗi to quá, form chỉ thiếu danh sách quyền
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // ------------------ FORM HANDLERS ------------------

  const openAddModal = () => {
    setEditingUser(null);
    setForm({
      TenDN: "",
      HoTen: "",
      MaPQ: roles[0]?.MaPQ || "",
      TrangThai: "Hoạt động",
      MatKhau: "",
    });
    setShowModal(true);
  };

  const openEditModal = (user: SystemUser) => {
    setEditingUser(user);
    setForm({
      TenDN: user.TenDN,
      HoTen: user.HoTen,
      MaPQ: user.MaPQ,
      TrangThai: user.TrangThai,
      MatKhau: "", // để trống, nếu nhập mới thì sẽ cập nhật lại mật khẩu
    });
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingUser(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.TenDN || !form.HoTen || !form.MaPQ) {
      alert("Vui lòng nhập đầy đủ Tên đăng nhập, Họ tên và Mã quyền.");
      return;
    }

    if (!editingUser && !form.MatKhau) {
      alert("Vui lòng nhập mật khẩu cho tài khoản mới.");
      return;
    }

    try {
      setSaving(true);
      let res: Response;

      const payload: any = {
        TenDN: form.TenDN,
        HoTen: form.HoTen,
        MaPQ: form.MaPQ,
        TrangThai: form.TrangThai,
      };

      // Chỉ gửi MatKhau nếu có nhập (tạo mới hoặc đổi mật khẩu)
      if (form.MatKhau && form.MatKhau.trim() !== "") {
        payload.MatKhau = form.MatKhau;
      }

      if (editingUser) {
        // Cập nhật
        res = await fetch(`${API_BASE}/api/system-users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Tạo mới
        res = await fetch(`${API_BASE}/api/system-users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const msg = await res.text();
        console.error("Save error:", msg);
        throw new Error(`HTTP ${res.status}`);
      }

      const saved: SystemUser = await res.json();

      if (editingUser) {
        setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      } else {
        setUsers((prev) => [...prev, saved]);
      }

      setShowModal(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error(err);
      alert("Lưu tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: SystemUser) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${user.TenDN}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/system-users/${user.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      alert("Xóa tài khoản thất bại. Vui lòng thử lại.");
    }
  };

  const handleResetPassword = async (user: SystemUser) => {
    if (
      !window.confirm(
        `Đặt lại mật khẩu cho tài khoản "${user.TenDN}" về mặc định?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/system-users/${user.id}/reset-password`,
        {
          method: "PUT",
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      alert(data.message || "Đã reset mật khẩu thành công.");
    } catch (err) {
      console.error(err);
      alert("Reset mật khẩu thất bại. Vui lòng thử lại.");
    }
  };

  // ------------------ FILTERED LIST ------------------

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        u.TenDN.toLowerCase().includes(q) ||
        (u.HoTen && u.HoTen.toLowerCase().includes(q)) ||
        (u.TenPQ && u.TenPQ.toLowerCase().includes(q))
    );
  }, [users, searchTerm]);

  // ------------------ RENDER ------------------

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="text-blue-500" size={22} />
          Tài khoản hệ thống
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Quản lý tài khoản đăng nhập, quyền truy cập và trạng thái hoạt động.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm theo tài khoản, họ tên hoặc quyền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm"
          >
            <Plus size={18} />
            Thêm tài khoản
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              Đang tải danh sách tài khoản...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-10 text-center text-gray-500 text-sm">
              Không có tài khoản nào phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Tài khoản
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Mật khẩu
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Họ và tên
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Quyền
                    </th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-600 dark:text-gray-300">
                      Trạng thái
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 dark:border-slate-700/70 hover:bg-gray-50/70 dark:hover:bg-slate-900/60"
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {user.TenDN}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">
                        {user.MatKhau}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">
                        {user.HoTen}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-800 dark:text-gray-200">
                        <div className="flex flex-col">
                          <span className="font-medium">{user.MaPQ}</span>
                          {user.TenPQ && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {user.TenPQ}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            user.TrangThai === "Hoạt động"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-200"
                          }`}
                        >
                          {user.TrangThai}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right space-x-2">
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:border-amber-500/70 dark:text-amber-200 dark:bg-amber-900/40"
                          title="Reset mật khẩu"
                        >
                          <RotateCcw size={14} className="mr-1" />
                          Reset MK
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:border-blue-500/70 dark:text-blue-200 dark:bg-blue-900/40"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-500/70 dark:text-red-200 dark:bg-red-900/40"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm / sửa tài khoản */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingUser ? "Chỉnh sửa tài khoản" : "Thêm tài khoản hệ thống"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  name="TenDN"
                  value={form.TenDN}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: admin, nv001..."
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="HoTen"
                  value={form.HoTen}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập họ tên hiển thị"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quyền (Mã quyền - MaPQ)
                </label>
                <select
                  name="MaPQ"
                  value={form.MaPQ}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Chọn mã quyền --</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.MaPQ}>
                      {role.MaPQ} - {role.TenPQ}
                    </option>
                  ))}
                </select>
                {rolesLoading && (
                  <p className="text-xs text-gray-400 mt-1">
                    Đang tải danh sách quyền...
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Trạng thái
                </label>
                <select
                  name="TrangThai"
                  value={form.TrangThai}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Khóa">Khóa</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Mật khẩu{" "}
                  {editingUser && (
                    <span className="text-xs text-gray-400">
                      (để trống nếu không đổi)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  name="MatKhau"
                  value={form.MatKhau}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    editingUser
                      ? "Nhập mật khẩu mới (nếu muốn đổi)"
                      : "Nhập mật khẩu ban đầu"
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving
                    ? "Đang lưu..."
                    : editingUser
                    ? "Lưu thay đổi"
                    : "Thêm tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
