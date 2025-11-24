import React from 'react';
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  TrendingUp
} from 'lucide-react';
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
  Cell
} from 'recharts';
import { EMPLOYEES, DEPARTMENTS, SALARY_DATA } from '../services/mockData';

export default function Dashboard() {
  const totalEmployees = EMPLOYEES.length;
  const totalSalary = SALARY_DATA.reduce((acc, curr) => acc + curr.ThucLanh, 0);
  const avgSalary = Math.round(totalSalary / SALARY_DATA.length);
  const newHires = EMPLOYEES.filter(e => e.NgayVaoLam.startsWith('2020') || e.NgayVaoLam.startsWith('2018')).length; // Mock logic

  // Data for Department Distribution
  const deptData = DEPARTMENTS.map(d => {
    return {
      name: d.TenPB,
      count: EMPLOYEES.filter(e => e.MaPB === d.MaPB).length
    };
  });

  // Data for Salary Ranges
  const salaryRanges = [
    { name: '< 10M', value: SALARY_DATA.filter(s => s.ThucLanh < 10000000).length },
    { name: '10M - 20M', value: SALARY_DATA.filter(s => s.ThucLanh >= 10000000 && s.ThucLanh < 20000000).length },
    { name: '> 20M', value: SALARY_DATA.filter(s => s.ThucLanh >= 20000000).length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const StatCard = ({ title, value, icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 flex items-start justify-between border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color} text-white`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan</h1>
          <p className="text-gray-500 dark:text-gray-400">Chào mừng trở lại, đây là tình hình nhân sự hôm nay.</p>
        </div>
        {/* Removed "Thêm nhân viên" button as requested */}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng nhân viên" 
          value={totalEmployees} 
          icon={<Users size={24} />} 
          color="bg-blue-500" 
          subtext="50 chỉ tiêu tối đa"
        />
        <StatCard 
          title="Tổng quỹ lương (Tháng)" 
          value={`${(totalSalary / 1000000).toFixed(1)} Triệu`} 
          icon={<DollarSign size={24} />} 
          color="bg-emerald-500" 
          subtext="Tháng 5/2024"
        />
        <StatCard 
          title="Lương trung bình" 
          value={`${(avgSalary / 1000000).toFixed(1)} Triệu`} 
          icon={<TrendingUp size={24} />} 
          color="bg-orange-500" 
          subtext="+5% so với tháng trước"
        />
        <StatCard 
          title="Nhân sự mới" 
          value={newHires} 
          icon={<Briefcase size={24} />} 
          color="bg-purple-500" 
          subtext="Trong năm nay"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Nhân sự theo phòng ban</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" className="dark:opacity-20" />
                <XAxis type="number" allowDecimals={false} tick={{fill: '#6b7280'}} />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Salary Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Phân bổ mức lương</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salaryRanges}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {salaryRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 text-sm">
              {salaryRanges.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                  <span className="text-gray-600 dark:text-gray-300">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}