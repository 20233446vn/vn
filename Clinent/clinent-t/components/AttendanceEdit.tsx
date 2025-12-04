import React, { useEffect, useState } from "react";
import { Calendar, ArrowLeft, Save } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

interface RawAttendance {
  id: number;
  employee_id: number;
  date: string;
  status: string;
  MANV: string;
  TENNV: string;
  HONV?: string;
}

type NormalizedStatus = "Đúng giờ" | "Đi muộn" | "Vắng";

interface DayEntry {
  day: number;
  dateStr: string;
  id?: number;
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
  const month = searchParams.get("month") || "";

  const [days, setDays] = useState<DayEntry[]>([]);
  const [employee, setEmployee] = useState<{
    TENNV: string;
    HONV?: string;
    employee_id?: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ================= LOAD DATA =================
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/api/attendance`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const all: RawAttendance[] = await res.json();

        const filtered = all.filter(
          (r) => r.MANV === manv && r.date.slice(0, 7) === month
        );

        if (filtered.length > 0) {
          const sample = filtered[0];
          setEmployee({
            TENNV: sample.TENNV,
            HONV: sample.HONV,
            employee_id: sample.employee_id,
          });
        } else {
          const any = all.find((r) => r.MANV === manv);
          setEmployee({
            TENNV: any?.TENNV || manv,
            HONV: any?.HONV,
            employee_id: any?.employee_id,
          });
        }

        const [yStr, mStr] = month.split("-");
        const year = Number(yStr);
        const monthIndex = Number(mStr) - 1;
        const daysCount = new Date(year, monthIndex + 1, 0).getDate();

        const list: DayEntry[] = [];

        for (let d = 1; d <= daysCount; d++) {
          const dateStr = `${yStr}-${mStr}-${String(d).padStart(2, "0")}`;
          const record = filtered.find((r) => r.date.slice(0, 10) === dateStr);

          list.push({
            day: d,
            dateStr,
            id: record?.id,
            status: record ? normalizeStatus(record.status) : null,
          });
        }

        setDays(list);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (manv && month) {
      load();
    } else {
      setLoading(false);
      setError("Thiếu tham số manv hoặc month trên URL.");
    }
  }, [manv, month]);

  // ================= CLICK CHANGE STATUS =================
  const handleClickDay = (day: DayEntry) => {
    // Không chặn nữa, ngày nào cũng cho phép chỉnh.
    // Nếu chưa có status (null) thì click lần đầu sẽ là "Đúng giờ".
    setDays((prev) =>
      prev.map((d) =>
        d.day === day.day
          ? {
              ...d,
              status: d.status ? nextStatus(d.status) : "Đúng giờ",
            }
          : d
      )
    );
  };

  // ================= SAVE =================
  const handleSave = async () => {
    if (!manv || !month) {
      alert("Thiếu thông tin Mã NV hoặc Tháng.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Gửi chỉ những ngày đã chọn status
      const payload = {
        manv,
        month,
        days: days
          .filter((d) => d.status !== null)
          .map((d) => ({
            date: d.dateStr,
            status: d.status,
          })),
      };

      const res = await fetch(`${API_BASE}/api/attendance/upsert-many`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Lỗi HTTP ${res.status}`);
      }

      alert("Đã lưu chấm công.");
      navigate(-1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const fullName =
    (employee?.HONV ? employee.HONV + " " : "") + (employee?.TENNV || manv);

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100 transition-colors">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Calendar size={20} className="text-blue-500" />
          Chỉnh sửa công – {manv}
        </h1>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg 
                     bg-blue-600 text-white text-sm font-medium 
                     hover:bg-blue-700 dark:bg-indigo-500 
                     dark:hover:bg-indigo-400 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>

      {/* EMPLOYEE CARD */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-4 flex items-center justify-between transition-colors">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-300">
            Nhân viên
          </div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {fullName}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Mã NV: {manv}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-300">Tháng</div>
          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {month}
          </div>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Đang tải dữ liệu...
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700">
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200">
                  Ngày
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-200">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {days.map((d) => {
                let className =
                  "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-slate-600";
                let label = "Chưa chấm";

                if (d.status === "Đúng giờ") {
                  className =
                    "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-800";
                  label = "Đúng giờ";
                }
                if (d.status === "Đi muộn") {
                  className =
                    "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800";
                  label = "Đi muộn";
                }
                if (d.status === "Vắng") {
                  className =
                    "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800";
                  label = "Vắng";
                }

                return (
                  <tr key={d.day}>
                    <td className="px-3 py-2">
                      {String(d.day).padStart(2, "0")}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleClickDay(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${className}`}
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
                    className="px-3 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Không có ngày nào trong tháng.
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
