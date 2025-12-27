import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      let token = localStorage.getItem("auth_token");
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || null;
      }
      setIsAuthenticated(!!token);
      if (token) {
        try {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user || null);
        } catch (err) {
          console.error('Failed to get supabase user:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage token
      localStorage.removeItem("auth_token");

      // Sign out from Supabase
      await supabase.auth.signOut();

      setIsAuthenticated(false);
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <aside className="w-64 border-r border-gray-100 flex flex-col justify-between p-6 z-10 bg-white/60 backdrop-blur-md shrink-0">
      <div>
        <Link to="/chat" className="flex items-center justify-center gap-3">
      <div className="text-center">
        <h1 
          className="text-2xl font-semibold text-gray-800" 
          style={{ fontFamily: "Playfair Display, Georgia, serif" }}
        >
          Thera.py
        </h1>
      </div>
    </Link>

        <div className="mt-6">
          <div className="bg-white/70 p-3 rounded-xl shadow-sm border border-white/30">
            <Link to="/visualize" className="inline-flex items-center justify-center w-full px-3 py-2 rounded-md bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-600 hover:to-purple-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zM13 21h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              <span className="text-sm">Theo dõi cảm xúc</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-white/30 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium">
              {((user.email || "").charAt(0) || "U").toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{user.email}</div>
              <div className="text-xs text-gray-500">Đã đăng nhập</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link to="/login" className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md border border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-colors">Đăng nhập</Link>
            <Link to="/register" className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">Đăng ký</Link>
          </div>
        )}

        {isAuthenticated ? (
  <div className="mt-3">
    <button 
      onClick={handleLogout} 
      className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md border border-red-200 text-red-600 bg-red-50/30 hover:bg-red-50 hover:border-red-300 transition-all font-medium text-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Đăng xuất
    </button>
  </div>
) : null}
      </div>
    </aside>
  );
}
