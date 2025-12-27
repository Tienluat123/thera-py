import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getEmotionStats } from "../api";
import { supabase } from "../lib/supabaseClient";
import { Navigation } from "../components";

const EMOTION_LABELS_VN = {
  happy: "Vui",
  neutral: "Bình thường",
  sad: "Buồn",
  angry: "Tức giận",
};

const EMOTION_COLORS = {
  happy: "#FDE047", // Yellow
  neutral: "#C2F3FF", // Light Blue
  sad: "#5699E8", // Blue
  angry: "#D97777", // Red
};

export const VisualizePage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState({
    happy: 0,
    neutral: 0,
    sad: 0,
    angry: 0,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch emotion stats for current date
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get token from localStorage or Supabase session
        let token = localStorage.getItem("auth_token");
        if (!token) {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token || null;
        }

        if (!token) {
          // Not authenticated — show empty stats and a notice
          setIsAuthenticated(false);
          setStats({ happy: 0, neutral: 0, sad: 0, angry: 0 });
          setLoading(false);
          return;
        }
        setIsAuthenticated(true);

        // Format date as YYYY-MM-DD
        const dateStr = currentDate.toISOString().split("T")[0];

        // Fetch emotion stats
        const data = await getEmotionStats(dateStr, token);
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch emotion stats:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        // Use default empty stats on error
        setStats({ happy: 0, neutral: 0, sad: 0, angry: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentDate]);

  // Navigate to previous day
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  // Navigate to next day
  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Format date for display
  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Calculate max count for chart scaling
  const maxCount = Math.max(...Object.values(stats), 1);

  // Prepare chart data
  const chartData = [
    {
      key: "angry",
      label: EMOTION_LABELS_VN.angry,
      count: stats.angry,
      color: EMOTION_COLORS.angry,
    },
    {
      key: "neutral",
      label: EMOTION_LABELS_VN.neutral,
      count: stats.neutral,
      color: EMOTION_COLORS.neutral,
    },
    {
      key: "sad",
      label: EMOTION_LABELS_VN.sad,
      count: stats.sad,
      color: EMOTION_COLORS.sad,
    },
    {
      key: "happy",
      label: EMOTION_LABELS_VN.happy,
      count: stats.happy,
      color: EMOTION_COLORS.happy,
    },
  ];

  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      <Navigation />

      <main className="relative flex-1 flex flex-col items-center bg-white transition-all duration-500 overflow-auto p-8">
        <div className="p-8 max-w-3xl mx-auto font-sans w-full">
          <h2 className="text-xl font-bold mb-12 text-center text-[#1A1C1E]">
            Cùng xem hôm nay tâm trạng bạn thế nào
          </h2>

          {/* Date Display */}
          <div className="text-center font-bold mb-8 text-lg text-gray-700">
            {formatDate(currentDate)}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Not authenticated notice */}
          {!isAuthenticated && !loading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-center">
              Bạn chưa đăng nhập —{" "}
              <Link to="/login" className="underline font-semibold">
                Đăng nhập
              </Link>{" "}
              để xem thống kê thực tế.
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin">⏳</div>
              <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Bar Chart */}
          {!loading && (
            <div className="space-y-6 mb-12">
              {chartData.map((item) => {
                const percentage =
                  maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.key} className="flex items-center gap-4">
                    {/* Label */}
                    <div className="w-28 text-gray-600 text-sm font-medium flex-shrink-0">
                      {item.label}
                    </div>

                    {/* Bar Container */}
                    <div className="flex-1 bg-gray-100 h-10 rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-center"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      >
                        {item.count > 0 && (
                          <span className="text-xs font-semibold text-gray-700">
                            {item.count}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Count Display */}
                    <div className="w-8 text-right text-gray-700 font-semibold flex-shrink-0">
                      {item.count}
                    </div>
                  </div>
                );
              })}

              {/* Total Messages Count */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600">
                  Tổng cộng:{" "}
                  <span className="font-bold text-lg text-gray-800">
                    {stats.happy + stats.neutral + stats.sad + stats.angry}
                  </span>{" "}
                  tin nhắn
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between gap-4 mt-12">
            <button
              onClick={handlePreviousDay}
              className="bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1A1C1E] px-6 py-3 rounded-md font-bold text-sm transition-colors duration-200"
            >
              {"← Hôm trước"}
            </button>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="bg-gray-200 hover:bg-gray-300 text-[#1A1C1E] px-6 py-3 rounded-md font-bold text-sm transition-colors duration-200"
            >
              {"Hôm nay"}
            </button>

            <button
              onClick={handleNextDay}
              className="bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1A1C1E] px-6 py-3 rounded-md font-bold text-sm transition-colors duration-200"
            >
              {"Hôm sau →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
