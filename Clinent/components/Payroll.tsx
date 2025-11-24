import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:3001";

interface PayrollRow {
  id: number;
  MANV?: string;
  TENNV?: string;
  month: string;
  gross_salary: number;
  net_salary: number;
  bonus: number;
}

const Payroll: React.FC = () => {
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/payroll`);
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
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
        Lương & Thưởng
      </h1>
      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 dark:bg-slate-700">
              <tr>
                <th className="px-4 py-2 text-left">Mã NV</th>
                <th className="px-4 py-2 text-left">Họ tên</th>
                <th className="px-4 py-2 text-left">Tháng</th>
                <th className="px-4 py-2 text-right">Lương gross</th>
                <th className="px-4 py-2 text-right">Thưởng</th>
                <th className="px-4 py-2 text-right">Lương net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-gray-200 dark:border-slate-700">
                  <td className="px-4 py-2">{r.MANV ?? "—"}</td>
                  <td className="px-4 py-2">{r.TENNV ?? "—"}</td>
                  <td className="px-4 py-2">
                    {new Date(r.month).toLocaleDateString("vi-VN", {
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.gross_salary.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.bonus.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.net_salary.toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          Chưa có dữ liệu lương.
        </p>
      )}
    </div>
  );
};

export default Payroll;
