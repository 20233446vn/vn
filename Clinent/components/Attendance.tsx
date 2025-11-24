import React, { useMemo } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';
import { EMPLOYEES } from '../services/mockData';

export default function Attendance() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1); // Mock a week (7 days)

  // Generate deterministic mock data for the view
  const attendanceData = useMemo(() => {
    // Seeded random-ish generator to keep data consistent for the session
    return EMPLOYEES.map((emp, index) => {
      const dailyRecords = days.map((day) => {
        // Simple pseudo-random logic based on index and day
        const seed = (index + 1) * day * 13;
        const rand = (Math.sin(seed) + 1) / 2; // Value between 0 and 1
        
        let status: 'Đúng giờ' | 'Đi muộn' | 'Vắng' = 'Đúng giờ';
        if (rand > 0.85) status = 'Vắng';
        else if (rand > 0.70) status = 'Đi muộn';

        return { day, status };
      });

      const totalWorked = dailyRecords.filter(r => r.status === 'Đúng giờ' || r.status === 'Đi muộn').length;
      const totalLate = dailyRecords.filter(r => r.status === 'Đi muộn').length;
      const totalAbsent = dailyRecords.filter(r => r.status === 'Vắng').length;

      return {
        ...emp,
        dailyRecords,
        summary: { totalWorked, totalLate, totalAbsent }
      };
    });
  }, []); // Run once on mount

  // Calculate aggregate totals for the period
  const periodTotals = attendanceData.reduce((acc, curr) => {
    return {
      worked: acc.worked + curr.summary.totalWorked,
      late: acc.late + curr.summary.totalLate,
      absent: acc.absent + curr.summary.totalAbsent
    };
  }, { worked: 0, late: 0, absent: 0 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
          <p className="text-gray-500">Theo dõi ngày công tuần 1 tháng 5/2024</p>
        </div>
        <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Tháng trước</button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Tháng sau</button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <span className="text-gray-500 text-sm font-medium">Tổng ngày công (Tuần)</span>
                <div className="text-3xl font-bold text-gray-900 mt-1">{periodTotals.worked}</div>
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
                <span className="text-gray-500 text-sm font-medium">Tổng đi muộn</span>
                <div className="text-3xl font-bold text-gray-900 mt-1">{periodTotals.late}</div>
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
                <span className="text-gray-500 text-sm font-medium">Tổng vắng mặt</span>
                <div className="text-3xl font-bold text-gray-900 mt-1">{periodTotals.absent}</div>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Chi tiết chấm công</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                        {days.map(d => (
                            <th key={d} className="px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ngày {d}
                            </th>
                        ))}
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng công</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceData.map((emp) => (
                        <tr key={emp.MANV} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                      {emp.HONV.charAt(0)}{emp.TENNV.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{emp.HONV} {emp.TENNV}</div>
                                        <div className="text-xs text-gray-500">{emp.MANV}</div>
                                    </div>
                                </div>
                            </td>
                            {emp.dailyRecords.map((record) => {
                                let colorClass = 'bg-gray-100 text-gray-400';
                                let text = '-';
                                if (record.status === 'Đúng giờ') { colorClass = 'bg-green-100 text-green-700'; text = 'X'; }
                                if (record.status === 'Đi muộn') { colorClass = 'bg-yellow-100 text-yellow-700'; text = 'M'; }
                                if (record.status === 'Vắng') { colorClass = 'bg-red-100 text-red-700'; text = 'V'; }
                                
                                return (
                                    <td key={record.day} className="px-4 py-4 whitespace-nowrap text-center">
                                        <div className="flex justify-center">
                                            <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${colorClass}`} title={record.status}>
                                                {text}
                                            </span>
                                        </div>
                                    </td>
                                )
                            })}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {emp.summary.totalWorked} / 7
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}