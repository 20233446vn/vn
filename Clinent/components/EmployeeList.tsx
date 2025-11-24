import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { EMPLOYEES, DEPARTMENTS, POSITIONS } from '../services/mockData';
import { Employee } from '../types';

export default function EmployeeList() {
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.TENNV.toLowerCase().includes(searchTerm.toLowerCase()) || 
        emp.HONV.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.MANV.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = deptFilter === 'ALL' || emp.MaPB === deptFilter;

      return matchesSearch && matchesDept;
    });
  }, [searchTerm, deptFilter, employees]);

  const getDeptName = (id: string) => DEPARTMENTS.find(d => d.MaPB === id)?.TenPB || id;
  const getPosName = (id: string) => POSITIONS.find(p => p.MaCV === id)?.TenCV || id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang làm việc': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Nghỉ thai sản': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Đã nghỉ việc': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const confirmDelete = (emp: Employee) => {
    setSelectedEmp(emp);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedEmp) {
      setEmployees(prev => prev.filter(e => e.MANV !== selectedEmp.MANV));
      setIsDeleteModalOpen(false);
      setSelectedEmp(null);
    }
  };

  const handleEdit = (id: string) => {
     alert("Tính năng sửa nhân viên sẽ mở Form sửa chi tiết (giống form Thêm mới).");
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden relative">
      {/* Header Actions */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-700 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách nhân viên</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý hồ sơ nhân sự của công ty</p>
        </div>
        <Link 
          to="/employees/new" 
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <Plus size={18} className="mr-2" />
          Thêm mới
        </Link>
      </div>

      {/* Filters */}
      <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc mã NV..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500 dark:text-gray-400" />
          <select 
            className="block w-full md:w-48 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">Tất cả phòng ban</option>
            {DEPARTMENTS.map(d => (
              <option key={d.MaPB} value={d.MaPB}>{d.TenPB}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <thead className="bg-gray-50 dark:bg-slate-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nhân viên
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chức vụ / Phòng ban
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Liên hệ
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {filteredEmployees.map((emp) => (
              <tr key={emp.MANV} className="hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full object-cover" src={emp.AvatarUrl} alt="" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{emp.HONV} {emp.TENNV}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{emp.MANV}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{getPosName(emp.MaCV)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{getDeptName(emp.MaPB)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{emp.DienThoai}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{emp.Email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(emp.Status)}`}>
                    {emp.Status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link to={`/employees/${emp.MANV}`} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 dark:bg-slate-700 p-1.5 rounded-md">
                      <Eye size={16} />
                    </Link>
                    <button 
                      onClick={() => handleEdit(emp.MANV)}
                      className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300 bg-orange-50 dark:bg-slate-700 p-1.5 rounded-md"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(emp)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-slate-700 p-1.5 rounded-md"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Footer / Pagination */}
      <div className="bg-white dark:bg-slate-800 px-4 py-3 border-t border-gray-200 dark:border-slate-700 sm:px-6 flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Hiển thị <span className="font-medium">1</span> đến <span className="font-medium">{filteredEmployees.length}</span> của <span className="font-medium">{employees.length}</span> kết quả
        </div>
        <div className="flex gap-2">
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50" disabled>
            Trước
          </button>
          <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50" disabled>
            Sau
          </button>
        </div>
      </div>

       {/* Delete Confirmation Modal */}
       {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Xác nhận xóa nhân viên</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Bạn có chắc chắn muốn xóa nhân viên <span className="font-bold text-gray-800 dark:text-gray-200">"{selectedEmp?.HONV} {selectedEmp?.TENNV}"</span>? 
              <br/>Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}