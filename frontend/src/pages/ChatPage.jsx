import React, { useState, useRef, useEffect } from "react";
import { ChatBox, Controls, Navigation } from "../components";
import {
  useAudioRecorder,
  useSpeechRecognition,
  useSpeechSynthesis,
} from "../hooks";
import { chat } from "../api";
import { supabase } from "../lib/supabaseClient";
import { EMOTION_CONFIG } from "../config";
import { Link } from "react-router-dom";

export function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [micError, setMicError] = useState("");

  const messagesEndRef = useRef(null);
  const audioRecorder = useAudioRecorder();
  const speechRecognition = useSpeechRecognition();
  const speechSynthesis = useSpeechSynthesis();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStartRecording = async () => {
    try {
      setMicError("");
      speechRecognition.reset();
      await audioRecorder.startRecording();
      speechRecognition.start();
    } catch (error) {
      setMicError(error.message);
    }
  };

  const handleStopRecording = () => {
    speechRecognition.stop();
    const blob = audioRecorder.stopRecording();
    if (blob) setAudioBlob(blob);
  };
  const handleSend = async (providedBlob = null) => {
    let currentBlob = providedBlob || audioBlob;
    if (audioRecorder.isRecording) {
      speechRecognition.stop();
      currentBlob = audioRecorder.stopRecording();
      await new Promise((res) => setTimeout(res, 300));
    }

    const finalText = speechRecognition.getFinalTranscript()?.trim() || "";
    if (!finalText || !currentBlob) {
      setMicError("Vui lòng ghi âm trước khi gửi.");
      return;
    }

    setIsProcessing(true);
    setMicError("");

    try {
      // get token from localStorage or supabase session
      let token = localStorage.getItem("auth_token");
      if (!token) {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token || null;
      }

      const chatResult = await chat(currentBlob, finalText, token);
      const timestamp = new Date().toLocaleTimeString("vi-VN");

      setCurrentEmotion(chatResult.emotion);

      const userMessage = {
        id: Date.now(),
        type: "user",
        text: chatResult.user_text,
        emotion: chatResult.emotion,
        timestamp,
      };
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        text: chatResult.reply_text,
        timestamp,
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
      speechSynthesis.speak(chatResult.reply_text);
      setAudioBlob(null);
      speechRecognition.reset();
    } catch (error) {
      setMicError("Lỗi kết nối: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = async () => {
    try {
      if (!audioRecorder.isRecording) {
        await handleStartRecording();
        return;
      }

      // If recording, stop and immediately send
      speechRecognition.stop();
      const blob = audioRecorder.stopRecording();
      if (!blob) {
        setMicError("Vui lòng ghi âm trước khi gửi.");
        return;
      }
      setAudioBlob(blob);
      await new Promise((res) => setTimeout(res, 300));
      await handleSend(blob);
    } catch (err) {
      console.error('Toggle recording error:', err);
      setMicError(err.message || 'Lỗi khi ghi âm');
    }
  };

  const emotionGradient =
    currentEmotion && EMOTION_CONFIG[currentEmotion]?.gradient
      ? EMOTION_CONFIG[currentEmotion].gradient
      : "from-blue-100 via-purple-100 to-blue-50";

  // ... (giữ nguyên phần logic phía trên)

  return (
    <div className="flex h-screen w-full bg-[#fdfcfd] overflow-hidden">
      <Navigation />

      {/* Vùng nội dung chính */}
      <main
        className={`relative flex-1 flex flex-col items-center bg-gradient-to-br ${emotionGradient} transition-all duration-500 overflow-hidden`}
      >
        {/* Layer đốm màu loang - Giữ nguyên */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/20 blur-[100px]" />
          <div className="absolute bottom-[-5%] left-[20%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[120px]" />
        </div>

        {/* CONTAINER CHÍNH: Dùng flex-col h-full để quản lý không gian */}
        <div className="z-10 w-full h-full max-w-3xl flex flex-col px-6 py-8">
          {/* VÙNG CHAT: Đây là phần sẽ Scroll được */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide flex flex-col">
            {messages.length === 0 && !audioRecorder.isRecording ? (
              <div className="m-auto">
                {" "}
                {/* m-auto để căn giữa khi trống */}
                <p className="text-3xl text-gray-700 text-center leading-relaxed">
                  Chào buổi sáng, hôm nay bạn thế nào?
                </p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* 1. Nội dung ChatBox */}
                <ChatBox
                  messages={messages}
                  isRecording={audioRecorder.isRecording}
                  variant="minimal"
                />

                {/* 2. Hiệu ứng đang nghe (Transcript) hiển thị cuối danh sách */}
                {audioRecorder.isRecording && (
                  <div className="self-center animate-pulse mt-4">
                    <div className="bg-white/40 rounded-2xl px-6 py-3 border border-white/50 backdrop-blur-sm">
                      <p className="text-gray-600 italic">
                        {speechRecognition.transcript || "Đang nghe..."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Điểm neo để auto-scroll */}
                <div ref={messagesEndRef} className="h-4 w-full flex-none" />
              </div>
            )}
          </div>

          {/* VÙNG ĐIỀU KHIỂN: Cố định ở dưới cùng */}
          <div className="flex-none pt-6 bg-transparent">
            <div className="flex flex-col items-center justify-center">
              <Controls
                isRecording={audioRecorder.isRecording}
                isProcessing={isProcessing}
                onToggleRecording={handleToggleRecording}
                variant="float"
              />
              {micError && (
                <p className="text-red-500 text-xs mt-2">{micError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Emotion Icon cố định góc - Giữ nguyên */}
        {currentEmotion && (
          <div className="absolute top-10 right-10 text-6xl animate-bounce pointer-events-none opacity-50">
            {EMOTION_CONFIG[currentEmotion]?.icon}
          </div>
        )}
      </main>
    </div>
  );
}
