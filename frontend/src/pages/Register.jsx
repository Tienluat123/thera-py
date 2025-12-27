import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;
      setMessage(
        "Đăng ký thành công, vui lòng kiểm tra email xác nhận (nếu có)."
      );
      // Optional: auto-login
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      // Save access token for API calls
      const token = data?.session?.access_token;
      if (token) localStorage.setItem('auth_token', token);
      navigate("/chat");
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      {/* Sidebar bên trái */}
      <aside className="w-64 border-r border-gray-100 flex flex-col justify-between p-10 z-10 bg-white/50 backdrop-blur-md shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
            Thera.py
          </h1>
         
        </div>
        
      </aside>

      {/* Main content area */}
      <main className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 via-blue-100 to-purple-50 overflow-hidden p-4">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute bottom-[-5%] right-[10%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[120px]" />
        </div>

        {/* Form container */}
        <div className="z-10 w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Title */}
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                Đăng ký
              </h2>
              <p className="text-gray-600 text-sm">
                Tạo tài khoản để bắt đầu trò chuyện
              </p>
            </div>

            {/* Success message */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {message}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu (tối thiểu 6 ký tự)
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-gray-500 text-sm">hoặc</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Login link */}
            <p className="text-center text-gray-700">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-purple-500 font-semibold hover:text-purple-600 underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

