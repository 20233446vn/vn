import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import cron from "node-cron";
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
  DiaChi?: string | null;
  NgaySinh?: string | null;
  NoiSinh?: string | null;
  GioiTinh?: string | null;
  DanToc?: string | null;
  TonGiao?: string | null;
  QuocTich?: string | null;
  CMND?: string | null;
  HoKhau?: string | null;
  HIRE_DATE?: string | null;
  NgayVaoLam?: string | null;
  TrinhDoVanHoa?: string | null;
  TrinhDoChuyenMon?: string | null;
  LuongCoBan?: number | null;
  PhuCapChucVu?: number | null;
  LoaiHopDong?: string | null;
  SoBHYT?: string | null;
  SoTheATM?: string | null;
  MaSoThue?: string | null;
}

interface Department {
  MaPB: string;
  TenPB: string;
}

interface SystemRole {
  id: number;
  MaPQ: string;
  TenPQ: string;
  MoTa?: string | null;
}

const CONTRACT_TYPES = [
  "Không xác định thời hạn",
  "Xác định thời hạn 12 tháng",
  "Xác định thời hạn 24 tháng",
  "Thử việc",
];

const EDUCATION_LEVELS = [
  "THPT",
  "Trung cấp",
  "Cao đẳng",
  "Đại học",
  "Sau đại học",
];

const PROFESSIONAL_LEVELS = [
  "Chưa phân loại",
  "Nhân viên",
  "Chuyên viên",
  "Trưởng nhóm",
  "Trưởng phòng",
];

const ETHNIC_GROUPS = [
  "Kinh",
  "Tày",
  "Thái",
  "Mường",
  "Khmer",
  "Hoa",
  "Nùng",
  "H’Mông",
  "Dao",
  "Gia Rai",
  "Ê Đê",
  "Ba Na",
  "Sán Chay",
  "Chăm",
  "Khác",
];

const RELIGIONS = [
  "Không",
  "Phật giáo",
  "Công giáo",
  "Tin Lành",
  "Cao Đài",
  "Phật giáo Hòa Hảo",
  "Khác",
];

const NATIONALITIES = [
  "Việt Nam",
  "Hàn Quốc",
  "Nhật Bản",
  "Trung Quốc",
  "Mỹ",
  "Anh",
  "Pháp",
  "Đức",
  "Úc",
  "Singapore",
  "Thái Lan",
  "Khác",
];

const NUMBER_FIELDS = new Set(["LuongCoBan", "PhuCapChucVu"]);

function resolveAvatarUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

function getNextSequence(employees: Employee[]): number {
  let max = 0;
  employees.forEach((e) => {
    if (!e.MANV) return;
    const matches = e.MANV.match(/(\d+)/g);
    if (!matches || matches.length === 0) return;
    const lastGroup = matches[matches.length - 1];
    const num = parseInt(lastGroup, 10);
    if (!isNaN(num) && num > max) max = num;
  });
  return max + 1;
}

function getManvNumber(manv: string): number {
  const matches = manv.match(/(\d+)/g);
  if (!matches || matches.length === 0) return 0;
  const last = matches[matches.length - 1];
  const num = parseInt(last, 10);
  return isNaN(num) ? 0 : num;
}

export default function EmployeeList() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

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
    NoiSinh: "",
    GioiTinh: "",
    CMND: "",
    HoKhau: "",
    DiaChi: "",
    NgayVaoLam: "",
    SoBHYT: "",
    SoTheATM: "",
    MaSoThue: "",
    LoaiHopDong: "",
    TrinhDoVanHoa: "",
    TrinhDoChuyenMon: "",
    LuongCoBan: undefined,
    PhuCapChucVu: undefined,
    DanToc: "",
    TonGiao: "",
    QuocTich: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

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
    }
  };
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/system-roles`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: SystemRole[] = await res.json();
      setRoles(data);
    } catch (err) {
      console.error("Lỗi tải danh sách quyền:", err);
    }
  };
  const getPositionName = (maCV?: string | null): string => {
    if (!maCV) return "Chức vụ chưa cập nhật";
    const found = roles.find((r) => r.MaPQ === maCV);
    return found?.TenPQ || `Mã quyền: ${maCV}`;
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchRoles();
  }, []);


  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {
          /* ignore */
        }
      }
    };
  }, [avatarPreview]);

  const filteredEmployees = useMemo(() => {
    let list = employees
      .filter((e) => {
        if (deptFilter === "all") return true;
        return e.MaPB === deptFilter;
      })
      .filter((e) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const fullName = `${e.HONV} ${e.TENNV}`.toLowerCase();
        return (
          e.MANV.toLowerCase().includes(q) ||
          fullName.includes(q) ||
          (e.DienThoai || "").toLowerCase().includes(q) ||
          (e.Email || "").toLowerCase().includes(q)
        );
      });

    list = list.sort((a, b) => getManvNumber(a.MANV) - getManvNumber(b.MANV));
    return list;
  }, [employees, deptFilter, search]);

  const getDeptName = (maPB?: string | null) => {
    if (!maPB) return "Chưa cập nhật";
    return (
      departments.find((d) => d.MaPB === maPB)?.TenPB || "Chưa cập nhật"
    );
  };

  const openAddModal = () => {
    const nextSeqNumber = getNextSequence(employees);
    const seq = String(nextSeqNumber).padStart(4, "0");
    const newMANV = `NV${seq}`;
    const newSoBHYT = `YT${seq}`;

    setEditing(null);
    setFormData({
      MANV: newMANV,
      HONV: "",
      TENNV: "",
      MaPB: "",
      MaCV: "",
      DienThoai: "",
      Email: "",
      Status: "Đang làm việc",
      AvatarUrl: "",
      NgaySinh: "",
      NoiSinh: "",
      GioiTinh: "",
      CMND: "",
      HoKhau: "",
      DiaChi: "",
      NgayVaoLam: "",
      SoBHYT: newSoBHYT,
      SoTheATM: "",
      MaSoThue: "",
      LoaiHopDong: "",
      TrinhDoVanHoa: "",
      TrinhDoChuyenMon: "",
      LuongCoBan: undefined,
      PhuCapChucVu: undefined,
      DanToc: "",
      TonGiao: "",
      QuocTich: "",
    });
    setAvatarFile(null);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview("");
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEditing(emp);
    setFormData({
      ...emp,
      AvatarUrl: emp.AvatarUrl || "",
      NgaySinh: emp.NgaySinh || "",
      NoiSinh: emp.NoiSinh || "",
      GioiTinh: emp.GioiTinh || "",
      CMND: emp.CMND || "",
      HoKhau: emp.HoKhau || "",
      DiaChi: emp.DiaChi || "",
      NgayVaoLam: emp.NgayVaoLam || "",
      SoBHYT: emp.SoBHYT || "",
      SoTheATM: emp.SoTheATM || "",
      MaSoThue: emp.MaSoThue || "",
      LoaiHopDong: emp.LoaiHopDong || "",
      TrinhDoVanHoa: emp.TrinhDoVanHoa || "",
      TrinhDoChuyenMon: emp.TrinhDoChuyenMon || "",
      LuongCoBan: emp.LuongCoBan ?? undefined,
      PhuCapChucVu: emp.PhuCapChucVu ?? undefined,
      DanToc: emp.DanToc || "",
      TonGiao: emp.TonGiao || "",
      QuocTich: emp.QuocTich || "",
    });
    setAvatarFile(null);
    const resolved = resolveAvatarUrl(emp.AvatarUrl as string | undefined);
    setAvatarPreview(resolved);
    setFormError(null);
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (NUMBER_FIELDS.has(name)) {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const showError = (msg: string) => {
    setFormError(msg);
    if (formRef.current) {
      formRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.TENNV) {
      showError("Vui lòng nhập Tên nhân viên.");
      return;
    }

    const phone = (formData.DienThoai || "").trim();
    const cmnd = (formData.CMND || "").trim();
    const email = (formData.Email || "").trim();

    if (phone && !/^\d{10}$/.test(phone)) {
      showError("Số điện thoại phải gồm đúng 10 chữ số.");
      return;
    }

    if (cmnd && !/^\d{12}$/.test(cmnd)) {
      showError("Số CMND/CCCD phải gồm đúng 12 chữ số.");
      return;
    }

    if (email && !/^[\w.%+-]+@gmail\.com$/i.test(email)) {
      showError("Email phải là địa chỉ Gmail hợp lệ (kết thúc bằng @gmail.com).");
      return;
    }

    try {
      setSaving(true);
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, String(value));
        }
      });
      if (avatarFile) {
        form.append("avatar", avatarFile);
      }

      if (editing) {
        const res = await fetch(`${API_BASE}/api/employees/${editing.MANV}`, {
          method: "PUT",
          body: form,
        });
        if (!res.ok) {
          let msg = "Không lưu được nhân viên.";
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {}
          showError(msg);
          return;
        }
        await fetchEmployees();
      } else {
        const res = await fetch(`${API_BASE}/api/employees`, {
          method: "POST",
          body: form,
        });
        if (!res.ok) {
          let msg = "Không lưu được nhân viên.";
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {}
          showError(msg);
          return;
        }
        await fetchEmployees();
      }

      setShowModal(false);
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {}
      }
      setAvatarPreview("");
      setEditing(null);
      setFormError(null);
    } catch (err) {
      console.error("Lỗi khi lưu nhân viên:", err);
      showError("Có lỗi xảy ra khi lưu nhân viên. Vui lòng thử lại.");
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

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
    setFormError(null);
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
      MaSoThue: "",
      LoaiHopDong: "",
      TrinhDoVanHoa: "",
      TrinhDoChuyenMon: "",
      LuongCoBan: undefined,
      PhuCapChucVu: undefined,
      DanToc: "",
      TonGiao: "",
      QuocTich: "",
    });
    setAvatarFile(null);
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }
    setAvatarPreview("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Danh sách nhân viên
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/70 p-4 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, mã NV, SĐT, email..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:ring-blue-500 focus:border-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
          <select
            className="border border-gray-300 dark:border-slate-600 rounded-lg text-sm px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/70 overflow-hidden">
        {loading && (
          <div className="p-4 text-sm text-gray-500 dark:text-slate-400">
            Đang tải dữ liệu...
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700/70">
              <thead className="bg-gray-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase">
                    Chức vụ / Phòng ban
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-slate-300 uppercase">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                {filteredEmployees.map((emp) => {
                  const avatarSrc = resolveAvatarUrl(emp.AvatarUrl);
                  const positionName = getPositionName(emp.MaCV);
                  return (
                    <tr
                      key={emp.MANV}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/80"
                    >
                      {/* Nhân viên */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700 mr-3">
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={emp.TENNV}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-slate-200">
                                {emp.TENNV?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                              {emp.HONV} {emp.TENNV}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-slate-400">
                              {emp.MANV}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Chức vụ / phòng ban */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">
                        <div className="font-medium">{positionName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {getDeptName(emp.MaPB)}
                        </div>
                      </td>

                      {/* Liên hệ */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-slate-200">
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400 dark:text-slate-400" />
                          <span className="font-medium">
                            {emp.DienThoai || "-"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400 mt-1">
                          <Mail className="w-3 h-3 text-gray-400 dark:text-slate-400" />
                          <span>{emp.Email || "-"}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {emp.Status === "Nghỉ thai sản" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-200">
                            Nghỉ thai sản
                          </span>
                        ) : emp.Status === "Đang làm việc" || !emp.Status ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-200">
                            {emp.Status || "Đang làm việc"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-50">
                            {emp.Status}
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="inline-flex items-center gap-2">
                          <button
                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                            title="Xem chi tiết"
                            onClick={() => navigate(`/employees/${emp.MANV}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                            title="Chỉnh sửa"
                            onClick={() => openEditModal(emp)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
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
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-slate-400"
                      colSpan={5}
                    >
                      Không có nhân viên phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="px-6 py-3 text-xs text-gray-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-700/70">
              Hiển thị {filteredEmployees.length} của {employees.length} kết quả
            </div>
          </>
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-3xl w-full flex flex-col max-h-[90vh] border border-gray-100 dark:border-slate-700/70">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/70 flex justify-between items-center flex-none">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                {editing ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </h3>
              <button
                className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              ref={formRef}
              className="p-6 space-y-6 overflow-y-auto"
              onSubmit={handleSave}
            >
              {formError && (
                <div className="mb-3 px-3 py-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              {/* Hàng 1: mã, họ, tên */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Mã NV"
                  name="MANV"
                  value={formData.MANV || ""}
                  onChange={handleChange}
                  disabled
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
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Ảnh nhân viên (tải từ máy)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  />
                </div>
                <div className="flex md:justify-center">
                  <div className="flex flex-col items-center">
                    <span className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Xem trước
                    </span>
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-200 dark:bg-slate-700">
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
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500 dark:text-slate-300">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hàng 3: phòng ban, chức vụ, trạng thái */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Phòng ban
                  </label>
                  <select
                    name="MaPB"
                    value={formData.MaPB || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments.map((d) => (
                      <option key={d.MaPB} value={d.MaPB}>
                        {d.TenPB}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Chức vụ
                  </label>
                  <select
                    name="MaCV"
                    value={formData.MaCV || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn chức vụ --</option>
                    {roles.map((r) => (
                      <option key={r.MaPQ} value={r.MaPQ}>
                        {r.TenPQ}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Trạng thái
                  </label>
                  <select
                    name="Status"
                    value={formData.Status || "Đang làm việc"}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
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
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Giới tính
                  </label>
                  <select
                    name="GioiTinh"
                    value={formData.GioiTinh || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
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

              {/* Dân tộc + Tôn giáo + Quốc tịch */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Dân tộc
                  </label>
                  <select
                    name="DanToc"
                    value={formData.DanToc || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn dân tộc --</option>
                    {ETHNIC_GROUPS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Tôn giáo
                  </label>
                  <select
                    name="TonGiao"
                    value={formData.TonGiao || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn tôn giáo --</option>
                    {RELIGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                    Quốc tịch
                  </label>
                  <select
                    name="QuocTich"
                    value={formData.QuocTich || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  >
                    <option value="">-- Chọn quốc tịch --</option>
                    {NATIONALITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nơi sinh, hộ khẩu, địa chỉ */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field
                  label="Nơi sinh"
                  name="NoiSinh"
                  value={formData.NoiSinh || ""}
                  onChange={handleChange}
                />
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

              {/* Ngày vào làm, BHYT, MST */}
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
                  disabled
                />
                <Field
                  label="Mã số thuế"
                  name="MaSoThue"
                  value={formData.MaSoThue || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Liên hệ */}
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

              {/* Hợp đồng */}
              <div className="mt-4 border-t border-gray-200 dark:border-slate-700/70 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-100 mb-2">
                  Hợp đồng & Công tác
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Loại hợp đồng
                    </label>
                    <select
                      name="LoaiHopDong"
                      value={formData.LoaiHopDong ?? ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn loại hợp đồng --</option>
                      {CONTRACT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trình độ */}
              <div className="mt-4 border-t border-gray-200 dark:border-slate-700/70 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-100 mb-2">
                  Trình độ & Đào tạo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Trình độ văn hóa
                    </label>
                    <select
                      name="TrinhDoVanHoa"
                      value={formData.TrinhDoVanHoa ?? ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn trình độ --</option>
                      {EDUCATION_LEVELS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                      Trình độ chuyên môn
                    </label>
                    <select
                      name="TrinhDoChuyenMon"
                      value={formData.TrinhDoChuyenMon ?? ""}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                    >
                      <option value="">-- Chọn chuyên môn --</option>
                      {PROFESSIONAL_LEVELS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lương */}
              <div className="mt-4 border-t border-gray-200 dark:border-slate-700/70 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-100 mb-2">
                  Lương & Thưởng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Lương cơ bản"
                    name="LuongCoBan"
                    type="number"
                    value={formData.LuongCoBan ?? ""}
                    onChange={handleChange}
                  />
                  <Field
                    label="Phụ cấp chức vụ / thưởng"
                    name="PhuCapChucVu"
                    type="number"
                    value={formData.PhuCapChucVu ?? ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-100 bg-white dark:bg-slate-800"
                  onClick={closeModal}
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
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-sm w-full p-6 text-center border border-gray-100 dark:border-slate-700/70">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-300">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-2">
              Xóa nhân viên
            </h3>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
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
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-100 bg-white dark:bg-slate-800"
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
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={!!disabled}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 disabled:bg-gray-100 dark:disabled:bg-slate-700/60"
      />
    </div>
  );
}
