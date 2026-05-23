"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, user, loading: authLoading, isFallback } = useAuth();
  
  // Modes: "login" | "signup"
  const [mode, setMode] = useState<"login" | "signup">("login");
  
  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI States
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Duplicate Check & Toast States
  const [emailChecked, setEmailChecked] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState("");
  const [toast, setToast] = useState<{ message: string; show: boolean; type: "success" | "error" } | null>(null);

  // Trigger Toast Helper
  const triggerToast = (message: string, type: "success" | "error") => {
    setToast({ message, show: true, type });
  };

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Reset check state if email is modified
  useEffect(() => {
    if (email.trim() !== checkedEmail) {
      setEmailChecked(false);
    }
  }, [email, checkedEmail]);

  // Reset status on mode toggle
  useEffect(() => {
    setError("");
    setEmailChecked(false);
    setCheckedEmail("");
  }, [mode]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.isAdmin) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  const checkEmailFallback = (emailToCheck: string) => {
    const usersStr = typeof window !== "undefined" ? localStorage.getItem("turntable_users") || "[]" : "[]";
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch (e) {}
    return users.some(u => u.email.toLowerCase() === emailToCheck.toLowerCase());
  };

  const handleCheckEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      let exists = false;
      if (!isFallback) {
        const res = await fetch("/api/auth/check-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        const data = await res.json();
        if (data.fallback) {
          exists = checkEmailFallback(trimmedEmail);
        } else if (res.ok) {
          exists = data.exists;
        } else {
          throw new Error(data.error || "이메일 중복 확인에 실패했습니다.");
        }
      } else {
        exists = checkEmailFallback(trimmedEmail);
      }

      if (exists) {
        setEmailChecked(false);
        setCheckedEmail("");
        triggerToast("이미 등록된 이메일 주소입니다.", "error");
      } else {
        setEmailChecked(true);
        setCheckedEmail(trimmedEmail);
        triggerToast("사용 가능한 이메일입니다.", "success");
      }
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "이메일 중복 확인 중 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해 주세요.");
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      if (!emailChecked) {
        setLoading(false);
        triggerToast("이메일 중복 확인을 완료해 주세요.", "error");
        return;
      }
      if (!nickname.trim()) {
        setError("닉네임을 입력해 주세요.");
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "login") {
        const res = await login(email.trim(), password);
        if (res.success && res.user) {
          if (res.user.isAdmin) {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          setError(res.error || "로그인에 실패했습니다.");
        }
      } else {
        const res = await signup(email.trim(), password, nickname.trim(), false);
        if (res.success && res.user) {
          if (res.user.isAdmin) {
            router.push("/admin");
          } else {
            router.push("/");
          }
        } else {
          setError(res.error || "회원가입에 실패했습니다.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("요청을 처리하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError("");
    const googleUserMail = `google_user_${Math.floor(Math.random() * 1000)}@gmail.com`;
    const nicknameSeed = "구글사용자_" + Math.floor(Math.random() * 100);
    
    // Simulate social login with dummy passwords
    signup(googleUserMail, "google-oauth-dummy", nicknameSeed, false).then((res) => {
      if (res.success) {
        router.push("/");
      } else {
        login(googleUserMail, "google-oauth-dummy").then((loginRes) => {
          if (loginRes.success) {
            router.push("/");
          } else {
            setError("Google 로그인 중 오류가 발생했습니다.");
          }
        });
      }
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-sm">잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] grid grid-cols-1 lg:grid-cols-2 font-sans text-[#3D3434]">
      {/* Left Panel: Form */}
      <div className="flex flex-col justify-between p-8 md:p-12 lg:p-16 min-h-screen">
        {/* Brand/Logo Header */}
        <div 
          className="flex items-center gap-2 cursor-pointer self-start" 
          onClick={() => router.push("/")}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E56B6F] to-[#ff8a8f] flex items-center justify-center text-white font-black text-sm shadow-[0_2px_8px_rgba(229,107,111,0.4)]">
            T
          </div>
          <span className="font-bold text-lg tracking-tight text-[#3D3434] font-sans">턴테이블 매치</span>
        </div>

        {/* Form Container */}
        <div className="max-w-[400px] w-full mx-auto my-auto py-8">
          <h1 className="text-3xl font-extrabold text-[#3D3434] tracking-tight mb-2">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-gray-400 text-sm mb-8 font-medium">
            {mode === "login" ? "Please enter your details" : "Please enter your details to sign up"}
          </p>

          {/* Social login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200/80 hover:bg-gray-50 text-[#3D3434] font-semibold py-3 px-4 rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7l2.78 2.16c1.63-1.5 2.57-3.7 2.57-6.28z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.78-2.16c-.77.52-1.76.83-2.78.83-2.14 0-3.96-1.45-4.61-3.4H1.89v2.2C3.38 16.27 6 18 9 18z"
              />
              <path
                fill="#FBBC05"
                d="M4.39 11.09c-.17-.52-.27-1.07-.27-1.64s.1-1.12.27-1.64V5.6H1.89C1.31 6.77 1 8.1 1 9.5s.31 2.73.89 3.9l2.5-1.91-1-1.4z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.8 11.43 0 9 0 6 0 3.38 1.73 1.89 4.7l2.5 1.91c.65-1.95 2.47-3.4 4.61-3.4z"
              />
            </svg>
            <span>{mode === "login" ? "Sign in with Google" : "Sign in with Google"}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-200/80"></div>
            <span className="mx-4 text-xs font-semibold text-gray-400 tracking-wider">or</span>
            <div className="flex-grow border-t border-gray-200/80"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-500 rounded-xl px-4 py-3 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Email address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow bg-[#FDFBF7] border border-gray-200/90 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
                  required
                />
                {mode === "signup" && (
                  <button
                    type="button"
                    onClick={handleCheckEmail}
                    className={`shrink-0 px-4 py-3 text-xs font-bold rounded-xl border transition-all duration-200 ${
                      emailChecked
                        ? "bg-[#2A9D8F]/10 text-[#2A9D8F] border-[#2A9D8F]/30"
                        : "bg-white text-[#3D3434] border-gray-200/95 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                    }`}
                  >
                    {emailChecked ? "확인 완료" : "중복 확인"}
                  </button>
                )}
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Nickname
                </label>
                <input
                  type="text"
                  placeholder="Your Nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-gray-200/90 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-gray-200/90 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
                required
              />
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between text-xs font-medium pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-gray-500">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-[#E56B6F] focus:ring-[#E56B6F] h-4 w-4 cursor-pointer"
                  />
                  <span>Remember for 30 days</span>
                </label>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert("비밀번호 찾기 기능은 준비 중입니다."); }} 
                  className="text-sky-600 hover:text-sky-700 transition-colors font-semibold"
                >
                  Forgot password
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                if (mode === "signup" && !emailChecked) {
                  e.preventDefault();
                  triggerToast("이메일 중복 확인을 완료해 주세요.", "error");
                }
              }}
              className={`w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer mt-4 ${
                mode === "signup" && !emailChecked
                  ? "bg-gray-400 opacity-60 cursor-not-allowed"
                  : "bg-black hover:bg-neutral-900"
              }`}
            >
              {loading ? "Processing..." : mode === "login" ? "Sign in" : "Sign up"}
            </button>
          </form>

          {/* Toggle login/signup mode */}
          <div className="text-center mt-6 text-sm font-medium text-gray-500">
            <span>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            </span>{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="text-sky-600 hover:text-sky-700 font-bold bg-transparent border-none cursor-pointer hover:underline transition-colors"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>

        {/* Footer text */}
        <div className="text-xs text-gray-400 self-center mt-auto font-medium">
          © 2026 Turntable Match. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Portrait Visual */}
      <div className="hidden lg:block relative h-screen overflow-hidden">
        {/* Background Image */}
        <img
          src="/images/login_hero.png"
          alt="Turntable Match login theme"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        
        {/* Text Overlay */}
        <div className="absolute bottom-16 left-16 right-16 z-10 text-white">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight font-sans" style={{ color: '#ffffff' }}>
            인연을 돌리는 시간,<br />턴테이블 매치
          </h2>
          <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-lg font-normal">
            철저한 신원 인증 기반, 직장인 프리미엄 로테이션 미팅. 단 2시간의 진중하고 대화 깊이 있는 만남을 지금 시작하세요.
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast?.show && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 flex items-center gap-3 animate-slide-in-right">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-500" 
              : "bg-rose-50 text-rose-500"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div className="flex-grow pr-2">
            <p className="text-sm font-semibold text-gray-800 leading-tight">
              {toast.message}
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setToast(null)} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
