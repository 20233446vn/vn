import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://localhost:3001";

interface PayrollRow {
  id: number;
  MANV?: string;
  HONV?: string;
  TENNV?: string;
  PHONGBAN?: string;        // dùng làm cột "Chức vụ" / "Chức vụ / Phòng ban"
  month: string;            // yyyy-mm-dd trong DB
  gross_salary: number | string;     // có thể là string từ DB
  net_salary: number | string;       // có thể là string từ DB
  bonus: number | string;            // có thể là string từ DB
  work_days?: number | string;       // Công
  overtime_hours?: number | string;  // Tăng ca (h)
}

// Hiển thị "05/2024" từ "2024-05" hoặc "2024-05-01"
const formatMonthLabel = (value: string) => {
  if (!value) return "";
  if (value.length === 7) {
    const [y, m] = value.split("-");
    return `${m}/${y}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}/${y}`;
};

const formatCurrency = (raw: number | string | undefined | null) => {
  const n = Number(raw) || 0;
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " ₫";
};

const Payroll: React.FC = () => {
  const today = new Date();
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gọi API lấy bảng lương theo tháng
  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);

      const monthParam = `${month}-01`;
      const res = await fetch(
        `${API_BASE}/api/payroll?month=${encodeURIComponent(monthParam)}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRows(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được dữ liệu lương.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // Chuẩn hóa + tính BHXH & Thuế TNCN
  const enhancedRows = useMemo(() => {
    return rows.map((r) => {
      const gross = Number(r.gross_salary) || 0;
      const bonus = Number(r.bonus) || 0;
      const net = Number(r.net_salary) || 0;

      const bhxh = Math.round(gross * 0.105);
      let tax = gross + bonus - bhxh - net;
      if (tax < 0) tax = 0;

      return {
        ...r,
        gross_salary: gross,
        bonus,
        net_salary: net,
        bhxh,
        tax,
      } as any;
    });
  }, [rows]);

  // TÍNH TỔNG: ép Number để không dính chuỗi
  const totals = useMemo(
    () =>
      enhancedRows.reduce(
        (acc, r: any) => {
          acc.base += Number(r.gross_salary) || 0;
          acc.bonus += Number(r.bonus) || 0;
          acc.bhxh += Number(r.bhxh) || 0;
          acc.tax += Number(r.tax) || 0;
          acc.net += Number(r.net_salary) || 0;
          return acc;
        },
        { base: 0, bonus: 0, bhxh: 0, tax: 0, net: 0 }
      ),
    [enhancedRows]
  );

  // Xuất CSV
  const handleExport = () => {
    if (!enhancedRows.length) return;

    const header = [
      "MaNV",
      "HoTen",
      "ChucVu",
      "Thang",
      "LuongCB",
      "Cong",
      "PhuCap",
      "TangCaGio",
      "BHXH",
      "ThueTNCN",
      "ThucLinh",
    ];

    const lines = [
      header.join(","),
      ...enhancedRows.map((r: any) => {
        const fullName = `${r.HONV ?? ""} ${r.TENNV ?? ""}`.trim();
        return [
          r.MANV || "",
          fullName,
          r.PHONGBAN || "",
          formatMonthLabel(r.month),
          Number(r.gross_salary) || 0,
          r.work_days ?? "",
          Number(r.bonus) || 0,
          r.overtime_hours ?? "",
          Number(r.bhxh) || 0,
          Number(r.tax) || 0,
          Number(r.net_salary) || 0,
        ]
          .map((x) => `"${String(x).replace(/"/g, '""')}"`)
          .join(",");
      }),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bang-luong-${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Bảng tính lương
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Kỳ lương tháng {formatMonthLabel(month)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Tháng / Năm
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 dark:border-slate-600 text-gray-700 hover:bg-gray-50 dark:bg-slate-900 dark:text-white"
          >
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Bảng lương */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        {loading && (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
            Đang tải dữ liệu lương...
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-500 border-b border-red-100 dark:border-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/70">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-100">
                    Mã NV
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-100">
                    Họ tên
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-100">
                    Chức vụ / Phòng ban
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Lương CB
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Công
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Phụ cấp
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Tăng ca (h)
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    BHXH
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Thuế TNCN
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-100">
                    Thực lĩnh
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {enhancedRows.map((r: any) => {
                  const fullName = `${r.HONV ?? ""} ${r.TENNV ?? ""}`
                    .trim()
                    .replace(/\s+/g, " ");

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/40"
                    >
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                        {r.MANV ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-800 dark:text-gray-100">
                        {fullName || "—"}
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">
                        {r.PHONGBAN ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100">
                        {formatCurrency(r.gross_salary)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">
                        {Number(r.work_days) || 0}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(r.bonus)}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">
                        {Number(r.overtime_hours) || 0}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">
                        -{formatCurrency(r.bhxh)}
                      </td>
                      <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">
                        -{formatCurrency(r.tax)}
                      </td>
                      <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-300">
                        {formatCurrency(r.net_salary)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Dòng tổng cộng */}
              <tfoot>
                <tr className="bg-gray-50 dark:bg-slate-700/70 font-semibold">
                  <td className="px-4 py-3" colSpan={3}>
                    Tổng cộng:
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(totals.base)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200" />
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totals.bonus)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-200" />
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                    -{formatCurrency(totals.bhxh)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400">
                    -{formatCurrency(totals.tax)}
                  </td>
                  <td className="px-4 py-3 text-right text-blue-700 dark:text-blue-300">
                    {formatCurrency(totals.net)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {!enhancedRows.length && (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                Không có dữ liệu lương cho kỳ này.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Payroll;
