import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  CreditCard, 
  CalendarClock, 
  Settings as SettingsIcon, 
  Menu, 
  X,
  Building2,
  LogOut,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import Payroll from './components/Payroll';
import Attendance from './components/Attendance';
import EmployeeDetail from './components/EmployeeDetail';
import DepartmentList from './components/DepartmentList';
import Settings from './components/Settings';
import InsuranceTax from './components/InsuranceTax';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const location = useLocation();
  const navItems = [
    { label: 'Tổng quan', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Nhân viên', path: '/employees', icon: <Users size={20} /> },
    { label: 'Lương & Thưởng', path: '/payroll', icon: <CreditCard size={20} /> },
    { label: 'Chấm công', path: '/attendance', icon: <CalendarClock size={20} /> },
    { label: 'Bảo hiểm & Thuế', path: '/insurance-tax', icon: <ShieldCheck size={20} /> },
    { label: 'Phòng ban', path: '/departments', icon: <Building2 size={20} /> },
    { label: 'Hệ thống', path: '/settings', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static border-r border-slate-700
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800 border-b border-slate-700">
          <span className="text-xl font-bold tracking-wider uppercase">Hoàng Vĩnh Phát</span>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-300 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-700">
          <button className="flex items-center space-x-3 px-4 py-2 w-full text-left text-slate-300 hover:text-red-400 transition-colors">
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
};

const Header = ({ 
  onMenuClick, 
  isDark, 
  toggleTheme 
}: { 
  onMenuClick: () => void, 
  isDark: boolean, 
  toggleTheme: () => void 
}) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6 justify-between sticky top-0 z-10 border-b border-gray-200 dark:border-slate-700 transition-colors">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden">
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">
          Hệ Thống Quản Lý Nhân Sự
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Admin User</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Quản trị viên</div>
        </div>
        <img 
          src="https://picsum.photos/40/40" 
          alt="Avatar" 
          className="h-10 w-10 rounded-full border-2 border-gray-100 dark:border-gray-600"
        />
      </div>
    </header>
  );
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <Router>
      <div className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors`}>
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} isDark={isDark} toggleTheme={toggleTheme} />
          
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/employees" element={<EmployeeList />} />
              <Route path="/employees/:id" element={<EmployeeDetail />} />
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/departments" element={<DepartmentList />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/insurance-tax" element={<InsuranceTax />} />
              <Route path="*" element={
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-gray-400">Đang phát triển...</h2>
                  <p className="text-gray-500 mt-2">Tính năng này sẽ sớm được cập nhật.</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}