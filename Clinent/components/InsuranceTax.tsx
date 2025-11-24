import React, { useState } from 'react';
import { ShieldCheck, Receipt, Download, FileText, Info } from 'lucide-react';
import { SALARY_DATA, EMPLOYEES } from '../services/mockData';

export default function InsuranceTax() {
  const [activeTab, setActiveTab] = useState<'insurance' | 'tax'>('insurance');
  const currentMonth = 5;
  const currentYear = 2024;

  const getEmployeeName = (id: string) => {
    const emp = EMPLOYEES.find(e => e.MANV === id);
    return emp ? `${emp.HONV} ${emp.TENNV}` : id;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Calculate totals
  const totalBHXH_Emp = SALARY_DATA.reduce((acc, curr) => acc + curr.BHXH, 0);
  const totalBHXH_Comp = SALARY_DATA.reduce((acc, curr) => acc + (curr.LuongCB * 0.215), 0); // Mock 21.5% company contribution
  const totalTax = SALARY_DATA.reduce((acc, curr) => acc + curr.ThueTNCN, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảo hiểm & Thuế</h1>
          <p className="text-gray-500">Quản lý BHXH và Thuế TNCN tháng {currentMonth}/{currentYear}</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm">
          <Download size={18} />
          <span>Xuất báo cáo</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <ShieldCheck size={24} />
                </div>
                <span className="text-xs font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded-full">Tháng {currentMonth}</span>
            </div>
            <div>
                <span className="text-gray-500 text-sm font-medium">Tổng BHXH (Nhân viên)</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBHXH_Emp)}</div>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <ShieldCheck size={24} />
                </div>
                 <span className="text-xs font-medium bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">Công ty đóng</span>
            </div>
            <div>
                <span className="text-gray-500 text-sm font-medium">Tổng BHXH (Công ty 21.5%)</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalBHXH_Comp)}</div>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <Receipt size={24} />
                </div>
                 <span className="text-xs font-medium bg-red-100 text-red-800 py-1 px-2 rounded-full">Thuế</span>
            </div>
            <div>
                <span className="text-gray-500 text-sm font-medium">Tổng Thuế TNCN</span>
                <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalTax)}</div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'insurance'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ShieldCheck size={18} />
              Bảo hiểm xã hội (BHXH)
            </button>
            <button
              onClick={() => setActiveTab('tax')}
              className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'tax'
                  ? 'border-red-500 text-red-600 bg-red-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Receipt size={18} />
              Thuế thu nhập cá nhân (TNCN)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-0">
          {activeTab === 'insurance' && (
            <div className="overflow-x-auto">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-start gap-3 text-sm text-blue-800">
                    <Info size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Quy định hiện hành:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                            <li>Nhân viên đóng: 8% BHXH + 1.5% BHYT + 1% BHTN = <strong>10.5%</strong></li>
                            <li>Công ty đóng: 17.5% BHXH + 3% BHYT + 1% BHTN = <strong>21.5%</strong></li>
                        </ul>
                    </div>
                </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Lương đóng BH</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">NV Đóng (10.5%)</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CTY Đóng (21.5%)</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng nộp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {SALARY_DATA.map((record) => {
                    const compContrib = record.LuongCB * 0.215;
                    const total = record.BHXH + compContrib;
                    return (
                        <tr key={record.Id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{getEmployeeName(record.MaNV)}</div>
                                <div className="text-xs text-gray-500">{record.MaNV}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(record.LuongCB)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">
                                {formatCurrency(record.BHXH)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 text-right">
                                {formatCurrency(compContrib)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                                {formatCurrency(total)}
                            </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="overflow-x-auto">
                 <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-start gap-3 text-sm text-orange-800">
                    <Info size={18} className="mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Lưu ý về Thuế TNCN:</p>
                        <p className="mt-1">Mức giảm trừ gia cảnh bản thân: <strong>11,000,000 VNĐ/tháng</strong>. Người phụ thuộc: <strong>4,400,000 VNĐ/người/tháng</strong>.</p>
                    </div>
                </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng thu nhập</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Giảm trừ gia cảnh</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thu nhập tính thuế</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thuế phải nộp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {SALARY_DATA.map((record) => {
                    const totalIncome = record.LuongCB + record.PhuCap;
                    const deduction = 11000000; // Mock standard deduction
                    const taxableIncome = Math.max(0, totalIncome - record.BHXH - deduction); // Simplified logic
                    
                    return (
                        <tr key={record.Id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{getEmployeeName(record.MaNV)}</div>
                                <div className="text-xs text-gray-500">{record.MaNV}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                {formatCurrency(totalIncome)}
                            </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                                {formatCurrency(deduction)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(taxableIncome)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 text-right">
                                {formatCurrency(record.ThueTNCN)}
                            </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}