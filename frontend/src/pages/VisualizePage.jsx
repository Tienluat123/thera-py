import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MOCK_MESSAGES = [
  // Dữ liệu cho ngày 27/12 (Giống ảnh 2: Tức giận 5, Bình thường 4, Buồn 0, Vui 0)
  { id: '1', emotion: 'Tức giận', created_at: '2025-12-27T08:00:00Z' },
  { id: '2', emotion: 'Tức giận', created_at: '2025-12-27T09:00:00Z' },
  { id: '3', emotion: 'Tức giận', created_at: '2025-12-27T10:00:00Z' },
  { id: '4', emotion: 'Tức giận', created_at: '2025-12-27T11:00:00Z' },
  { id: '5', emotion: 'Tức giận', created_at: '2025-12-27T12:00:00Z' },
  { id: '6', emotion: 'Bình thường', created_at: '2025-12-27T13:00:00Z' },
  { id: '7', emotion: 'Bình thường', created_at: '2025-12-27T14:00:00Z' },
  { id: '8', emotion: 'Bình thường', created_at: '2025-12-27T15:00:00Z' },
  { id: '9', emotion: 'Bình thường', created_at: '2025-12-27T16:00:00Z' },

  // Dữ liệu cho ngày 28/12 (Giống ảnh 1: Tức giận 0, Bình thường 0, Buồn 3, Vui 2)
  { id: '10', emotion: 'Buồn', created_at: '2025-12-28T10:00:00Z' },
  { id: '11', emotion: 'Buồn', created_at: '2025-12-28T11:00:00Z' },
  { id: '12', emotion: 'Buồn', created_at: '2025-12-28T12:00:00Z' },
  { id: '13', emotion: 'Vui', created_at: '2025-12-28T13:00:00Z' },
  { id: '14', emotion: 'Vui', created_at: '2025-12-28T14:00:00Z' },
];

export const VisualizePage = () => {
  const [currentDate, setCurrentDate] = useState('27/12');

  const filteredData = MOCK_MESSAGES.filter(msg => {
  const date = new Date(msg.created_at);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}` === currentDate;
});

  const getEmotionCount = (type) => {
    return filteredData.filter(msg => msg.emotion === type).length;
  };

  const stats = [
    { label: 'Tức giận', count: getEmotionCount('Tức giận'), color: '#D97777' },
    { label: 'Bình thường', count: getEmotionCount('Bình thường'), color: '#C2F3FF' },
    { label: 'Buồn', count: getEmotionCount('Buồn'), color: '#5699E8' },
    { label: 'Vui', count: getEmotionCount('Vui'), color: '#FDE047' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      {/* Sidebar bên trái */}
      <aside className="w-64 border-r border-gray-100 flex flex-col justify-between p-10 z-10 bg-white/50 backdrop-blur-md shrink-0">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>Thera.py</h1>
        <Link to="/visualize" className="text-gray-600 text-lg leading-relaxed hover:underline">Visualize your mood</Link>
      </aside>

      <main className="relative flex-1 flex flex-col items-center bg-white transition-all duration-500 overflow-auto p-8">
        <div className="p-8 max-w-2xl mx-auto font-sans w-full">
          <h2 className="text-xl font-bold mb-12 text-center text-[#1A1C1E]">
            Cùng xem hôm nay tâm trạng bạn thế nào
          </h2>
          
          <div className="text-center font-bold mb-8 text-lg">{currentDate}</div>

          <div className="space-y-8">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-28 text-gray-500 text-sm">{item.label}</div>
                <div className="flex-1 bg-transparent h-10 flex items-center">
                  <div 
                    className="h-6 rounded-sm transition-all duration-700 ease-out" 
                    style={{ 
                      width: `${(item.count / 6) * 100}%`, // Để 6 cho giống tỉ lệ ảnh mẫu
                      backgroundColor: item.color 
                    }}
                  />
                </div>
                <div className="w-4 text-gray-400 text-sm">{item.count}</div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-20">
            <button 
               onClick={() => setCurrentDate('26/12')}
               className="bg-[#E8F5E9] text-[#1A1C1E] px-8 py-3 rounded-md font-bold text-sm"
            >
              {"<< 26/12"}
            </button>
            <button 
               onClick={() => setCurrentDate('28/12')}
               className="bg-[#E8F5E9] text-[#1A1C1E] px-8 py-3 rounded-md font-bold text-sm"
            >
              {"28/12 >>"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

