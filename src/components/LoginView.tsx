import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, Sparkles, ShieldCheck, Cross } from 'lucide-react';
import { loginWithUsername } from '../services/firebase';

interface LoginViewProps {
  onLoginSuccess: (user: { username: string; displayName?: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('cantus_saved_username') || '';
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (rememberMe) {
        localStorage.setItem('cantus_saved_username', username.trim());
      } else {
        localStorage.removeItem('cantus_saved_username');
      }
      const user = await loginWithUsername(username, password, rememberMe);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('[Login] Authentication error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/operation-not-allowed' || msg.includes('PASSWORD_LOGIN_DISABLED')) {
        setErrorMsg('Dự án Firebase chưa bật tính năng Email/Password. Vui lòng vào Firebase Console -> Authentication -> Sign-in method -> Bật "Email/Password".');
      } else if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/invalid-email'
      ) {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else if (code === 'auth/too-many-requests') {
        setErrorMsg('Đăng nhập thất bại quá nhiều lần. Vui lòng thử lại sau ít phút.');
      } else {
        setErrorMsg(msg || 'Không thể kết nối tới dịch vụ xác thực Firebase.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100/90 flex flex-col justify-center items-center p-4 antialiased font-sans selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Decorative Sacred Header Card */}
      <div className="w-full max-w-md bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden p-6 sm:p-10 space-y-6 sm:space-y-8 relative">
        
        {/* Subtle Background Accent Pattern */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-50 rounded-full blur-2xl pointer-events-none" />

        {/* Brand & Logo Section */}
        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-700 text-amber-400 shadow-md ring-4 ring-amber-400/20 mb-1">
            <Cross className="w-8 h-8 text-amber-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-serif">
            CANTUS
          </h1>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Sổ Tay Thánh Ca & Quản Lý Ca Đoàn
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-center gap-2 animate-shake">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
              Tên đăng nhập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 bg-stone-50/50 text-slate-900 text-sm font-medium transition-all outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Mật khẩu
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 bg-stone-50/50 text-slate-900 text-sm font-medium transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-0.5">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-indigo-700 border-stone-300 rounded focus:ring-indigo-600 focus:ring-offset-0 cursor-pointer accent-indigo-700"
              />
              <span className="text-xs sm:text-sm font-semibold text-stone-700">
                Ghi nhớ đăng nhập
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-800 to-indigo-700 hover:from-indigo-900 hover:to-indigo-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Đăng Nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-4 border-t border-stone-100 text-center space-y-1 relative z-10">
          <p className="text-[11px] text-stone-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hệ thống bảo mật nội bộ Ca đoàn</span>
          </p>
        </div>

      </div>

      {/* App Version Tag */}
      <div className="mt-6 text-center text-xs font-semibold text-stone-600">
        Cantus – Sổ Tay Thánh Ca Việt Nam
      </div>

    </div>
  );
};
