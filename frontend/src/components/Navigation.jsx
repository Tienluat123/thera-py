import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <aside className="w-64 border-r border-gray-100 flex flex-col justify-between p-10 z-10 bg-white/50 backdrop-blur-md shrink-0">
      <div>
        <Link to="/">
          <h1
            className="text-2xl font-bold text-gray-800 tracking-tight cursor-pointer hover:text-gray-600 transition-colors"
            style={{ fontFamily: "Playfair Display, Georgia, serif" }}
          >
            Thera.py
          </h1>
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {isAuthenticated ? (
          <>
            <Link
              to="/visualize"
              className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Visualize your mood
            </Link>
            <button
              onClick={handleLogout}
              className="text-left text-red-600 text-sm hover:text-red-800 transition-colors font-medium"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="text-gray-600 text-sm hover:text-gray-800 transition-colors"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </aside>
  );
}
