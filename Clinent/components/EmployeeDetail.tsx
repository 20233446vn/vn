import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  BookOpen,
  FileText,
  Award,
  AlertCircle,
} from "lucide-react";
import { POSITIONS } from "../services/mockData";

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
  LoaiHopDong?: string | null;
  LuongCoBan?: number | null;
  PhuCapChucVu?: number | null;
}

interface Department {
  MaPB: string;
  TenPB: string;
}

interface EmploymentEvent {
  id: number;
  employee_id: number;
  date: string; // yyyy-mm-dd
  title: string;
  description: string;
}

interface Certificate {
  id: number;
  employee_id: number;
  name: string;
  provider: string;
  issue_date: string; // yyyy-mm-dd
  expiry_date: string | null;
  note: string | null;
}
interface SalaryHistoryEntry {
  id: number;
  effective_date: string;          // yyyy-mm-dd
  old_basic_salary: number | null;
  old_allowance: number | null;
  new_basic_salary: number | null;
  new_allowance: number | null;
  note: string | null;
}


const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-gray-100 last:border-0">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
      {value && value !== "" ? value : "-"}
    </dd>
  </div>
);

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function resolveAvatarUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

type ActiveTab = "profile" | "contracts" | "education" | "salary";

export default function EmployeeDetail() {
  const { manv } = useParams<{ manv: string }>();

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== DIỄN BIẾN CÔNG TÁC =====
  const [events, setEvents] = useState<EmploymentEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EmploymentEvent | null>(null);
  const [eventForm, setEventForm] = useState<{
    date: string;
    title: string;
    description: string;
  }>({
    date: "",
    title: "",
    description: "",
  });

  // ===== CHỨNG CHỈ & ĐÀO TẠO =====
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certLoading, setCertLoading] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);
  const [showCertForm, setShowCertForm] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [certForm, setCertForm] = useState<{
    name: string;
    provider: string;
    issue_date: string;
    expiry_date: string;
    note: string;
  }>({
    name: "",
    provider: "",
    issue_date: "",
    expiry_date: "",
    note: "",
  });
  const [expandedCertId, setExpandedCertId] = useState<number | null>(null);
  // ===== LỊCH SỬ LƯƠNG =====
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryEntry[]>([]);
  const [salaryHistoryLoading, setSalaryHistoryLoading] = useState(false);
  const [salaryHistoryError, setSalaryHistoryError] = useState<string | null>(null);

  // ===== LẤY EMPLOYEE + DEPARTMENTS =====
  useEffect(() => {
    const fetchData = async () => {
      if (!manv) return;
      try {
        setLoading(true);
        setError(null);

        const [empRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees/${manv}`),
          fetch(`${API_BASE}/api/departments`),
        ]);

        if (!empRes.ok) {
          if (empRes.status === 404) {
            setEmployee(null);
            return;
          }
          throw new Error("Không tải được thông tin nhân viên");
        }
        if (!deptRes.ok) {
          throw new Error("Không tải được danh sách phòng ban");
        }

        const empData: Employee = await empRes.json();
        const deptData: Department[] = await deptRes.json();

        setEmployee(empData);
        setDepartments(deptData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [manv]);

  // ===== LẤY DIỄN BIẾN KHI VÀO TAB HỢP ĐỒNG & CÔNG TÁC =====
  useEffect(() => {
    const fetchEvents = async () => {
      if (!manv || activeTab !== "contracts") return;
      try {
        setEventsLoading(true);
        setEventsError(null);

        const res = await fetch(
          `${API_BASE}/api/employees/${manv}/employment-events`
        );
        if (!res.ok) {
          throw new Error("Không tải được diễn biến công tác");
        }
        const data: EmploymentEvent[] = await res.json();
        data.sort((a, b) => (a.date < b.date ? 1 : -1));
        setEvents(data);
      } catch (err: any) {
        console.error(err);
        setEventsError(err.message || "Lỗi tải diễn biến");
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, [manv, activeTab]);

  // ===== LẤY CHỨNG CHỈ KHI VÀO TAB TRÌNH ĐỘ & ĐÀO TẠO =====
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!manv || activeTab !== "education") return;
      try {
        setCertLoading(true);
        setCertError(null);

        const res = await fetch(
          `${API_BASE}/api/employees/${manv}/certificates`
        );
        if (!res.ok) {
          throw new Error("Không tải được danh sách chứng chỉ.");
        }
        const data: Certificate[] = await res.json();
        data.sort((a, b) => (a.issue_date < b.issue_date ? 1 : -1));
        setCertificates(data);
      } catch (err: any) {
        console.error(err);
        setCertError(err.message || "Lỗi tải chứng chỉ.");
      } finally {
        setCertLoading(false);
      }
    };

    fetchCertificates();
  }, [manv, activeTab]);
  useEffect(() => {
    const fetchSalaryHistory = async () => {
      if (!manv || activeTab !== "salary") return;

      try {
        setSalaryHistoryLoading(true);
        setSalaryHistoryError(null);

        const res = await fetch(
          `${API_BASE}/api/employees/${manv}/salary-history`
        );
        if (!res.ok) {
          throw new Error("Không tải được lịch sử điều chỉnh lương.");
        }

        const data: SalaryHistoryEntry[] = await res.json();
        setSalaryHistory(data);
      } catch (err: any) {
        console.error(err);
        setSalaryHistoryError(
          err.message || "Lỗi tải lịch sử điều chỉnh lương."
        );
      } finally {
        setSalaryHistoryLoading(false);
      }
    };

    fetchSalaryHistory();
  }, [manv, activeTab]);


  // ===== HANDLER DIỄN BIẾN =====
  const handleAddEventClick = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    setEditingEvent(null);
    setEventForm({
      date: `${y}-${m}-${d}`,
      title: "",
      description: "",
    });
    setShowEventForm(true);
  };

  const handleEditEventClick = (ev: EmploymentEvent) => {
    setEditingEvent(ev);
    setEventForm({
      date: ev.date,
      title: ev.title,
      description: ev.description,
    });
    setShowEventForm(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manv) return;

    try {
      const payload = {
        date: eventForm.date,
        title: eventForm.title,
        description: eventForm.description,
      };

      let res: Response;
      if (editingEvent) {
        res = await fetch(
          `${API_BASE}/api/employment-events/${editingEvent.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        res = await fetch(
          `${API_BASE}/api/employees/${manv}/employment-events`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!res.ok) {
        throw new Error("Không lưu được diễn biến");
      }

      const saved: EmploymentEvent = await res.json();

      setEvents((prev) => {
        if (editingEvent) {
          return prev
            .map((ev) => (ev.id === saved.id ? saved : ev))
            .sort((a, b) => (a.date < b.date ? 1 : -1));
        }
        return [saved, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1));
      });

      setShowEventForm(false);
      setEditingEvent(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không lưu được diễn biến");
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xoá diễn biến này?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/employment-events/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không xoá được diễn biến");
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không xoá được diễn biến");
    }
  };

  // ===== HANDLER CHỨNG CHỈ =====
  const handleAddCertificateClick = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    setEditingCert(null);
    setCertForm({
      name: "",
      provider: "",
      issue_date: `${y}-${m}-${d}`,
      expiry_date: "",
      note: "",
    });
    setShowCertForm(true);
  };

  const handleEditCertificateClick = (cert: Certificate) => {
    setEditingCert(cert);
    setCertForm({
      name: cert.name,
      provider: cert.provider,
      issue_date: cert.issue_date || "",
      expiry_date: cert.expiry_date || "",
      note: cert.note || "",
    });
    setShowCertForm(true);
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manv) return;

    try {
      const payload = {
        name: certForm.name,
        provider: certForm.provider,
        issue_date: certForm.issue_date,
        expiry_date: certForm.expiry_date || null,
        note: certForm.note,
      };

      let res: Response;
      if (editingCert) {
        res = await fetch(`${API_BASE}/api/certificates/${editingCert.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/api/employees/${manv}/certificates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error("Không lưu được chứng chỉ.");
      }

      const saved: Certificate = await res.json();

      setCertificates((prev) => {
        if (editingCert) {
          return prev
            .map((c) => (c.id === saved.id ? saved : c))
            .sort((a, b) => (a.issue_date < b.issue_date ? 1 : -1));
        }
        return [saved, ...prev].sort((a, b) =>
          a.issue_date < b.issue_date ? 1 : -1
        );
      });

      setShowCertForm(false);
      setEditingCert(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không lưu được chứng chỉ.");
    }
  };

  const handleDeleteCertificate = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa chứng chỉ này?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/certificates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không xóa được chứng chỉ.");
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Không xóa được chứng chỉ.");
    }
  };

  const handleToggleViewCertificate = (id: number) => {
    setExpandedCertId((prev) => (prev === id ? null : id));
  };

  // ===== TÍNH TOÁN BỔ SUNG =====
  if (loading) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-sm">Đang tải thông tin nhân viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-red-500 mb-2">Có lỗi xảy ra</h2>
        <p className="text-gray-600 text-sm mb-4">{error}</p>
        <Link
          to="/employees"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-red-500">Không tìm thấy nhân viên</h2>
        <Link
          to="/employees"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  const deptName =
    departments.find((d) => d.MaPB === employee.MaPB)?.TenPB || "Chưa cập nhật";
  const posName =
    POSITIONS.find((p) => p.MaCV === employee.MaCV)?.TenCV ||
    (employee.MaCV ? employee.MaCV : "Chưa cập nhật");

  const hireDateStr = employee.HIRE_DATE || employee.NgayVaoLam || "";
  const hireYear = hireDateStr ? parseInt(hireDateStr.substring(0, 4)) : NaN;
  const yearsOfService = isNaN(hireYear)
    ? 0
    : new Date().getFullYear() - hireYear;
  const isDueForReview = yearsOfService >= 3 && yearsOfService % 3 === 0;

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Sơ yếu lý lịch", icon: <UserIcon /> },
    { id: "contracts", label: "Hợp đồng & Công tác", icon: <FileText size={18} /> },
    { id: "education", label: "Trình độ & Đào tạo", icon: <BookOpen size={18} /> },
    { id: "salary", label: "Lương & Thưởng", icon: <Award size={18} /> },
  ];

  const avatarUrl =
    resolveAvatarUrl(employee.AvatarUrl) ||
    "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(`${employee.HONV} ${employee.TENNV}`) +
      "&background=random";

  const luongCbDisplay =
    employee.LuongCoBan != null
      ? `${employee.LuongCoBan.toLocaleString("vi-VN")} VNĐ`
      : "Chưa cập nhật";
  const phuCapDisplay =
    employee.PhuCapChucVu != null
      ? `${employee.PhuCapChucVu.toLocaleString("vi-VN")} VNĐ`
      : "Chưa cập nhật";

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <Link
        to="/employees"
        className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" />
        Quay lại danh sách
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div className="px-6 pb-6">
          <div className="relative flex items-end -mt-12 mb-6">
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-xl border-4 border-white shadow-md object-cover bg-white"
            />
            <div className="ml-6 mb-1 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.HONV} {employee.TENNV}
              </h1>
              <div className="flex items-center text-gray-600 mt-1">
                <Briefcase size={16} className="mr-1" />
                <span>{posName}</span>
                <span className="mx-2">•</span>
                <span>{deptName}</span>
              </div>
            </div>
            <div className="mb-2">
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  employee.Status === "Đang làm việc"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {employee.Status || "Chưa cập nhật"}
              </span>
            </div>
          </div>

          {/* Quick Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-6">
            <div className="flex items-center text-sm text-gray-600">
              <Phone size={18} className="mr-3 text-gray-400" />
              {employee.DienThoai || "-"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={18} className="mr-3 text-gray-400" />
              {employee.Email || "-"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={18} className="mr-3 text-gray-400" />
              {employee.DiaChi || "-"}
            </div>
          </div>
        </div>
      </div>

      {isDueForReview && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-md flex items-start">
          <AlertCircle className="text-yellow-600 mr-3 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Đến hạn xét duyệt lương
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Nhân viên này đã làm việc đủ 3 năm. Vui lòng kiểm tra và đề xuất
              xét nâng bậc lương theo quy định.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-blue-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* PROFILE */}
          {activeTab === "profile" && (
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Thông tin cá nhân
              </h3>
              <dl>
                <InfoRow label="Mã nhân viên" value={employee.MANV} />
                <InfoRow
                  label="Họ và tên"
                  value={`${employee.HONV} ${employee.TENNV}`}
                />
                <InfoRow
                  label="Ngày sinh"
                  value={formatDate(employee.NgaySinh)}
                />
                <InfoRow label="Nơi sinh" value={employee.NoiSinh} />
                <InfoRow label="Giới tính" value={employee.GioiTinh} />
                <InfoRow label="Dân tộc" value={employee.DanToc} />
                <InfoRow label="Tôn giáo" value={employee.TonGiao} />
                <InfoRow label="Quốc tịch" value={employee.QuocTich} />
                <InfoRow label="Số CMND/CCCD" value={employee.CMND} />
                <InfoRow label="Hộ khẩu" value={employee.HoKhau} />
              </dl>
            </div>
          )}

          {/* CONTRACTS & EVENTS */}
          {activeTab === "contracts" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Hợp đồng & Quá trình công tác
                </h3>
                <button
                  onClick={handleAddEventClick}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  + Thêm diễn biến
                </button>
              </div>

              {/* Thông tin hợp đồng hiện tại */}
              <dl className="mb-6">
                <InfoRow
                  label="Loại hợp đồng"
                  value={employee.LoaiHopDong || "Chưa cập nhật"}
                />
                <InfoRow
                  label="Ngày vào làm"
                  value={hireDateStr ? formatDate(hireDateStr) : "-"}
                />
                <InfoRow label="Phòng ban" value={deptName} />
                <InfoRow label="Chức vụ" value={posName} />
              </dl>

              {/* Form thêm / sửa diễn biến */}
              {showEventForm && (
                <form
                  onSubmit={handleSaveEvent}
                  className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    {editingEvent ? "Sửa diễn biến" : "Thêm diễn biến mới"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ngày
                      </label>
                      <input
                        type="date"
                        value={eventForm.date}
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            date: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tiêu đề diễn biến
                      </label>
                      <input
                        type="text"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        placeholder="Ví dụ: Bổ nhiệm Trưởng phòng"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Nội dung / ghi chú
                    </label>
                    <textarea
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Nhập nội dung quyết định, ghi chú chi tiết..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEventForm(false);
                        setEditingEvent(null);
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {editingEvent ? "Lưu thay đổi" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline diễn biến */}
              <div className="relative pl-6 border-l-2 border-gray-200 space-y-6">
                {eventsLoading && (
                  <p className="text-sm text-gray-500">
                    Đang tải diễn biến công tác...
                  </p>
                )}
                {eventsError && (
                  <p className="text-sm text-red-500">{eventsError}</p>
                )}
                {!eventsLoading && !eventsError && events.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Chưa có diễn biến công tác nào.
                  </p>
                )}

                {events.map((ev) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-[31px] bg-blue-500 h-4 w-4 rounded-full border-2 border-white"></div>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          {ev.title}
                        </h4>
                        <time className="block text-xs text-gray-500 mb-1">
                          {formatDate(ev.date)}
                        </time>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {ev.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEventClick(ev)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EDUCATION & CERTIFICATES */}
          {activeTab === "education" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Trình độ học vấn
              </h3>
              <dl className="mb-8">
                <InfoRow
                  label="Trình độ văn hóa"
                  value={employee.TrinhDoVanHoa}
                />
                <InfoRow
                  label="Chuyên môn"
                  value={employee.TrinhDoChuyenMon}
                />
                
              </dl>

              <h3 className="text-lg font-medium text-gray-900 mb-4 flex justify-between items-center">
                <span>Chứng chỉ & Đào tạo</span>
                <button
                  type="button"
                  onClick={handleAddCertificateClick}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  + Thêm chứng chỉ
                </button>
              </h3>

              {/* Form chứng chỉ */}
              {showCertForm && (
                <form
                  onSubmit={handleSaveCertificate}
                  className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    {editingCert ? "Sửa chứng chỉ" : "Thêm chứng chỉ mới"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tên chứng chỉ / khóa học
                      </label>
                      <input
                        type="text"
                        value={certForm.name}
                        onChange={(e) =>
                          setCertForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Đơn vị cấp
                      </label>
                      <input
                        type="text"
                        value={certForm.provider}
                        onChange={(e) =>
                          setCertForm((prev) => ({
                            ...prev,
                            provider: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ngày cấp
                      </label>
                      <input
                        type="date"
                        value={certForm.issue_date}
                        onChange={(e) =>
                          setCertForm((prev) => ({
                            ...prev,
                            issue_date: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ngày hết hạn (nếu có)
                      </label>
                      <input
                        type="date"
                        value={certForm.expiry_date}
                        onChange={(e) =>
                          setCertForm((prev) => ({
                            ...prev,
                            expiry_date: e.target.value,
                          }))
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      value={certForm.note}
                      onChange={(e) =>
                        setCertForm((prev) => ({
                          ...prev,
                          note: e.target.value,
                        }))
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm"
                      rows={3}
                      placeholder="Nhập nội dung tóm tắt chương trình đào tạo, điểm nổi bật..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCertForm(false);
                        setEditingCert(null);
                      }}
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                      {editingCert ? "Lưu thay đổi" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              )}

              {/* Danh sách chứng chỉ */}
              <div className="border border-gray-200 rounded-md divide-y divide-gray-200">
                {certLoading && (
                  <p className="text-sm text-gray-500 px-4 py-3">
                    Đang tải danh sách chứng chỉ...
                  </p>
                )}
                {certError && (
                  <p className="text-sm text-red-500 px-4 py-3">{certError}</p>
                )}
                {!certLoading &&
                  !certError &&
                  certificates.length === 0 && (
                    <p className="text-sm text-gray-500 px-4 py-3">
                      Chưa có chứng chỉ nào được cập nhật.
                    </p>
                  )}

                {certificates.map((cert) => (
                  <div key={cert.id}>
                    <div className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                      <div className="w-0 flex-1 flex items-center">
                        <BookOpen className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <div className="ml-2 flex-1 w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 truncate">
                              {cert.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {cert.provider} • Cấp ngày{" "}
                            {formatDate(cert.issue_date)}{" "}
                            {cert.expiry_date &&
                              `• Hết hạn ${formatDate(cert.expiry_date)}`}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleViewCertificate(cert.id)
                          }
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {expandedCertId === cert.id ? "Ẩn" : "Xem"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditCertificateClick(cert)}
                          className="text-xs text-amber-600 hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCertificate(cert.id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    {expandedCertId === cert.id && (
                      <div className="px-6 pb-4 text-xs text-gray-700 bg-gray-50">
                        {cert.note ? (
                          <p className="whitespace-pre-line">{cert.note}</p>
                        ) : (
                          <p className="italic text-gray-400">
                            Chưa có ghi chú chi tiết cho chứng chỉ này.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SALARY */}
          {activeTab === "salary" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin lương hiện tại
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Lương cơ bản</p>
                  <p className="text-xl font-bold text-gray-900">
                    {luongCbDisplay}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Phụ cấp chức vụ</p>
                  <p className="text-xl font-bold text-gray-900">
                    {phuCapDisplay}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Lịch sử điều chỉnh lương
                </h4>

                {salaryHistoryLoading && (
                  <p className="text-sm text-gray-500">Đang tải lịch sử lương...</p>
                )}

                {salaryHistoryError && (
                  <p className="text-sm text-red-500">{salaryHistoryError}</p>
                )}

                {!salaryHistoryLoading &&
                  !salaryHistoryError &&
                  salaryHistory.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Chưa có lần điều chỉnh lương nào được ghi nhận.
                    </p>
                  )}

                {salaryHistory.length > 0 && (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Ngày hiệu lực
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Lương cũ
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Phụ cấp cũ
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Lương mới
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Phụ cấp mới
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {salaryHistory.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2 text-sm text-gray-500">
                            {formatDate(row.effective_date)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {row.old_basic_salary != null
                              ? row.old_basic_salary.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {row.old_allowance != null
                              ? row.old_allowance.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {row.new_basic_salary != null
                              ? row.new_basic_salary.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right">
                            {row.new_allowance != null
                              ? row.new_allowance.toLocaleString("vi-VN")
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 max-w-xs">
                            {row.note || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
