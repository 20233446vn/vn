import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Phone,
  Mail,
} from "lucide-react";

const API_BASE = "http://localhost:3001";

interface Employee {
  MANV: string;
  HONV: string;
  TENNV: string;
  MaPB?: string | null;
  MaCV?: string | null;
  AvatarUrl?: string | null;
  Status?: string | null;
  DienThoai?: string | null;
  Email?: string | null;

  // Thông tin thêm
  NgaySinh?: string | null;
  GioiTinh?: string | null;
  CMND?: string | null;
  HoKhau?: string | null;
  DiaChi?: string | null;
  NgayVaoLam?: string | null;
  SoBHYT?: string | null;
  SoTheATM?: string | null;
}

interface Department {
  MaPB: string;
  TenPB: string;
}

function resolveAvatarUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

export default function EmployeeList() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal thêm / sửa
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    MANV: "",
    HONV: "",
    TENNV: "",
    MaPB: "",
    MaCV: "",
    DienThoai: "",
    Email: "",
    Status: "Đang làm việc",
    AvatarUrl: "",
    NgaySinh: "",
    GioiTinh: "",
    CMND: "",
    HoKhau: "",
    DiaChi: "",
    NgayVaoLam: "",
    SoBHYT: "",
    SoTheATM: "",
  });

  // File ảnh & preview
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Modal xóa
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  // ----- LOAD DATA -----
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/employees`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Employee[] = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách nhân viên.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/departments`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: Department[] = await res.json();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      // không bắt buộc hiển thị lỗi phòng ban
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  // ----- FILTER / SEARCH -----
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((e) => {
        if (deptFilter === "all") return true;
        return e.MaPB === deptFilter;
      })
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          e.MANV.toLowerCase().includes(q) ||
          `${e.HONV} ${e.TENNV}`.toLowerCase().includes(q)
        );
      });
  }, [employees, deptFilter, search]);

  const getDeptName = (maPB?: string | null) => {
    if (!maPB) return "Chưa cập nhật";
    return (
      departments.find((d) => d.MaPB === maPB)?.TenPB || "Chưa cập nhật"
    );
  };

  // ----- HANDLERS -----
  const openAddModal = () => {
    setEditing(null);
    setFormData({
      MANV: "",
      HONV: "",
      TENNV: "",
      MaPB: "",
      MaCV: "",
      DienThoai: "",
      Email: "",
      Status: "Đang làm việc",
      AvatarUrl: "",
      NgaySinh: "",
      GioiTinh: "",
      CMND: "",
      HoKhau: "",
      DiaChi: "",
      NgayVaoLam: "",
      SoBHYT: "",
      SoTheATM: "",
    });
    setAvatarFile(null);
    setAvatarPreview("");
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditing(emp);
    setFormData({
      ...emp,
      AvatarUrl: emp.AvatarUrl || "",
      NgaySinh: emp.NgaySinh || "",
      GioiTinh: emp.GioiTinh || "",
      CMND: emp.CMND || "",
      HoKhau: emp.HoKhau || "",
      DiaChi: emp.DiaChi || "",
      NgayVaoLam: emp.NgayVaoLam || "",
      SoBHYT: emp.SoBHYT || "",
      SoTheATM: emp.SoTheATM || "",
    });
    setAvatarFile(null);
    setAvatarPreview(resolveAvatarUrl(emp.AvatarUrl));
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      // không xoá preview cũ nếu bỏ chọn
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.MANV || !formData.TENNV) {
      alert("Vui lòng nhập Mã NV và Tên nhân viên.");
      return;
    }

    try {
      setSaving(true);

      const form = new FormData();
      // field text
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, String(value));
        }
      });
      // file avatar nếu có chọn mới
      if (avatarFile) {
        form.append("avatar", avatarFile); // phải khớp upload.single("avatar")
      }

      if (editing) {
        const res = await fetch(
          `${API_BASE}/api/employees/${editing.MANV}`,
          {
            method: "PUT",
            body: form,
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchEmployees();
      } else {
        const res = await fetch(`${API_BASE}/api/employees`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchEmployees();
      }

      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert("Lưu nhân viên thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/employees/${deleteTarget.MANV}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchEmployees();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Xóa nhân viên thất bại.");
    }
  };

  // ----- RENDER -----

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách nhân viên
          </h1>
          <p className="text-gray-500 text-sm">
            Quản lý hồ sơ nhân sự của công ty
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm mới
        </button>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã NV..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="border border-gray-300 rounded-lg text-sm px-3 py-2"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d.MaPB} value={d.MaPB}>
                {d.TenPB}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && (
          <div className="p-4 text-sm text-gray-500">Đang tải dữ liệu...</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Chức vụ / Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((emp) => {
                  const avatarSrc = resolveAvatarUrl(emp.AvatarUrl);
                  return (
                    <tr key={emp.MANV} className="hover:bg-gray-50">
                      {/* Nhân viên */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 mr-3">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={emp.TENNV}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-gray-600">
                                {emp.TENNV?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {emp.HONV} {emp.TENNV}
                            </div>
                            <div className="text-xs text-gray-500">
                              {emp.MANV}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Chức vụ / phòng ban */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="font-medium">
                          {emp.MaCV || "Chức vụ chưa cập nhật"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getDeptName(emp.MaPB)}
                        </div>
                      </td>

                      {/* Liên hệ */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">
                            {emp.DienThoai || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{emp.Email || "-"}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {emp.Status === "Nghỉ thai sản" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            Nghỉ thai sản
                          </span>
                        ) : emp.Status === "Đang làm việc" || !emp.Status ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {emp.Status || "Đang làm việc"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                            {emp.Status}
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          {/* Xem chi tiết */}
                          <button
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Xem chi tiết"
                            onClick={() => navigate(`/employees/${emp.MANV}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Sửa */}
                          <button
                            className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100"
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(emp)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Xóa */}
                          <button
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                            title="Xóa"
                            onClick={() => setDeleteTarget(emp)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-4 text-center text-sm text-gray-500"
                      colSpan={5}
                    >
                      Không có nhân viên phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* footer nhỏ: tổng số */}
            <div className="px-6 py-3 text-xs text-gray-500 border-t border-gray-100">
              Hiển thị {filteredEmployees.length} của {employees.length} kết quả
            </div>
          </>
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-600"
                onClick={() => !saving && setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSave}>
              {/* Hàng 1: mã, họ, tên */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Mã NV *"
                  name="MANV"
                  value={formData.MANV || ""}
                  onChange={handleChange}
                  disabled={!!editing}
                />
                <Field
                  label="Họ"
                  name="HONV"
                  value={formData.HONV || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Tên *"
                  name="TENNV"
                  value={formData.TENNV || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Hàng 2: Avatar + preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Ảnh nhân viên (tải từ máy)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white"
                  />
                  {/* gửi AvatarUrl hiện tại (nếu có) để backend dùng lại nếu không upload mới */}
                  <input
                    type="hidden"
                    name="AvatarUrl"
                    value={formData.AvatarUrl || ""}
                  />
                </div>
                <div className="flex md:justify-center">
                  <div className="flex flex-col items-center">
                    <span className="block text-xs font-medium text-gray-500 mb-1">
                      Xem trước
                    </span>
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200">
                      {avatarPreview || formData.AvatarUrl ? (
                        <img
                          src={
                            avatarPreview ||
                            resolveAvatarUrl(formData.AvatarUrl as string)
                          }
                          alt="Avatar preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hàng 3: phòng ban, chức vụ, trạng thái */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Mã phòng ban"
                  name="MaPB"
                  value={formData.MaPB || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Mã chức vụ"
                  name="MaCV"
                  value={formData.MaCV || ""}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="Status"
                    value={formData.Status || "Đang làm việc"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Nghỉ thai sản">Nghỉ thai sản</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              {/* Hàng 4: ngày sinh, giới tính, CMND */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Ngày sinh"
                  name="NgaySinh"
                  type="date"
                  value={formData.NgaySinh || ""}
                  onChange={handleChange}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="GioiTinh"
                    value={formData.GioiTinh || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <Field
                  label="CMND/CCCD"
                  name="CMND"
                  value={formData.CMND || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Hàng 5: hộ khẩu, địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Hộ khẩu"
                  name="HoKhau"
                  value={formData.HoKhau || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Địa chỉ hiện tại"
                  name="DiaChi"
                  value={formData.DiaChi || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Hàng 6: ngày vào làm, BHYT, ATM */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Ngày vào làm"
                  name="NgayVaoLam"
                  type="date"
                  value={formData.NgayVaoLam || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Số BHYT"
                  name="SoBHYT"
                  value={formData.SoBHYT || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Số thẻ ATM"
                  name="SoTheATM"
                  value={formData.SoTheATM || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Hàng 7: liên hệ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Điện thoại"
                  name="DienThoai"
                  value={formData.DienThoai || ""}
                  onChange={handleChange}
                />
                <Field
                  label="Email"
                  name="Email"
                  value={formData.Email || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 bg-white"
                  onClick={() => !saving && setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÓA */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Xóa nhân viên
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa nhân viên{" "}
              <span className="font-semibold">
                {deleteTarget.HONV} {deleteTarget.TENNV} ({deleteTarget.MANV})
              </span>
              ?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 bg-white"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- COMPONENT PHỤ ---- */
function Field({
  label,
  name,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:bg-gray-100"
      />
    </div>
  );
}
