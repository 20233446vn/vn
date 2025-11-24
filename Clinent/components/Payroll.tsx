import React from 'react';
import { Download, Calculator, FileSpreadsheet } from 'lucide-react';
import { SALARY_DATA, EMPLOYEES, POSITIONS } from '../services/mockData';

export default function Payroll() {
  const currentMonth = 5;
  const currentYear = 2024;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getEmployeeName = (id: string) => {
    const emp = EMPLOYEES.find(e => e.MANV === id);
    return emp ? `${emp.HONV} ${emp.TENNV}` : id;
  };

  const getPosition = (id: string) => {
    const emp = EMPLOYEES.find(e => e.MANV === id);
    if(!emp) return '';
    const pos = POSITIONS.find(p => p.MaCV === emp.MaCV);
    return pos ? pos.TenCV : '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng tính lương</h1>
          <p className="text-gray-500">Kỳ lương tháng {currentMonth}/{currentYear}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
            <FileSpreadsheet size={18} />
            <span>Xuất Excel</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
            <Calculator size={18} />
            <span>Tính lương tháng này</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã NV</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Họ Tên</th>
                 <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Chức vụ</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Lương CB</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Công</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Phụ cấp</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Tăng ca (h)</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-red-600 uppercase tracking-wider">BHXH</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-red-600 uppercase tracking-wider">Thuế TNCN</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50">Thực Lĩnh</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {SALARY_DATA.map((record, idx) => (
                <tr key={record.Id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.MaNV}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{getEmployeeName(record.MaNV)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPosition(record.MaNV)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(record.LuongCB)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{record.SoNgayCong}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">+{formatCurrency(record.PhuCap)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{record.TangCa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(record.BHXH)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-{formatCurrency(record.ThueTNCN)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700 text-right bg-blue-50">
                    {formatCurrency(record.ThucLanh)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-semibold text-gray-900">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right">Tổng cộng:</td>
                <td className="px-6 py-4 text-right">{formatCurrency(SALARY_DATA.reduce((a,b) => a + b.LuongCB, 0))}</td>
                <td colSpan={5}></td>
                <td className="px-6 py-4 text-right text-blue-800">{formatCurrency(SALARY_DATA.reduce((a,b) => a + b.ThucLanh, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}