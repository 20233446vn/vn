import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

// ----- Kiểu dữ liệu từ API -----
interface RawAttendance {
  id: number;
  employee_id: number;
  date: string; // "2025-05-21"
  status: string;
  MANV: string;
  TENNV: string;
  HONV?: string;
}

type NormalizedStatus = "Đúng giờ" | "Đi muộn" | "Vắng";

interface DailyRecord {
  day: number; // ngày trong tháng
  status: NormalizedStatus | null;
}

interface EmployeeAttendanceRow {
  MANV: string;
  TENNV: string;
  HONV?: string;
  dailyRecords: DailyRecord[];
  summary: {
    totalWorked: number;
    totalLate: number;
    totalAbsent: number;
  };
}

const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface WeekDayInfo {
  label: string;      // T2, T3, ...
  dateLabel: string;  // 01/05
  dateStr: string;    // 2025-05-01
  dayOfMonth: number;
  valid: boolean;
}

// Hiển thị "05/2024"
function formatMonthLabel(monthStr: string) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return `${m}/${y}`;
}

// Chuẩn hoá status
function normalizeStatus(raw: string | null | undefined): NormalizedStatus {
  const s = (raw || "").toLowerCase();

  if (s.includes("late") || s.includes("muộn")) return "Đi muộn";
  if (s.includes("absent") || s.includes("off") || s.includes("vắng"))
    return "Vắng";
  return "Đúng giờ";
}

// Tạo thông tin 7 ngày trong 1 tuần của 1 tháng
// monthStr: "2025-05", week: 1..5
function buildWeekDays(monthStr: string, week: number): WeekDayInfo[] {
  if (!monthStr) return [];
  const [yStr, mStr] = monthStr.split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1; // 0-11

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (week - 1) * 7 + 1; // tuần 1: 1–7, tuần 2: 8–14...

  const result: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const dayOfMonth = startDay + i;
    if (dayOfMonth > daysInMonth) {
      result.push({
        label: "",
        dateLabel: "",
        dateStr: "",
        dayOfMonth,
        valid: false,
      });
      continue;
    }

    const d = new Date(year, monthIndex, dayOfMonth);
    const weekday = d.getDay(); // 0=CN,1=Mon...

    const dateStr = d.toISOString().slice(0, 10); // 2025-05-01
    const dateLabel = `${String(dayOfMonth).padStart(2, "0")}/${mStr}`;

    result.push({
      label: weekdayShort[weekday],
      dateLabel,
      dateStr,
      dayOfMonth,
      valid: true,
    });
  }

  return result;
}

export default function Attendance() {
  const navigate = useNavigate();

  const [rawData, setRawData] = useState<RawAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tháng đang xem (YYYY-MM)
  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  // Tuần đang xem (1..5)
  const [week, setWeek] = useState<number>(1);

  // 7 ngày hiển thị cho tuần + tháng đang chọn
  const weekDays = useMemo(() => buildWeekDays(month, week), [month, week]);

  // Gọi API
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/attendance`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawAttendance[] = await res.json();
        setRawData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi tải dữ liệu chấm công");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, []);

  // Chuyển dữ liệu raw -> dạng bảng cho tuần & tháng đang chọn
  const attendanceData: EmployeeAttendanceRow[] = useMemo(() => {
    if (!rawData.length || !weekDays.length) return [];

    // Lọc theo đúng tháng đang chọn
    const dataForMonth = rawData.filter((r) => r.date.slice(0, 7) === month);
    if (!dataForMonth.length) return [];

    // Map: MANV -> list bản ghi
    const byEmployee = new Map<string, RawAttendance[]>();
    dataForMonth.forEach((r) => {
      if (!byEmployee.has(r.MANV)) byEmployee.set(r.MANV, []);
      byEmployee.get(r.MANV)!.push(r);
    });

    const result: EmployeeAttendanceRow[] = [];

    byEmployee.forEach((records, manv) => {
      const sample = records[0];

      const dailyRecords: DailyRecord[] = weekDays.map((wd) => {
        if (!wd.valid) {
          return { day: wd.dayOfMonth, status: null };
        }

        const recordForDay = records.find((r) => r.date === wd.dateStr);

        return {
          day: wd.dayOfMonth,
          status: recordForDay ? normalizeStatus(recordForDay.status) : null,
        };
      });

      const totalWorked = dailyRecords.filter(
        (r) => r.status === "Đúng giờ" || r.status === "Đi muộn"
      ).length;
      const totalLate = dailyRecords.filter(
        (r) => r.status === "Đi muộn"
      ).length;
      const totalAbsent = dailyRecords.filter(
        (r) => r.status === "Vắng"
      ).length;

      result.push({
        MANV: sample.MANV,
        TENNV: sample.TENNV,
        HONV: sample.HONV,
        dailyRecords,
        summary: { totalWorked, totalLate, totalAbsent },
      });
    });

    return result;
  }, [rawData, weekDays, month]);

  // Tổng toàn kỳ (tuần đang xem)
  const periodTotals = attendanceData.reduce(
    (acc, curr) => ({
      worked: acc.worked + curr.summary.totalWorked,
      late: acc.late + curr.summary.totalLate,
      absent: acc.absent + curr.summary.totalAbsent,
    }),
    { worked: 0, late: 0, absent: 0 }
  );

  const validDaysCount = weekDays.filter((w) => w.valid).length || 7;

  // Đổi tháng khi bấm nút
  const changeMonth = (offset: number) => {
    const [yStr, mStr] = month.split("-");
    const d = new Date(Number(yStr), Number(mStr) - 1, 1);
    d.setMonth(d.getMonth() + offset);
    const newMonth = `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
    setMonth(newMonth);
    setWeek(1); // về tuần 1 khi đổi tháng
  };

  // Khi chọn tháng trong input type="month"
  const handleMonthChange = (value: string) => {
    // value dạng "YYYY-MM"
    setMonth(value);
    setWeek(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
          <p className="text-gray-500">
            Theo dõi ngày công tuần {week} tháng {formatMonthLabel(month)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Chọn tháng */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tháng</span>
            <input
              type="month"
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Chọn tuần (1..5) */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Tuần</span>
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
            >
              <option value={1}>Tuần 1</option>
              <option value={2}>Tuần 2</option>
              <option value={3}>Tuần 3</option>
              <option value={4}>Tuần 4</option>
              <option value={5}>Tuần 5</option>
            </select>
          </div>

          <button
            onClick={() => changeMonth(-1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Tháng trước
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Tháng sau
          </button>
        </div>
      </div>

      {/* Trạng thái tải / lỗi */}
      {loading && <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>}
      {error && (
        <p className="text-sm text-red-600">Lỗi dữ liệu: {error}</p>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-gray-500 text-sm font-medium">
              Tổng ngày công (Tuần)
            </span>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {periodTotals.worked}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <CheckCircle size={12} className="mr-1" />
              Đạt chỉ tiêu
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <BarChart3 size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-gray-500 text-sm font-medium">
              Tổng đi muộn
            </span>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {periodTotals.late}
            </div>
            <p className="text-xs text-yellow-600 mt-1 flex items-center">
              <Clock size={12} className="mr-1" />
              Cần nhắc nhở
            </p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-xl text-yellow-600">
            <Clock size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-gray-500 text-sm font-medium">
              Tổng vắng mặt
            </span>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {periodTotals.absent}
            </div>
            <p className="text-xs text-red-600 mt-1 flex items-center">
              <XCircle size={12} className="mr-1" />
              Không phép / Có phép
            </p>
          </div>
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Bảng chi tiết */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            Chi tiết chấm công
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                {weekDays.map((d, idx) => (
                  <th
                    key={idx}
                    className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {d.valid ? (
                      <div className="flex flex-col items-center leading-tight">
                        <span>{d.label}</span>
                        <span className="text-[10px] text-gray-400">
                          {d.dateLabel}
                        </span>
                      </div>
                    ) : (
                      ""
                    )}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tổng công
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Chỉnh sửa công
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((emp) => {
                const fullName = `${emp.HONV ?? ""} ${emp.TENNV ?? ""}`
                  .trim()
                  .replace(/\s+/g, " ");

                return (
                  <tr
                    key={emp.MANV}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                          {(emp.HONV || "").charAt(0)}
                          {emp.TENNV.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {fullName || emp.TENNV}
                          </div>
                          <div className="text-xs text-gray-500">
                            {emp.MANV}
                          </div>
                        </div>
                      </div>
                    </td>

                    {emp.dailyRecords.map((record, idx) => {
                      let colorClass = "bg-gray-100 text-gray-400";
                      let text = "-";

                      if (record.status === "Đúng giờ") {
                        colorClass = "bg-green-100 text-green-700";
                        text = "X";
                      }
                      if (record.status === "Đi muộn") {
                        colorClass = "bg-yellow-100 text-yellow-700";
                        text = "M";
                      }
                      if (record.status === "Vắng") {
                        colorClass = "bg-red-100 text-red-700";
                        text = "V";
                      }

                      return (
                        <td
                          key={idx}
                          className="px-4 py-4 whitespace-nowrap text-center"
                        >
                          <div className="flex justify-center">
                            <span
                              className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colorClass}`}
                              title={record.status || ""}
                            >
                              {text}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {emp.summary.totalWorked} / {validDaysCount}
                      </span>
                    </td>

                    {/* Nút chỉnh sửa lương */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() =>
                          navigate(`/attendance-edit?manv=${encodeURIComponent(emp.MANV)}&month=${month}`)
                        }
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        Chỉnh sửa công
                      </button>
                    </td>

                  </tr>
                );
              })}

              {!loading && attendanceData.length === 0 && (
                <tr>
                  <td
                    colSpan={weekDays.length + 3}
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    Chưa có dữ liệu chấm công cho tuần này.
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
