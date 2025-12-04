import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, AuthUser } from "./AuthContext";

// Chỉ cập nhật UI, giữ nguyên toàn bộ logic!

const API_BASE = "http://localhost:3001";

type Mode = "login" | "forgot";

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ----- STATE CHUNG -----
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);        
  const [forgotLoading, setForgotLoading] = useState(false); 
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
        } catch {}
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
        } catch {}
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
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-tr from-blue-100 via-cyan-100 to-blue-200 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none [-z-10]">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/90 via-cyan-100/70 to-blue-200/80 backdrop-blur-md" />
        <div className="absolute right-[-80px] top-[15vh] w-[260px] h-[260px] bg-cyan-300/25 rounded-full filter blur-3xl" />
        <div className="absolute left-[-60px] bottom-[10vh] w-[190px] h-[190px] bg-blue-400/15 rounded-full filter blur-2xl" />
      </div>
      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="bg-white/70 backdrop-blur-lg border border-blue-200/50 shadow-2xl rounded-3xl px-8 pt-10 pb-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-400/80 to-cyan-300/70 shadow-lg flex items-center justify-center mb-3 border-2 border-blue-300/40">
              <svg width={32} height={32} fill="none" viewBox="0 0 48 48">
                <rect width="48" height="48" rx="12" fill="#fff" fillOpacity=".6"/>
                <path d="M34 20.5V17A10 10 0 0014 17v3.5M10 21v11a6 6 0 006 6h16a6 6 0 006-6V21" stroke="#2580eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="18" y="28" width="12" height="6" rx="3" fill="#2580eb" fillOpacity=".13"/>
                <circle cx="24" cy="24" r="4" stroke="#2580eb" strokeWidth="2"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-800 mb-1 drop-shadow-sm">
              Quản lý nhân sự & lương
            </h1>
            {mode === "login" ? (
              <p className="text-sm text-blue-700/75 mt-0.5">
                Đăng nhập hệ thống quản lý nhân sự & lương
              </p>
            ) : (
              <p className="text-sm text-blue-700/75 mt-0.5">
                Quên mật khẩu – nhập thông tin để đổi mật khẩu
              </p>
            )}
          </div>
          {/* Thông báo lỗi / thành công */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200/50 bg-red-100/80 text-red-700 text-sm px-4 py-2 shadow animate-shake">
              {error}
            </div>
          )}
          {forgotSuccess && (
            <div className="mb-4 rounded-xl border border-emerald-200/50 bg-emerald-100/90 text-emerald-800 text-sm px-4 py-2 shadow animate-fade-in">
              {forgotSuccess}
            </div>
          )}
          {/* ----- FORM ĐĂNG NHẬP ----- */}
          {mode === "login" && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              {/* Tên đăng nhập */}
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20a8 8 0 0116 0" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập"
                    autoComplete="username"
                    className="block w-full rounded-xl bg-blue-50/60 border border-blue-100 py-2.5 pl-11 pr-3 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                  />
                </div>
              </div>
              {/* Mật khẩu */}
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <rect x="7" y="10" width="10" height="7" rx="3.5" />
                      <path strokeLinecap="round" d="M12 15v-2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V8a4 4 0 018 0v2" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    className="block w-full rounded-xl bg-blue-50/60 border border-blue-100 py-2.5 pl-11 pr-10 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                  />
                  {/* icon con mắt – bấm được */}
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400 hover:text-blue-700 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12A18.45 18.45 0 0 1 5.06 7.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.51 18.51 0 0 1-2.16 3.19" />
                        <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              {/* Quên mật khẩu */}
              <div className="flex items-center justify-end text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError(null);
                    setForgotSuccess(null);
                  }}
                  className="text-cyan-700 hover:text-blue-700 font-semibold transition"
                >
                  Quên mật khẩu?
                </button>
              </div>
              {/* Nút đăng nhập */}
              <button
                type="submit"
                disabled={loading}
                className={
                  "mt-4 w-full rounded-xl bg-gradient-to-r from-blue-400 to-cyan-300 hover:to-blue-400 text-white text-base font-bold py-3 shadow-md shadow-blue-200/60 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-200/60 " +
                  (loading ? "opacity-60 cursor-not-allowed" : "")
                }
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" />
                      <path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8V0C5.82 0 0 5.82 0 13.002h4z" />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </button>
            </form>
          )}
          {/* ----- FORM QUÊN MẬT KHẨU ----- */}
          {mode === "forgot" && (
            <form onSubmit={handleSubmitForgot} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Nhập email đã đăng ký"
                  className="block w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  placeholder="Nhập số điện thoại đã đăng ký"
                  className="block w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="block w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-blue-800 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="block w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-base text-blue-900 placeholder-blue-400 focus:(outline-none ring-2 ring-blue-300/60 bg-white shadow-cyan-100) transition"
                />
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className={
                    "w-full rounded-xl bg-gradient-to-r from-blue-400 to-cyan-300 hover:to-blue-400 text-white text-base font-bold py-3 shadow-md shadow-blue-200/60 transition-all duration-200 outline-none focus:ring-2 focus:ring-blue-200/60 " +
                    (forgotLoading ? "opacity-60 cursor-not-allowed" : "")
                  }
                >
                  {forgotLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" />
                        <path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8V0C5.82 0 0 5.82 0 13.002h4z" />
                      </svg>
                      Đang đổi mật khẩu...
                    </span>
                  ) : (
                    "Đổi mật khẩu"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setForgotSuccess(null);
                  }}
                  className="w-full rounded-xl border border-blue-200 text-blue-700 text-base font-medium py-3 bg-white/60 hover:bg-blue-50/80 shadow transition"
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}
          {/* Footer */}
          <div className="mt-7 text-center text-xs text-blue-700/70">
            <span>Cần hỗ trợ? Liên hệ </span>
            <button
              type="button"
              className="text-cyan-700 hover:text-blue-700 font-semibold underline transition"
              tabIndex={-1}
            >
              IT Support
            </button>
          </div>
        </div>
      </div>
      {/* Custom animations */}
      <style>
        {`
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(.51,.3,0,.98) both;
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(32px);}
          100% { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fadeIn 1s both;
        }
        @keyframes fadeIn {
          0% { opacity: 0;}
          100% { opacity: 1;}
        }
        .animate-shake {
          animation: shake 0.30s;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-2px);}
          20%, 80% { transform: translateX(4px);}
          30%, 50%, 70% { transform: translateX(-8px);}
          40%, 60% { transform: translateX(8px);}
        }
        `}
      </style>
    </div>
  );
};

export default Login;