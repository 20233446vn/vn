import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AuthUser } from "./AuthContext";

const API_BASE = "http://localhost:3001";

type Mode = "login" | "forgot";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ----- STATE CHUNG -----
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);        // cho login
  const [forgotLoading, setForgotLoading] = useState(false); // cho quên mật khẩu
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);

  // ----- STATE ĐĂNG NHẬP -----
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ----- STATE QUÊN MẬT KHẨU -----
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

  // ==================== ĐĂNG NHẬP ====================
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Vui lòng nhập Tên đăng nhập và Mật khẩu.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        let msg = "Đăng nhập thất bại.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        setError(msg);
        return;
      }

      const data = await res.json();
      const user: AuthUser = data.user;
      const token: string = data.token;

      login(user, token);

      if (user.roleCode === "GD" || user.roleCode === "AD") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/my-attendance", { replace: true });
      }
    } catch (err) {
      console.error(err);
      setError("Không kết nối được tới server. Vui lòng kiểm tra backend/CSDL.");
    } finally {
      setLoading(false);
    }
  };

  // ==================== QUÊN MẬT KHẨU ====================
  const handleSubmitForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(null);

    if (!forgotEmail || !forgotPhone || !forgotNewPassword || !forgotConfirmPassword) {
      setError("Vui lòng nhập đầy đủ Email, SĐT và mật khẩu mới.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          phone: forgotPhone,
          newPassword: forgotNewPassword,
        }),
      });

      if (!res.ok) {
        let msg = "Đổi mật khẩu thất bại.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        setError(msg);
        return;
      }

      setForgotSuccess("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      // clear form & quay lại đăng nhập
      setTimeout(() => {
        setMode("login");
        setForgotEmail("");
        setForgotPhone("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
        setForgotSuccess(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      setError("Không kết nối được tới server. Vui lòng thử lại sau.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl px-8 py-10">
        {/* Icon + title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
            <span className="text-blue-600 text-2xl">🛡️</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            Quản lý nhân sự và lương
          </h1>
          {mode === "login" ? (
            <p className="text-sm text-slate-500 mt-1">
              Đăng nhập hệ thống quản lý nhân sự & lương
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">
              Quên mật khẩu – nhập thông tin để đổi mật khẩu
            </p>
          )}
        </div>

        {/* Thông báo lỗi / thành công */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}
        {forgotSuccess && (
          <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">
            {forgotSuccess}
          </div>
        )}

        {/* ----- FORM ĐĂNG NHẬP ----- */}
        {mode === "login" && (
          <form onSubmit={handleSubmitLogin} className="space-y-4">
            {/* Tên đăng nhập */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 10a4 4 0 100-8 4 4 0 000 8z" />
                    <path
                      fillRule="evenodd"
                      d="M2 16a6 6 0 1112 0H2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 8V6a5 5 0 1110 0v2h1a1 1 0 011 1v8a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1h1zm2-2a3 3 0 116 0v2H7V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="block w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {/* icon con mắt – bấm được */}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    // Eye-off
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12A18.45 18.45 0 0 1 5.06 7.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.51 18.51 0 0 1-2.16 3.19" />
                      <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Eye
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Chỉ còn "Quên mật khẩu?" */}
            <div className="flex items-center justify-end text-xs mt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError(null);
                  setForgotSuccess(null);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 shadow-sm transition disabled:opacity-60"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        )}

        {/* ----- FORM QUÊN MẬT KHẨU ----- */}
        {mode === "forgot" && (
          <form onSubmit={handleSubmitForgot} className="space-y-4">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Nhập email đã đăng ký"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* SĐT */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                placeholder="Nhập số điện thoại đã đăng ký"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Mật khẩu mới
              </label>
              <input
                type="password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Nút đổi mật khẩu + quay lại đăng nhập */}
            <div className="flex flex-col gap-2 mt-2">
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 shadow-sm transition disabled:opacity-60"
              >
                {forgotLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setForgotSuccess(null);
                }}
                className="w-full rounded-lg border border-slate-300 text-slate-700 text-sm font-medium py-2.5 hover:bg-slate-50 transition"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <span>Cần hỗ trợ? Liên hệ </span>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            IT Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
