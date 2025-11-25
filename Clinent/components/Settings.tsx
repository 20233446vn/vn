import React, { useEffect, useState } from "react";
import {
  Shield,
  Users,
  Key,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Lock,
  Save,
  Trash2,
  Edit,
  X,
} from "lucide-react";
import { SystemUser } from "../types";

const API_BASE = "http://localhost:3001";

type TabKey = "users" | "roles" | "security";

interface SystemRole {
  MaPQ: string;
  TenPQ: string;
  MoTa?: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<TabKey>("users");

  // User Management State
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState<Partial<SystemUser>>({
    TenDN: "",
    HoTen: "",
    QuyenHan: "Nhân viên",
    TrangThai: "Hoạt động",
  });
  const [savingUser, setSavingUser] = useState(false);

  // Roles
  const [roles, setRoles] = useState<SystemRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const tabs = [
    { id: "users", label: "Tài khoản hệ thống", icon: <Users size={18} /> },
    {
      id: "roles",
      label: "Phân quyền & Chức vụ",
      icon: <Shield size={18} />,
    },
    {
      id: "security",
      label: "Bảo mật & Mật khẩu",
      icon: <Key size={18} />,
    },
  ];

  // ===== API CALLS =====
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await fetch(`${API_BASE}/api/system-users`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemUser[] = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setUsersError("Không tải được danh sách tài khoản.");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      setRolesError(null);
      const res = await fetch(`${API_BASE}/api/system-roles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemRole[] = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setRolesError("Không tải được danh sách nhóm quyền.");
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // ===== USER HANDLERS =====
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      TenDN: "",
      HoTen: "",
      QuyenHan: "Nhân viên",
      TrangThai: "Hoạt động",
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setEditingUser(user);
    setUserForm({ ...user });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/system-users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers((prev) => prev.filter((u) => u.MaPQ !== id));
    } catch (err) {
      console.error(err);
      alert("Xóa tài khoản thất bại. Vui lòng thử lại.");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.TenDN || !userForm.HoTen) {
      alert("Vui lòng nhập Tên đăng nhập và Họ tên.");
      return;
    }

    try {
      setSavingUser(true);
      let res: Response;

      if (editingUser) {
        // UPDATE
        res = await fetch(
          `${API_BASE}/api/system-users/${editingUser.MaPQ}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userForm),
          }
        );
      } else {
        // CREATE
        res = await fetch(`${API_BASE}/api/system-users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const saved: SystemUser = await res.json();

      if (editingUser) {
        setUsers((prev) =>
          prev.map((u) => (u.MaPQ === saved.MaPQ ? saved : u))
        );
      } else {
        setUsers((prev) => [...prev, saved]);
      }

      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert("Lưu tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setSavingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      u.TenDN.toLowerCase().includes(keyword) ||
      u.HoTen.toLowerCase().includes(keyword) ||
      (u.QuyenHan || "").toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cấu hình hệ thống
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Quản lý tài khoản, phân quyền và bảo mật ứng dụng
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden min-h-[600px]">
        {/* Tabs Header */}
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-slate-700/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* USERS TAB */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Tìm tài khoản..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <button
                  onClick={handleAddUser}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Plus size={16} />
                  <span>Tạo tài khoản</span>
                </button>
              </div>

              {usersLoading && (
                <p className="text-sm text-gray-500">
                  Đang tải danh sách tài khoản...
                </p>
              )}
              {usersError && (
                <p className="text-sm text-red-500">{usersError}</p>
              )}

              <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                  <thead className="bg-gray-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tên đăng nhập
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Họ tên
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Quyền hạn
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.MaPQ}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {user.TenDN}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.HoTen}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {user.QuyenHan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.TrangThai === "Hoạt động" ||
                          !user.TrangThai ? (
                            <span className="flex items-center text-green-600 dark:text-green-400 gap-1">
                              <CheckCircle size={14} /> Hoạt động
                            </span>
                          ) : (
                            <span className="flex items-center text-red-600 dark:text-red-400 gap-1">
                              <XCircle size={14} /> Khóa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.MaPQ)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!usersLoading &&
                      !usersError &&
                      filteredUsers.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-4 text-sm text-gray-500 text-center"
                          >
                            Không tìm thấy tài khoản phù hợp.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === "roles" && (
            <div className="space-y-6">
              {rolesLoading && (
                <p className="text-sm text-gray-500">
                  Đang tải danh sách nhóm quyền...
                </p>
              )}
              {rolesError && (
                <p className="text-sm text-red-500">{rolesError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roles.map((role) => (
                  <div
                    key={role.MaPQ}
                    className="border border-gray-200 dark:border-slate-700 rounded-xl p-5 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg">
                          <Shield size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {role.TenPQ}
                        </h3>
                      </div>
                      <button className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        Chỉnh sửa
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {role.MoTa || "Nhóm quyền hệ thống"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        Xem báo cáo
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        Quản lý nhân sự
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                        +3
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add New Role Card (chưa nối API, để giao diện) */}
                <button className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all">
                  <Plus size={32} className="mb-2" />
                  <span className="font-medium">Thêm nhóm quyền mới</span>
                </button>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Đổi mật khẩu
              </h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border bg-white dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nhập lại mật khẩu mới
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      className="block w-full pl-10 border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 border bg-white dark:bg-slate-900 dark:text:white"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    className="flex items-center justify-center w-full sm:w-auto px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    <Save size={16} className="mr-2" />
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingUser ? "Cập nhật tài khoản" : "Tạo tài khoản mới"}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                disabled={savingUser}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tên đăng nhập
                </label>
                <input
                  type="text"
                  value={userForm.TenDN || ""}
                  onChange={(e) =>
                    setUserForm({ ...userForm, TenDN: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  value={userForm.HoTen || ""}
                  onChange={(e) =>
                    setUserForm({ ...userForm, HoTen: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quyền hạn
                </label>
                <select
                  value={userForm.QuyenHan || "Nhân viên"}
                  onChange={(e) =>
                    setUserForm({ ...userForm, QuyenHan: e.target.value })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                >
                  <option value="Admin">Admin</option>
                  <option value="Giám đốc">Giám đốc</option>
                  <option value="Quản lý Nhân sự">Quản lý Nhân sự</option>
                  <option value="Nhân viên">Nhân viên</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Trạng thái
                </label>
                <select
                  value={userForm.TrangThai || "Hoạt động"}
                  onChange={(e) =>
                    setUserForm({
                      ...userForm,
                      TrangThai: e.target
                        .value as "Hoạt động" | "Khóa",
                    })
                  }
                  className="block w-full rounded-lg border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white p-2.5 border"
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Khóa">Khóa</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  disabled={savingUser}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60"
                >
                  <Save size={16} />
                  {savingUser ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
