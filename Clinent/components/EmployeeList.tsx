import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  AlertTriangle,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:3001";

interface EmployeeDetail {
  id?: number;
  MANV: string;
  HONV?: string;
  TENNV: string;
  MaPB?: string;
  MaCV?: string;
  DienThoai?: string;
  Email?: string;
  Status?: string;
  AvatarUrl?: string;
  NgaySinh?: string;
  NoiSinh?: string;
  GioiTinh?: string;
  DanToc?: string;
  TonGiao?: string;
  CMND?: string;
  HoKhau?: string;
  DiaChi?: string;
}

interface Department {
  MaPB: string;
  TenPB: string;
}

type TabKey = "profile" | "contracts" | "education" | "salary";

export default function EmployeeDetail() {
  const { manv } = useParams<{ manv: string }>();
  const navigate = useNavigate();

  const [emp, setEmp] = useState<EmployeeDetail | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  // modal sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeDetail>>({});
  const [saving, setSaving] = useState(false);

  // modal xóa
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchDetail = async () => {
    if (!manv) return;
    try {
      setLoading(true);
      setError(null);

      const [empRes, deptRes] = await Promise.all([
        fetch(`${API_BASE}/api/employees/${manv}`),
        fetch(`${API_BASE}/api/departments`),
      ]);

      if (empRes.status === 404) {
        setError("Không tìm thấy nhân viên.");
        return;
      }
      if (!empRes.ok) throw new Error(`HTTP ${empRes.status}`);
      if (!deptRes.ok) throw new Error(`HTTP ${deptRes.status}`);

      const empData: EmployeeDetail = await empRes.json();
      const deptData: Department[] = await deptRes.json();

      setEmp(empData);
      setEditData(empData);
      setDepartments(deptData);
    } catch (err) {
      console.error(err);
      setError("Không tải được thông tin nhân viên hoặc phòng ban.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manv]);

  const fullName = emp ? `${emp.HONV ? emp.HONV + " " : ""}${emp.TENNV}` : "";
  const statusLabel = emp?.Status || "Đang làm việc";

  const deptName = emp
    ? departments.find((d) => d.MaPB === emp.MaPB)?.TenPB ||
      emp.MaPB ||
      "Phòng ban"
    : "Phòng ban";

  const getStatusClass = () => {
    switch (statusLabel) {
      case "Nghỉ thai sản":
        return "bg-purple-100 text-purple-700";
      case "Đã nghỉ việc":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editData.MANV || !editData.TENNV) {
      alert("Vui lòng nhập Mã NV và Tên nhân viên.");
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(
        `${API_BASE}/api/employees/${emp?.MANV || editData.MANV}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setEmp(updated);
      setEditData(updated);
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Lưu thông tin thất bại, vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!emp?.MANV) return;
    try {
      const res = await fetch(`${API_BASE}/api/employees/${emp.MANV}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      navigate("/employees");
    } catch (err) {
      console.error(err);
      alert("Xóa nhân viên thất bại.");
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString("vi-VN");
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="p-6 space-y-3">
        <button
          onClick={() => navigate("/employees")}
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách
        </button>
        <div className="text-red-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!emp) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <button
        onClick={() => navigate("/employees")}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Quay lại danh sách
      </button>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-blue-500 to-indigo-500" />
        <div className="px-6 pb-4 -mt-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-xl bg-white shadow border border-gray-200 overflow-hidden flex items-center justify-center">
              {emp.AvatarUrl ? (
                <img
                  src={emp.AvatarUrl}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold text-blue-600">
                  {fullName ? fullName[0] : "?"}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {fullName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mt-1">
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {emp.MaCV || "Chức vụ"}
                </span>
                <span className="text-gray-400">•</span>
                <span>{deptName}</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-300">
                {emp.DienThoai && (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {emp.DienThoai}
                  </span>
                )}
                {emp.Email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {emp.Email}
                  </span>
                )}
                {emp.DiaChi && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {emp.DiaChi}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span
              className={
                "px-3 py-1 rounded-full text-xs font-semibold " +
                getStatusClass()
              }
            >
              {statusLabel}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
              >
                Chỉnh sửa
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
              >
                Xóa nhân viên
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-100 dark:border-slate-700">
        <div className="flex border-b border-gray-100 dark:border-slate-700">
          {[
            { key: "profile", label: "Sơ yếu lý lịch" },
            { key: "contracts", label: "Hợp đồng & Công tác" },
            { key: "education", label: "Trình độ & Đào tạo" },
            { key: "salary", label: "Lương & Thưởng" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.key
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white">
                Thông tin cá nhân
              </h2>
              <div className="border border-gray-100 dark:border-slate-700 rounded-lg divide-y divide-gray-100 dark:divide-slate-700 text-sm">
                <Row label="Mã nhân viên" value={emp.MANV} />
                <Row label="Họ và tên" value={fullName} />
                <Row label="Ngày sinh" value={formatDate(emp.NgaySinh)} />
                <Row label="Nơi sinh" value={emp.NoiSinh} />
                <Row label="Giới tính" value={emp.GioiTinh} />
                <Row label="Dân tộc" value={emp.DanToc} />
                <Row label="Tôn giáo" value={emp.TonGiao || "Không"} />
                <Row label="Số CMND/CCCD" value={emp.CMND} />
                <Row label="Hộ khẩu" value={emp.HoKhau} />
                <Row label="Địa chỉ hiện tại" value={emp.DiaChi} />
              </div>
            </div>
          )}

          {activeTab === "contracts" && (
            <PlaceholderTab title="Hợp đồng & Công tác" />
          )}

          {activeTab === "education" && (
            <PlaceholderTab title="Trình độ & Đào tạo" />
          )}

          {activeTab === "salary" && (
            <PlaceholderTab title="Lương & Thưởng" />
          )}
        </div>
      </div>

      {/* Modal xác nhận xóa */}
      {confirmDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Xác nhận xóa nhân viên
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa nhân viên{" "}
              <span className="font-semibold">{fullName}</span>?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              >
                Hủy
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

      {/* Modal chỉnh sửa */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-3xl w-full p-6 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              Chỉnh sửa thông tin nhân viên
            </h2>

            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Mã nhân viên *"
                  name="MANV"
                  value={editData.MANV || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Họ"
                  name="HONV"
                  value={editData.HONV || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Tên *"
                  name="TENNV"
                  value={editData.TENNV || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Ngày sinh (yyyy-mm-dd)"
                  name="NgaySinh"
                  value={editData.NgaySinh || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Nơi sinh"
                  name="NoiSinh"
                  value={editData.NoiSinh || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Giới tính"
                  name="GioiTinh"
                  value={editData.GioiTinh || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Dân tộc"
                  name="DanToc"
                  value={editData.DanToc || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Tôn giáo"
                  name="TonGiao"
                  value={editData.TonGiao || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Số CMND/CCCD"
                  name="CMND"
                  value={editData.CMND || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Hộ khẩu"
                  name="HoKhau"
                  value={editData.HoKhau || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Địa chỉ hiện tại"
                  name="DiaChi"
                  value={editData.DiaChi || ""}
                  onChange={handleEditChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Điện thoại"
                  name="DienThoai"
                  value={editData.DienThoai || ""}
                  onChange={handleEditChange}
                />
                <Field
                  label="Email"
                  name="Email"
                  value={editData.Email || ""}
                  onChange={handleEditChange}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="Status"
                    value={editData.Status || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm"
                  >
                    <option value="">Đang làm việc</option>
                    <option value="Nghỉ thai sản">Nghỉ thai sản</option>
                    <option value="Đã nghỉ việc">Đã nghỉ việc</option>
                  </select>
                </div>
              </div>

              <Field
                label="Ảnh đại diện (URL)"
                name="AvatarUrl"
                value={editData.AvatarUrl || ""}
                onChange={handleEditChange}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-200 bg-white dark:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------ COMPONENT PHỤ ------------ */

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-4 py-2">
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="col-span-2 text-gray-800 dark:text-gray-100 text-sm">
        {value || "—"}
      </div>
    </div>
  );
}

function PlaceholderTab({ title }: { title: string }) {
  return (
    <div className="text-sm text-gray-500">
      Phần <span className="font-medium">{title}</span> sẽ được kết nối với dữ
      liệu sau. Hiện tại dùng để minh họa giao diện giống demo.
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm"
      />
    </div>
  );
}
