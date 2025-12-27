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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate("/chat");
    } catch (err) {
      setError(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800/70 border border-white/10 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-4">Đăng ký</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full rounded-md bg-slate-900 border border-white/10 px-3 py-2 focus:outline-none focus:border-emerald-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Mật khẩu</label>
            <input
              type="password"
              className="w-full rounded-md bg-slate-900 border border-white/10 px-3 py-2 focus:outline-none focus:border-emerald-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-rose-300 text-sm">{error}</p>}
          {message && <p className="text-emerald-300 text-sm">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-2 font-semibold disabled:opacity-70"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>
        </form>
        <p className="text-sm text-slate-300 mt-4">
          Đã có tài khoản?{" "}
          <Link to="/login" className="text-emerald-300 hover:text-emerald-200">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
