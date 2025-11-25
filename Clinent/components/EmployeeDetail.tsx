import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
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
  SoCMND?: string | null;
  HIRE_DATE?: string | null;
  NgayVaoLam?: string | null;
  TrinhDoVanHoa?: string | null;
  TrinhDoChuyenMon?: string | null;
}

interface Department {
  MaPB: string;
  TenPB: string;
}

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) => (
  <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-gray-100 last:border-0">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
      {value || "-"}
    </dd>
  </div>
);

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

export default function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"profile" | "contracts" | "education" | "salary">("profile");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gọi API lấy chi tiết nhân viên & phòng ban
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const [empRes, deptRes] = await Promise.all([
          fetch(`${API_BASE}/api/employees/${id}`),
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
  }, [id]);

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
  const isDueForReview =
    yearsOfService >= 3 && yearsOfService % 3 === 0;

  const tabs = [
    { id: "profile", label: "Sơ yếu lý lịch", icon: <UserIcon /> },
    { id: "contracts", label: "Hợp đồng & Công tác", icon: <FileText size={18} /> },
    { id: "education", label: "Trình độ & Đào tạo", icon: <BookOpen size={18} /> },
    { id: "salary", label: "Lương & Thưởng", icon: <Award size={18} /> },
  ] as const;

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
              src={
                employee.AvatarUrl ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(`${employee.HONV} ${employee.TENNV}`) +
                  "&background=random"
              }
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
                onClick={() =>
                  setActiveTab(tab.id as typeof activeTab)
                }
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
                <InfoRow label="Nơi sinh" value={employee.NoiSinh || "-"} />
                <InfoRow label="Giới tính" value={employee.GioiTinh || "-"} />
                <InfoRow label="Dân tộc" value={employee.DanToc || "-"} />
                <InfoRow label="Tôn giáo" value={employee.TonGiao || "-"} />
                <InfoRow label="Số CMND/CCCD" value={employee.SoCMND || "-"} />
                <InfoRow label="Hộ khẩu" value={employee.DiaChi || "-"} />
              </dl>
            </div>
          )}

          {activeTab === "contracts" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Quá trình công tác
                </h3>
                <button className="text-sm text-blue-600 font-medium hover:underline">
                  + Thêm diễn biến
                </button>
              </div>

              {/* Timeline (mock) */}
              <div className="relative pl-6 border-l-2 border-gray-200 space-y-8">
                <div className="relative">
                  <div className="absolute -left-[31px] bg-green-500 h-4 w-4 rounded-full border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Bổ nhiệm: {posName}
                  </h4>
                  <time className="block text-xs text-gray-500 mb-1">
                    01/01/2023 - Hiện tại
                  </time>
                  <p className="text-sm text-gray-600">
                    Quyết định số 123/QĐ-HVP về việc bổ nhiệm cán bộ.
                  </p>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] bg-gray-300 h-4 w-4 rounded-full border-2 border-white"></div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Tuyển dụng chính thức
                  </h4>
                  <time className="block text-xs text-gray-500 mb-1">
                    {formatDate(hireDateStr)}
                  </time>
                  <p className="text-sm text-gray-600">
                    Ký hợp đồng lao động không xác định thời hạn.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "education" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Trình độ học vấn
              </h3>
              <dl className="mb-8">
                <InfoRow
                  label="Trình độ văn hóa"
                  value={employee.TrinhDoVanHoa || "-"}
                />
                <InfoRow
                  label="Chuyên môn"
                  value={employee.TrinhDoChuyenMon || "-"}
                />
                <InfoRow label="Ngoại ngữ" value="Tiếng Anh (B1)" />
              </dl>

              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Chứng chỉ & Đào tạo
              </h3>
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                  <div className="w-0 flex-1 flex items-center">
                    <BookOpen className="flex-shrink-0 h-5 w-5 text-gray-400" />
                    <span className="ml-2 flex-1 w-0 truncate">
                      Chứng chỉ Quản lý sản xuất - 2022
                    </span>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Xem
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          )}

          {activeTab === "salary" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Thông tin lương hiện tại
              </h3>
              {/* Phần này vẫn đang mock vì backend chưa có API chi tiết lương theo từng nhân viên */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Lương cơ bản</p>
                  <p className="text-xl font-bold text-gray-900">
                    {15000000..toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Phụ cấp chức vụ</p>
                  <p className="text-xl font-bold text-gray-900">
                    {3000000..toLocaleString("vi-VN")} VNĐ
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Lịch sử điều chỉnh lương
                </h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Ngày
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Nội dung
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                        Mức mới
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        01/01/2023
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        Nâng lương định kỳ
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        18,000,000
                      </td>
                    </tr>
                  </tbody>
                </table>
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
