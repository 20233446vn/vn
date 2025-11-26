import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";

const API_BASE = "http://localhost:3001";

// Kiểu dữ liệu từ API
interface RawAttendance {
  id: number;
  employee_id: number;
  date: string;   // YYYY-MM-DD
  status: string; // "Present" | "Late" | "Absent" | ...
  MANV: string;
  TENNV: string;
  HONV?: string;
}

// Trạng thái hiển thị trong UI
type EditStatus = "" | "present" | "late" | "absent";

interface DayRow {
  date: string;         // YYYY-MM-DD
  dayOfMonth: number;   // 1..31
  weekdayLabel: string; // T2/T3...
  original?: RawAttendance;
  status: EditStatus;
}

const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function toEditStatus(raw?: string | null): EditStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("late") || s.includes("muộn")) return "late";
  if (s.includes("absent") || s.includes("off") || s.includes("vắng")) return "absent";
  if (!s) return "";
  return "present"; // mặc định coi là đi làm
}

function toRawStatus(edit: EditStatus): string | null {
  if (edit === "present") return "Present";
  if (edit === "late") return "Late";
  if (edit === "absent") return "Absent";
  return null;
}

export default function AttendanceEdit() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const manv = searchParams.get("manv") || "";
  const monthParam = searchParams.get("month"); // "YYYY-MM" nếu có

  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [month, setMonth] = useState<string>(monthParam || defaultMonth);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [days, setDays] = useState<DayRow[]>([]);
  const [employeeName, setEmployeeName] = useState<string>("");

  // Tính số ngày trong tháng & tạo skeleton
  const skeletonDays = useMemo(() => {
    const [yStr, mStr] = month.split("-");
    const year = Number(yStr);
    const monthIndex = Number(mStr) - 1; // 0-11
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const arr: DayRow[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, monthIndex, d);
      const weekday = weekdayShort[dateObj.getDay()];
      const dateStr = dateObj.toISOString().slice(0, 10);
      arr.push({
        date: dateStr,
        dayOfMonth: d,
        weekdayLabel: weekday,
        status: "",
      });
    }
    return arr;
  }, [month]);

  // Tải dữ liệu chấm công của nhân viên theo tháng
  useEffect(() => {
    if (!manv) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setDays([]);

        const res = await fetch(
          `${API_BASE}/api/attendance?manv=${encodeURIComponent(
            manv
          )}&month=${encodeURIComponent(month)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawAttendance[] = await res.json();

        // Map date -> record
        const map = new Map<string, RawAttendance>();
        data.forEach((r) => map.set(r.date, r));

        if (data.length > 0) {
          const s = data[0];
          const fullName = `${s.HONV ?? ""} ${s.TENNV ?? ""}`
            .trim()
            .replace(/\s+/g, " ");
          setEmployeeName(fullName || s.TENNV || s.MANV);
        } else {
          setEmployeeName("");
        }

        const merged = skeletonDays.map((d) => {
          const rec = map.get(d.date);
          return {
            ...d,
            original: rec,
            status: toEditStatus(rec?.status),
          };
        });

        setDays(merged);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi tải dữ liệu chấm công.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [manv, month, skeletonDays]);

  const handleStatusChange = (index: number, value: EditStatus) => {
    setDays((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], status: value };
      return clone;
    });
  };

  const handleMonthChange = (value: string) => {
    // "YYYY-MM"
    setMonth(value);
  };

  const handleSave = async () => {
    if (!manv) return;
    try {
      setSaving(true);
      setError(null);

      const payload = {
        manv,
        month,
        days: days.map((d) => ({
          date: d.date,
          status: toRawStatus(d.status), // null nếu xoá công
        })),
      };

      const res = await fetch(`${API_BASE}/api/attendance/upsert-many`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Lưu thất bại (HTTP ${res.status})`);

      alert("Đã lưu chấm công tháng này.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi khi lưu chấm công.");
    } finally {
      setSaving(false);
    }
  };

  if (!manv) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">
          Thiếu mã nhân viên (manv). Hãy mở trang này từ màn Chấm công.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chỉnh sửa công – {manv}
            </h1>
            {employeeName && (
              <p className="text-gray-500 text-sm">Nhân viên: {employeeName}</p>
            )}
            <p className="text-gray-400 text-xs">
              Tháng {month.slice(5, 7)}/{month.slice(0, 4)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tháng</span>
            <input
              type="month"
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Đang lưu..." : "Lưu chấm công"}
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
      {error && (
        <p className="text-sm text-red-600">Lỗi: {error}</p>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100 border border-green-400" />
          <CheckCircle size={10} className="text-green-600" /> Đúng giờ
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-400" />
          <Clock size={10} className="text-yellow-600" /> Đi muộn
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-400" />
          <XCircle size={10} className="text-red-600" /> Vắng
        </span>
      </div>

      {/* Bảng chấm công */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">
            Chấm công chi tiết theo ngày
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">
                  Ngày
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">
                  Thứ
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase text-xs">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {days.map((d, idx) => (
                <tr key={d.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                    {String(d.dayOfMonth).padStart(2, "0")}/
                    {month.slice(5, 7)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {d.weekdayLabel}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={(e) =>
                        handleStatusChange(
                          idx,
                          e.target.value as EditStatus
                        )
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">(Không ghi nhận)</option>
                      <option value="present">Đúng giờ</option>
                      <option value="late">Đi muộn</option>
                      <option value="absent">Vắng</option>
                    </select>
                  </td>
                </tr>
              ))}

              {!loading && days.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                  >
                    Không có ngày nào trong tháng này (dữ liệu lỗi?).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
