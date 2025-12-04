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
import { AuthProvider, useAuth, RoleCode } from "./components/AuthContext";
import AttendanceEdit from "./components/AttendanceEdit";
import MyAttendance from "./components/MyAttendance";
import FaceRegister from "./components/FaceRegister";
import { PrivateRoute } from "./components/PrivateRoute";
// ================= SIDEBAR =================
// thêm interface nhỏ ở trên Sidebar
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode; 
  roles: string[]; // hoặc RoleCode[] nếu bạn có type này
}

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

  // Thêm allowedRoles cho từng menu để ẩn bớt theo quyền
  const navItems: NavItem[] = [
    {
      label: "Tổng quan",
      path: "/",
      icon: <LayoutDashboard size={20} />,
      roles: ["GD", "AD", "TP", "NV"],
    },
    {
      label: "Nhân viên",
      path: "/employees",
      icon: <Users size={20} />,
      roles: ["GD", "AD", "TP"],
    },
    {
      label: "Lương & Thưởng",
      path: "/payroll",
      icon: <CreditCard size={20} />,
      roles: ["GD", "AD", "TP"],
    },
    {
      label: "Chấm công",
      path: "/attendance",
      icon: <CalendarClock size={20} />,
      roles: ["GD", "AD", "TP", "NV"],
    },
    {
      label: "Công của tôi",
      path: "/my-attendance",
      icon: <CalendarClock size={20} />,
      roles: ["NV"],
    },
    {
      label: "Bảo hiểm & Thuế",
      path: "/insurance-tax",
      icon: <ShieldCheck size={20} />,
      roles: ["GD", "AD", "TP"],
    },
    {
      label: "Phòng ban",
      path: "/departments",
      icon: <Building2 size={20} />,
      roles: ["GD", "AD"],
    },
    {
      label: "Hệ thống",
      path: "/settings",
      icon: <SettingsIcon size={20} />,
      roles: ["GD", "AD", "TP"],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Lọc menu theo quyền đăng nhập
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (!item.roles) return true;
    // roleCode là string → luôn hợp lệ với includes
    return item.roles.includes(user.roleCode || "");
  });

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white/70 dark:bg-slate-900/80 shadow-xl border-r border-blue-100/70 dark:border-slate-700 backdrop-blur-xl transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-200/80 to-cyan-100/60 dark:from-slate-800 dark:to-slate-900 border-b border-blue-100/30 dark:border-slate-700">
          <span className="text-xl font-bold tracking-wider uppercase text-blue-800 dark:text-white drop-shadow-sm">
            Quản lý nhân sự
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-blue-500 dark:text-gray-300 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-xl"
                    : "text-blue-700 hover:bg-blue-100/60 hover:text-blue-900 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-blue-100/50 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-2 w-full text-left text-blue-700 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
          {user && (
            <div className="mt-2 text-xs text-blue-800 dark:text-slate-400 px-1">
              Đang đăng nhập:{" "}
              <span className="font-semibold text-blue-900 dark:text-slate-200">
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
    <header className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/90 shadow border-b border-blue-100/60 dark:border-slate-700 h-16 flex items-center px-8 justify-between sticky top-0 z-10 transition-all">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 text-blue-400 hover:text-blue-700 dark:text-gray-400 dark:hover:text-gray-200 md:hidden"
        >
          <Menu size={24} />
        </button>
        <h2
          className="text-lg font-bold text-blue-800 dark:text-white tracking-tight"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Hệ Thống Quản Lý Nhân Sự
        </h2>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:text-blue-200 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="text-right hidden sm:block">
          <div
            className="text-base font-semibold text-blue-800 dark:text-gray-100"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {user?.fullName || "Admin User"}
          </div>
          <div className="text-xs text-blue-500 dark:text-gray-400">
            {user?.roleName || "Quản trị viên"}
          </div>
        </div>
        <img
          src="https://picsum.photos/40/40"
          alt="Avatar"
          className="h-10 w-10 rounded-full border-2 border-blue-200 dark:border-slate-700 shadow"
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
    <div
      className="min-h-screen w-full flex overflow-hidden relative bg-gradient-to-tr from-blue-100 via-cyan-100 to-blue-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-all duration-500"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* Layer hiệu ứng blur phủ nhẹ toàn trang */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[-40px] top-[10vh] w-[180px] h-[180px] bg-cyan-200/25 rounded-full blur-3xl" />
        <div className="absolute left-[-30px] bottom-[10vh] w-[120px] h-[120px] bg-blue-300/20 rounded-full blur-2xl" />
      </div>
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

        <main className="flex-1 overflow-auto p-4 md:p-8 lg:p-12">
          <Routes>
            {/* Trang login KHÔNG cần ProtectedRoute */}
            <Route path="/login" element={<Login />} />

            {/* Các route cần đăng nhập */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP", "NV"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP", "NV"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:manv"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP", "NV"]}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance-edit"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <AttendanceEdit />
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
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insurance-tax"
              element={
                <ProtectedRoute allowRoles={["GD", "AD", "TP"]}>
                  <InsuranceTax />
                </ProtectedRoute>
              }
            />

            {/* Trang báo không đủ quyền */}
            <Route
              path="/no-permission"
              element={
                <div className="text-center py-20">
                  <h2 className="text-2xl font-bold text-red-500 dark:text-red-400">
                    Bạn không có quyền truy cập chức năng này.
                  </h2>
                  <p className="text-gray-600 mt-2 dark:text-gray-400">
                    Vui lòng liên hệ quản trị hệ thống để được cấp quyền phù hợp.
                  </p>
                </div>
              }
            />
            <Route
              path="/my-attendance"
              element={
                <ProtectedRoute allowRoles={["NV"]}>
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/face-register"
              element={
                <PrivateRoute roles={["NV", "AD", "GD", "TP"]}>
                  <FaceRegister />
                </PrivateRoute>
              }
            />
            {/* Fallback */}
            <Route
              path="*"
              element={
                <div className="text-center py-20">
                  <h2
                    className="text-2xl font-bold text-blue-400 dark:text-slate-400"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Đang phát triển...
                  </h2>
                  <p className="text-blue-600/70 mt-2 dark:text-gray-500">
                    Tính năng này sẽ sớm được cập nhật.
                  </p>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      {/* CUSTOM FONT */}
      <style>
        {`
        html, body, #root {
          min-height: 100vh;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          width: 100vw;
        }
        `}
      </style>
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
