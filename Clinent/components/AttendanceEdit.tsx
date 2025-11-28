import React, { useEffect, useState } from "react";
import { Calendar, ArrowLeft, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

// Dữ liệu thô từ API /api/attendance
interface RawAttendance {
  id: number;
  employee_id: number;
  date: string;   // "2025-05-01T00:00:00.000Z" hoặc "2025-05-01"
  status: string;
  MANV: string;
  TENNV: string;
  HONV?: string;
}

type NormalizedStatus = "Đúng giờ" | "Đi muộn" | "Vắng";

interface DayEntry {
  day: number;
  dateStr: string;              // "2025-05-01"
  id?: number;                  // id bản ghi attendance (nếu đã có)
  status: NormalizedStatus | null;
}

function normalizeStatus(raw: string | null | undefined): NormalizedStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("muộn") || s.includes("late")) return "Đi muộn";
  if (s.includes("vắng") || s.includes("absent") || s.includes("off"))
    return "Vắng";
  return "Đúng giờ";
}

const statusCycle: NormalizedStatus[] = ["Đúng giờ", "Đi muộn", "Vắng"];

function nextStatus(current: NormalizedStatus): NormalizedStatus {
  const idx = statusCycle.indexOf(current);
  return statusCycle[(idx + 1) % statusCycle.length];
}


const AttendanceEdit: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const manv = searchParams.get("manv") || "";
  const month = searchParams.get("month") || ""; // "YYYY-MM"

  const [days, setDays] = useState<DayEntry[]>([]);
  const [employee, setEmployee] = useState<{
    TENNV: string;
    HONV?: string;
    employee_id?: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ====== LOAD DỮ LIỆU ======
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/attendance`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const all: RawAttendance[] = await res.json();

        // Lọc đúng nhân viên + tháng
        const filtered = all.filter(
          (r) => r.MANV === manv && r.date.slice(0, 7) === month
        );

        // Set thông tin nhân viên
        if (filtered.length > 0) {
          const sample = filtered[0];
          setEmployee({
            TENNV: sample.TENNV,
            HONV: sample.HONV,
            employee_id: sample.employee_id,
          });
        } else {
          // Không có bản ghi tháng này -> cố gắng lấy tên từ tháng khác
          const anyEmp = all.find((r) => r.MANV === manv);
          if (anyEmp) {
            setEmployee({
              TENNV: anyEmp.TENNV,
              HONV: anyEmp.HONV,
              employee_id: anyEmp.employee_id,
            });
          } else {
            // fallback: không tìm thấy -> chỉ biết mã NV
            setEmployee({ TENNV: manv });
          }
        }

        // Build danh sách ngày trong tháng
        if (!month) {
          setDays([]);
          return;
        }
        const [yStr, mStr] = month.split("-");
        const year = Number(yStr);
        const monthIndex = Number(mStr) - 1;
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        const dayEntries: DayEntry[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, "0")}`;

          const rec = filtered.find(
            (r) => r.date.slice(0, 10) === dateStr
          );

          dayEntries.push({
            day: d,
            dateStr,
            id: rec?.id,
            status: rec ? normalizeStatus(rec.status) : null,
          });
        }

        setDays(dayEntries);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi tải dữ liệu chấm công");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [manv, month]);

  // ====== CLICK ĐỔI TRẠNG THÁI ======
  const handleClickDay = (day: DayEntry) => {
  // Nếu ngày này chưa có bản ghi trong DB -> không cho sửa
  if (!day.id) {
    alert("Ngày này chưa có dữ liệu chấm công, không được chỉnh sửa.");
    return;
  }

  // Chỉ xoay trạng thái cho các ngày đã có id
  setDays((prev) =>
    prev.map((d) =>
      d.day === day.day && d.id
        ? { ...d, status: nextStatus(d.status || "Đúng giờ") }
        : d
    )
  );
};


  // ====== LƯU (chỉ hoạt động nếu backend có PUT/POST/DELETE) ======
  const handleSave = async () => {
  if (!employee?.employee_id) {
    alert("Không xác định được mã employee_id của nhân viên.");
    return;
  }

  try {
    setSaving(true);
    setError(null);

    for (const d of days) {
      // Chỉ xử lý những ngày đã có bản ghi (có id)
      if (!d.id || !d.status) continue;

      await fetch(`${API_BASE}/api/attendance/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: d.status }),
      });
    }

    alert("Đã lưu chấm công.");
    navigate(-1);
  } catch (err: any) {
    console.error(err);
    setError("Lưu chấm công thất bại, vui lòng thử lại.");
  } finally {
    setSaving(false);
  }
};


  const fullName =
    (employee?.HONV ? employee.HONV + " " : "") + (employee?.TENNV || "");

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-blue-500" />
          Chỉnh sửa công – {manv}
        </h1>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-70"
        >
          <Save size={18} />
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>

      {/* INFO NV */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Nhân viên</div>
          <div className="text-base font-semibold text-gray-900">
            {fullName || manv}
          </div>
          <div className="text-xs text-gray-400 mt-1">Mã NV: {manv}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Tháng</div>
          <div className="text-base font-semibold text-gray-900">
            {month || "—"}
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Đang tải dữ liệu chấm công...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* BẢNG CÁC NGÀY */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Ngày
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600">
                  Trạng thái (bấm để đổi)
                </th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                let colorClass =
                  "bg-gray-100 text-gray-500 border border-dashed border-gray-300";
                let label = "Chưa chấm";

                if (d.status === "Đúng giờ") {
                  colorClass =
                    "bg-green-100 text-green-700 border border-green-200";
                  label = "Đúng giờ";
                } else if (d.status === "Đi muộn") {
                  colorClass =
                    "bg-yellow-100 text-yellow-700 border border-yellow-200";
                  label = "Đi muộn";
                } else if (d.status === "Vắng") {
                  colorClass =
                    "bg-red-100 text-red-700 border border-red-200";
                  label = "Vắng";
                }

                return (
                  <tr key={d.day} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      {String(d.day).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleClickDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${colorClass}`}
                      >
                        {label}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {days.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-3 py-4 text-center text-gray-500 text-sm"
                  >
                    Không có ngày nào trong tháng (month không hợp lệ hoặc chưa
                    chọn).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendanceEdit;
