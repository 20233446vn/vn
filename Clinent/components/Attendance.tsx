import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:3001";

// ----- Kiểu dữ liệu từ API -----
interface RawAttendance {
  id: number;
  employee_id: number;
  date: string; // "2025-05-21" hoặc ISO "2025-05-20T17:00:00.000Z"
  status: string;
  MANV: string;
  TENNV: string;
  HONV?: string;

  // Thêm: giờ vào / ra từ DB
  checkInTime?: string | null;
  checkOutTime?: string | null;
}

type NormalizedStatus = "Đúng giờ" | "Đi muộn" | "Vắng";

interface DailyRecord {
  day: number;
  status: NormalizedStatus | null;
  id?: number;
  dateStr?: string;
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

interface DailyEmployeeRow {
  MANV: string;
  TENNV: string;
  HONV?: string;
  status: NormalizedStatus | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  workMinutes?: number | null;
}

const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface WeekDayInfo {
  label: string;
  dateLabel: string;
  dateStr: string;
  dayOfMonth: number;
  valid: boolean;
}

/* ============= XỬ LÝ NGÀY (TRÁNH LỆCH MÚI GIỜ) ============= */
function toLocalYMD(input: string | null | undefined): string {
  if (!input) return "";

  if (input.length >= 10 && input[4] === "-" && input[7] === "-") {
    return input.slice(0, 10);
  }

  const d = new Date(input);
  if (Number.isNaN(d.getTime())) {
    return input.slice(0, 10);
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalYM(input: string | null | undefined): string {
  const ymd = toLocalYMD(input);
  return ymd ? ymd.slice(0, 7) : "";
}

function formatMonthLabel(monthStr: string) {
  if (!monthStr) return "";
  const [y, m] = monthStr.split("-");
  return `${m}/${y}`;
}

function parseMonthInput(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/\s+/g, "");

  const m1 = cleaned.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (m1) {
    const m = Number(m1[1]);
    const y = Number(m1[2]);
    if (m < 1 || m > 12) return null;
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  const m2 = cleaned.match(/^(\d{4})-(\d{1,2})$/);
  if (m2) {
    const y = Number(m2[1]);
    const m = Number(m2[2]);
    if (m < 1 || m > 12) return null;
    return `${y}-${String(m).padStart(2, "0")}`;
  }

  return null;
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// Chuẩn hoá status
function normalizeStatus(raw: string | null | undefined): NormalizedStatus {
  const s = (raw || "").toLowerCase();

  if (s.includes("late") || s.includes("muộn")) return "Đi muộn";
  if (s.includes("absent") || s.includes("off") || s.includes("vắng"))
    return "Vắng";
  return "Đúng giờ";
}

function toHHmm(value: any): string | null {
  if (!value) return null;
  if (typeof value === "string") {
    const m = value.match(/^(\d{2}):(\d{2})/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return null;
}


// Tính số phút làm việc
function diffMinutes(startRaw: any, endRaw: any): number | null {
  const t1 = toHHmm(startRaw);
  const t2 = toHHmm(endRaw);
  if (!t1 || !t2) return null;

  const [h1, m1] = t1.split(":").map(Number);
  const [h2, m2] = t2.split(":").map(Number);
  const diff = h2 * 60 + m2 - (h1 * 60 + m1);
  if (!Number.isFinite(diff) || diff < 0) return null;
  return diff;
}

function formatWorkMinutes(min: number | null | undefined): string {
  if (min == null) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

// Tạo 7 ngày trong một tuần của tháng
function buildWeekDays(monthStr: string, week: number): WeekDayInfo[] {
  if (!monthStr) return [];
  const [yStr, mStr] = monthStr.split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (week - 1) * 7 + 1;

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
    const weekday = d.getDay();

    const dayStr = String(dayOfMonth).padStart(2, "0");
    const dateStr = `${yStr}-${mStr}-${dayStr}`;
    const dateLabel = `${dayStr}/${mStr}`;

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

type ViewMode = "week" | "day";

export default function Attendance() {
  const navigate = useNavigate();

  const [rawData, setRawData] = useState<RawAttendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("week");

  const today = new Date();
  const initialMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  const [month, setMonth] = useState(initialMonth);
  const [monthInput, setMonthInput] = useState(formatMonthLabel(initialMonth));
  const [week, setWeek] = useState<number>(1);

  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`
  );

  const weekDays = useMemo(() => buildWeekDays(month, week), [month, week]);

  useEffect(() => {
    setMonthInput(formatMonthLabel(month));
  }, [month]);

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

  /* ========== THEO TUẦN ========== */

  const attendanceData: EmployeeAttendanceRow[] = useMemo(() => {
    if (!rawData.length || !weekDays.length) return [];

    const dataForMonth = rawData.filter((r) => toLocalYM(r.date) === month);
    if (!dataForMonth.length) return [];

    const byEmployee = new Map<string, RawAttendance[]>();
    dataForMonth.forEach((r) => {
      if (!byEmployee.has(r.MANV)) byEmployee.set(r.MANV, []);
      byEmployee.get(r.MANV)!.push(r);
    });

    const result: EmployeeAttendanceRow[] = [];

    byEmployee.forEach((records) => {
      const sample = records[0];

      const dailyRecords: DailyRecord[] = weekDays.map((wd) => {
        if (!wd.valid) return { day: wd.dayOfMonth, status: null };

        const recordForDay = records.find(
          (r) => toLocalYMD(r.date) === wd.dateStr
        );

        return {
          id: recordForDay?.id,
          day: wd.dayOfMonth,
          status: recordForDay ? normalizeStatus(recordForDay.status) : null,
          dateStr: wd.dateStr,
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

  const periodTotals = attendanceData.reduce(
    (acc, curr) => ({
      worked: acc.worked + curr.summary.totalWorked,
      late: acc.late + curr.summary.totalLate,
      absent: acc.absent + curr.summary.totalAbsent,
    }),
    { worked: 0, late: 0, absent: 0 }
  );

  const validDaysCount = weekDays.filter((w) => w.valid).length || 7;

  const changeMonth = (offset: number) => {
    const [yStr, mStr] = month.split("-");
    const d = new Date(Number(yStr), Number(mStr) - 1, 1);
    d.setMonth(d.getMonth() + offset);
    const newMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    setMonth(newMonth);
    setWeek(1);
  };

  const handleMonthInputBlur = () => {
    const parsed = parseMonthInput(monthInput);
    if (parsed) {
      setMonth(parsed);
      setWeek(1);
    } else {
      setMonthInput(formatMonthLabel(month));
      alert("Vui lòng nhập tháng đúng định dạng MM/YYYY, ví dụ: 11/2025");
    }
  };

  /* ========== THEO NGÀY ========== */

  const dailyRows: DailyEmployeeRow[] = useMemo(() => {
    if (!rawData.length || !selectedDate) return [];

    const dateOnly = selectedDate;
    const recordsForDate = rawData.filter(
      (r) => toLocalYMD(r.date) === dateOnly
    );
    if (!recordsForDate.length) return [];

    const byEmployee = new Map<string, RawAttendance>();
    recordsForDate.forEach((r) => {
      if (!byEmployee.has(r.MANV)) byEmployee.set(r.MANV, r);
    });

    return Array.from(byEmployee.values()).map((r) => {
      const checkInTime = toHHmm(r.checkInTime);
      const checkOutTime = toHHmm(r.checkOutTime);
      const workMinutes = diffMinutes(r.checkInTime, r.checkOutTime);

      return {
        MANV: r.MANV,
        TENNV: r.TENNV,
        HONV: r.HONV,
        status: normalizeStatus(r.status),
        checkInTime,
        checkOutTime,
        workMinutes,
      };
    });
  }, [rawData, selectedDate]);

  const dailyTotals = dailyRows.reduce(
    (acc, curr) => {
      if (curr.status === "Đúng giờ") acc.worked += 1;
      if (curr.status === "Đi muộn") acc.late += 1;
      if (curr.status === "Vắng") acc.absent += 1;
      return acc;
    },
    { worked: 0, late: 0, absent: 0 }
  );

  const subtitle =
    viewMode === "week"
      ? `Theo dõi ngày công tuần ${week} tháng ${formatMonthLabel(month)}`
      : `Theo dõi chấm công theo ngày: ${formatDateLabel(selectedDate)}`;

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100 transition-colors">
      {/* HEADER + BỘ LỌC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chấm công
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Chế độ: tuần / ngày */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Chế độ
            </span>
            <div className="flex rounded-lg bg-gray-100 dark:bg-slate-800 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "week"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-300"
                }`}
              >
                Theo tuần
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "day"
                    ? "bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-gray-100"
                    : "text-gray-500 dark:text-gray-300"
                }`}
              >
                Theo ngày
              </button>
            </div>
          </div>

          {/* Bộ lọc theo tuần */}
          {viewMode === "week" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Tuần
                </span>
                <select
                  value={week}
                  onChange={(e) => setWeek(Number(e.target.value))}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
                >
                  <option value={1}>Tuần 1</option>
                  <option value={2}>Tuần 2</option>
                  <option value={3}>Tuần 3</option>
                  <option value={4}>Tuần 4</option>
                  <option value={5}>Tuần 5</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Tháng
                </span>
                <div className="flex items-center border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    className="px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    ‹
                  </button>

                  <input
                    type="text"
                    value={monthInput}
                    onChange={(e) => setMonthInput(e.target.value)}
                    onBlur={handleMonthInputBlur}
                    placeholder="MM/YYYY"
                    className="px-3 py-2 w-24 text-sm text-center bg-transparent outline-none text-gray-900 dark:text-gray-100"
                  />

                  <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    className="px-2 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                  >
                    ›
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Bộ lọc theo ngày */}
          {viewMode === "day" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Ngày
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>
      </div>

      {/* Trạng thái tải / lỗi */}
      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đang tải dữ liệu...
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          Lỗi dữ liệu: {error}
        </p>
      )}

      {/* SUMMARY SECTION */}
      {viewMode === "week" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Tổng ngày công (Tuần)
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {periodTotals.worked}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                <CheckCircle size={12} className="mr-1" />
                Đạt chỉ tiêu
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600 dark:text-blue-300">
              <BarChart3 size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Tổng đi muộn
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {periodTotals.late}
              </div>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                <Clock size={12} className="mr-1" />
                Cần nhắc nhở
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-xl text-yellow-600 dark:text-yellow-300">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Tổng vắng mặt
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {periodTotals.absent}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                <XCircle size={12} className="mr-1" />
                Không phép / Có phép
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl text-red-600 dark:text-red-300">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Đúng giờ (trong ngày)
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {dailyTotals.worked}
              </div>
            </div>
            <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-xl text-green-600 dark:text-green-300">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Đi muộn (trong ngày)
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {dailyTotals.late}
              </div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded-xl text-yellow-600 dark:text-yellow-300">
              <Clock size={24} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <span className="text-gray-500 dark:text-gray-300 text-sm font-medium">
                Vắng mặt (trong ngày)
              </span>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {dailyTotals.absent}
              </div>
            </div>
            <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl text-red-600 dark:text-red-300">
              <XCircle size={24} />
            </div>
          </div>
        </div>
      )}

      {/* BẢNG CHI TIẾT THEO TUẦN */}
      {viewMode === "week" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chi tiết chấm công (theo tuần)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  {weekDays.map((d, idx) => (
                    <th
                      key={idx}
                      className="px-4 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {d.valid ? (
                        <div className="flex flex-col items-center leading-tight">
                          <span>{d.label}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-300/70">
                            {d.dateLabel}
                          </span>
                        </div>
                      ) : (
                        ""
                      )}
                    </th>
                  ))}
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tổng công
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chỉnh sửa công
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {attendanceData.map((emp) => {
                  const fullName = `${emp.HONV ?? ""} ${emp.TENNV ?? ""}`
                    .trim()
                    .replace(/\s+/g, " ");

                  return (
                    <tr
                      key={emp.MANV}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold text-xs mr-3">
                            {(emp.HONV || "").charAt(0)}
                            {emp.TENNV.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {fullName || emp.TENNV}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.MANV}
                            </div>
                          </div>
                        </div>
                      </td>

                      {emp.dailyRecords.map((record, idx) => {
                        let colorClass =
                          "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-300";
                        let text = "-";

                        if (record.status === "Đúng giờ") {
                          colorClass =
                            "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
                          text = "X";
                        }
                        if (record.status === "Đi muộn") {
                          colorClass =
                            "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300";
                          text = "M";
                        }
                        if (record.status === "Vắng") {
                          colorClass =
                            "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
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
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                          {emp.summary.totalWorked} / {validDaysCount}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/attendance-edit?manv=${encodeURIComponent(
                                emp.MANV
                              )}&month=${month}`
                            )
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
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
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Chưa có dữ liệu chấm công cho tuần này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BẢNG CHI TIẾT THEO NGÀY */}
      {viewMode === "day" && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2">
            <Calendar size={18} className="text-gray-400 dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chi tiết chấm công (theo ngày)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Nhân viên
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Giờ vào
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Giờ ra
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Số giờ làm
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chỉnh sửa công
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {dailyRows.map((emp) => {
                  const fullName = `${emp.HONV ?? ""} ${emp.TENNV ?? ""}`
                    .trim()
                    .replace(/\s+/g, " ");

                  let colorClass =
                    "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-300";
                  let label = "Chưa chấm";

                  if (emp.status === "Đúng giờ") {
                    colorClass =
                      "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300";
                    label = "Đúng giờ";
                  } else if (emp.status === "Đi muộn") {
                    colorClass =
                      "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300";
                    label = "Đi muộn";
                  } else if (emp.status === "Vắng") {
                    colorClass =
                      "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
                    label = "Vắng";
                  }

                  return (
                    <tr
                      key={emp.MANV}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold text-xs mr-3">
                            {(emp.HONV || "").charAt(0)}
                            {emp.TENNV.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {fullName || emp.TENNV}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.MANV}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${colorClass}`}
                        >
                          {label}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {emp.checkInTime || "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {emp.checkOutTime || "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        {formatWorkMinutes(emp.workMinutes)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() =>
                            navigate(
                              `/attendance-edit?manv=${encodeURIComponent(
                                emp.MANV
                              )}&month=${selectedDate.slice(0, 7)}`
                            )
                          }
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 transition-colors"
                        >
                          Chỉnh sửa công
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && dailyRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      Chưa có dữ liệu chấm công cho ngày này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
