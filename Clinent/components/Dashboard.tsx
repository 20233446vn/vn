import React, { useEffect, useState } from "react";
import { Users, DollarSign, Briefcase, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_BASE = "http://localhost:3001";

interface DeptSummary {
  department: string;
  count: number;
}

interface SalaryRanges {
  under10m: number;
  from10to20m: number;
  over20m: number;
}

interface DashboardSummary {
  totalEmployees: number;
  totalSalary: number;
  avgSalary: number;
  newEmployees: number;
  departments: DeptSummary[];
  salaryRanges: SalaryRanges;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtext,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
}) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 flex items-start justify-between border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
        {title}
      </p>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </h3>
      {subtext && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {subtext}
        </p>
      )}
    </div>
    <div className={`p-3 rounded-lg ${color} text-white`}>{icon}</div>
  </div>
);

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/dashboard/summary`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error(err);
        setError("Không tải được dữ liệu tổng quan.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const totalEmployees = summary?.totalEmployees ?? 0;
  const totalSalary = summary?.totalSalary ?? 0;
  const avgSalary = summary?.avgSalary ?? 0;
  const newHires = summary?.newEmployees ?? 0;

  const deptData =
    summary?.departments?.map((d) => ({
      name: d.department || "Chưa phân phòng",
      count: d.count,
    })) ?? [];

  const salaryRangesArray = summary
    ? [
        { name: "< 10M", value: summary.salaryRanges.under10m },
        { name: "10M - 20M", value: summary.salaryRanges.from10to20m },
        { name: "> 20M", value: summary.salaryRanges.over20m },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tổng quan
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Chào mừng trở lại, đây là tình hình nhân sự hôm nay.
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đang tải dữ liệu tổng quan...
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng nhân viên"
          value={totalEmployees}
          icon={<Users size={24} />}
          color="bg-blue-500"
          subtext="Chỉ tiêu tối đa 50"
        />
        <StatCard
          title="Tổng quỹ lương (Tháng hiện tại)"
          value={`${(totalSalary / 1_000_000).toFixed(1)} Triệu`}
          icon={<DollarSign size={24} />}
          color="bg-emerald-500"
          subtext="Dữ liệu từ bảng payroll"
        />
        <StatCard
          title="Lương trung bình"
          value={`${(avgSalary / 1_000_000).toFixed(1)} Triệu`}
          icon={<TrendingUp size={24} />}
          color="bg-orange-500"
          subtext="Net salary trung bình"
        />
        <StatCard
          title="Nhân sự mới trong năm"
          value={newHires}
          icon={<Briefcase size={24} />}
          color="bg-purple-500"
          subtext="Dựa trên Ngày vào làm"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Nhân sự theo phòng ban
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={deptData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "#6b7280" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Phân bổ mức lương (Net)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salaryRangesArray}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {salaryRangesArray.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-4 mt-4 text-sm">
              {salaryRangesArray.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  ></span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
