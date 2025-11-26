import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
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
  Sun,
} from "lucide-react";

import Dashboard from "./components/Dashboard";
import EmployeeList from "./components/EmployeeList";
import Payroll from "./components/Payroll";
import Attendance from "./components/Attendance";
import EmployeeDetail from "./components/EmployeeDetail";
import DepartmentList from "./components/DepartmentList";
import Settings from "./components/Settings";
import InsuranceTax from "./components/InsuranceTax";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./components/AuthContext";

// ================= SIDEBAR =================

const Sidebar = ({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Tổng quan", path: "/", icon: <LayoutDashboard size={20} /> },
    { label: "Nhân viên", path: "/employees", icon: <Users size={20} /> },
    {
      label: "Lương & Thưởng",
      path: "/payroll",
      icon: <CreditCard size={20} />,
    },
    {
      label: "Chấm công",
      path: "/attendance",
      icon: <CalendarClock size={20} />,
    },
    {
      label: "Bảo hiểm & Thuế",
      path: "/insurance-tax",
      icon: <ShieldCheck size={20} />,
    },
    {
      label: "Phòng ban",
      path: "/departments",
      icon: <Building2 size={20} />,
    },
    { label: "Hệ thống", path: "/settings", icon: <SettingsIcon size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static border-r border-slate-700`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-slate-800 border-b border-slate-700">
          <span className="text-xl font-bold tracking-wider uppercase">
            Quản lý nhân sự và tiền lương
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-300 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-slate-300 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
          {user && (
            <div className="mt-2 text-xs text-slate-400 px-1">
              Đang đăng nhập:{" "}
              <span className="font-semibold text-slate-200">
                {user.fullName} ({user.roleName})
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

// ================= HEADER =================

const Header = ({
  onMenuClick,
  isDark,
  toggleTheme,
}: {
  onMenuClick: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm h-16 flex items-center px-6 justify-between sticky top-0 z-10 border-b border-gray-200 dark:border-slate-700 transition-colors">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">
          Hệ Thống Quản Lý Nhân Sự
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {user?.fullName || "Admin User"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {user?.roleName || "Quản trị viên"}
          </div>
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

// ================= LAYOUT CHÍNH =================

const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === "/login";

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Ẩn sidebar trên trang login */}
      {!isAuthPage && (
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Ẩn header trên trang login */}
        {!isAuthPage && (
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Routes>
            {/* Trang login KHÔNG cần ProtectedRoute */}
            <Route path="/login" element={<Login />} />

            {/* Các route cần đăng nhập */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "NV"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "NV"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:manv"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "NV"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute allowRoles={["NV"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departments"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <DepartmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance-tax"
              element={
                <ProtectedRoute allowRoles={["GD", "AD"]}>
                  <InsuranceTax />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-gray-400">
                    Đang phát triển...
                  </h2>
                  <p className="text-gray-500 mt-2">
                    Tính năng này sẽ sớm được cập nhật.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// ================= ROOT APP =================

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
};

export default App;
