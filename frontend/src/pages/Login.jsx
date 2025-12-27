import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { Navigation } from "../components";

export function Login() {
  const navigate = useNavigate();

  // Check if already logged in, redirect to chat
  useEffect(() => {
    const checkAuth = async () => {
      // Only redirect if auth_token is in localStorage (user actively logged in)
      const token = localStorage.getItem("auth_token");
      if (token) {
        // Verify token is still valid
        try {
          const { data } = await supabase.auth.getUser(token);
          if (data.user) {
            navigate("/chat");
          }
        } catch {
          // Token invalid, stay on login
          localStorage.removeItem("auth_token");
        }
      }
    };
    checkAuth();
  }, [navigate]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) throw signInError;
      // Save access token for API calls
      const token = data?.session?.access_token;
      if (token) localStorage.setItem("auth_token", token);
      navigate("/chat");
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      <Navigation />

      {/* Main content area */}
      <main className="relative flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-blue-50 overflow-hidden p-4">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[120px]" />
        </div>

        {/* Form container */}
        <div className="z-10 w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
            {/* Title */}
            <div className="mb-8 text-center">
              <h2
                className="text-3xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: "Playfair Display, Georgia, serif" }}
              >
                Đăng nhập
              </h2>
              <p className="text-gray-600 text-sm">
                Đến với Thera.py để bắt đầu hành trình
              </p>
            </div>

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
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {/* Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-3 text-gray-500 text-sm">hoặc</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Sign up link */}
            <p className="text-center text-gray-700">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-500 font-semibold hover:text-blue-600 underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
