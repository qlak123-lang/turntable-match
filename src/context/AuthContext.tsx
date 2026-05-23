"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id?: number | string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isFallback: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  signup: (email: string, password: string, nickname: string, isAdmin: boolean) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  updateProfile: (nickname: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  unregister: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  // Load user session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            // DB is not configured, load from localStorage
            setIsFallback(true);
            const localUser = localStorage.getItem("turntable_current_user");
            if (localUser) {
              try {
                setUser(JSON.parse(localUser));
              } catch (e) {
                localStorage.removeItem("turntable_current_user");
              }
            }
          } else if (data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          // If server fails or returns error, default to fallback
          setIsFallback(true);
          const localUser = localStorage.getItem("turntable_current_user");
          if (localUser) {
            setUser(JSON.parse(localUser));
          }
        }
      } catch (err) {
        console.error("Failed to load user, using local storage fallback:", err);
        setIsFallback(true);
        const localUser = localStorage.getItem("turntable_current_user");
        if (localUser) {
          try {
            setUser(JSON.parse(localUser));
          } catch (e) {}
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    // Normal Mode (DB active)
    if (!isFallback) {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        
        const data = await res.json();
        
        if (data.fallback) {
          setIsFallback(true);
          return loginFallback(email, password);
        }

        if (res.ok && !data.error) {
          const loggedUser = {
            id: data.id,
            email: data.email,
            nickname: data.nickname,
            isAdmin: data.isAdmin,
          };
          setUser(loggedUser);
          return { success: true, user: loggedUser };
        } else {
          return { success: false, error: data.error || "로그인에 실패했습니다." };
        }
      } catch (err) {
        console.error("Login API error, switching to fallback:", err);
        setIsFallback(true);
        return loginFallback(email, password);
      }
    } else {
      return loginFallback(email, password);
    }
  };

  const loginFallback = async (email: string, password: string) => {
    const usersStr = localStorage.getItem("turntable_users") || "[]";
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch (e) {}

    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const loggedUser = {
        id: `mock-user-${Date.now()}`,
        email: foundUser.email,
        nickname: foundUser.nickname,
        isAdmin: foundUser.isAdmin,
      };
      localStorage.setItem("turntable_current_user", JSON.stringify(loggedUser));
      setUser(loggedUser);
      return { success: true, user: loggedUser };
    } else {
      return { success: false, error: "이메일 주소 또는 비밀번호가 올바르지 않습니다." };
    }
  };

  const signup = async (email: string, password: string, nickname: string, isAdmin: boolean) => {
    if (!isFallback) {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, nickname, isAdmin }),
        });
        
        const data = await res.json();
        
        if (data.fallback) {
          setIsFallback(true);
          return signupFallback(email, password, nickname, isAdmin);
        }

        if (res.ok && !data.error) {
          const loggedUser = {
            id: data.id,
            email: data.email,
            nickname: data.nickname,
            isAdmin: data.isAdmin,
          };
          setUser(loggedUser);
          return { success: true, user: loggedUser };
        } else {
          return { success: false, error: data.error || "회원가입에 실패했습니다." };
        }
      } catch (err) {
        console.error("Signup API error, switching to fallback:", err);
        setIsFallback(true);
        return signupFallback(email, password, nickname, isAdmin);
      }
    } else {
      return signupFallback(email, password, nickname, isAdmin);
    }
  };

  const signupFallback = async (email: string, password: string, nickname: string, isAdmin: boolean) => {
    const usersStr = localStorage.getItem("turntable_users") || "[]";
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch (e) {}

    const emailExists = users.some(u => u.email === email);
    if (emailExists) {
      return { success: false, error: "이미 등록된 이메일 주소입니다." };
    }

    const newUser = { email, password, nickname, isAdmin };
    users.push(newUser);
    localStorage.setItem("turntable_users", JSON.stringify(users));

    const loggedUser = {
      id: `mock-user-${Date.now()}`,
      email,
      nickname,
      isAdmin,
    };
    localStorage.setItem("turntable_current_user", JSON.stringify(loggedUser));
    setUser(loggedUser);
    return { success: true, user: loggedUser };
  };

  const updateProfile = async (nickname: string) => {
    if (!isFallback) {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname }),
        });
        const data = await res.json();
        
        if (data.fallback) {
          setIsFallback(true);
          return updateProfileFallback(nickname);
        }

        if (res.ok && data.success && data.user) {
          const updatedUser = {
            id: data.user.id,
            email: data.user.email,
            nickname: data.user.nickname,
            isAdmin: data.user.isAdmin,
          };
          setUser(updatedUser);
          return { success: true, user: updatedUser };
        } else {
          return { success: false, error: data.error || "닉네임 수정에 실패했습니다." };
        }
      } catch (err) {
        console.error("Profile update API error, switching to fallback:", err);
        setIsFallback(true);
        return updateProfileFallback(nickname);
      }
    } else {
      return updateProfileFallback(nickname);
    }
  };

  const updateProfileFallback = async (nickname: string) => {
    if (!user) return { success: false, error: "로그인이 필요합니다." };
    
    const usersStr = localStorage.getItem("turntable_users") || "[]";
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch (e) {}

    const updatedUsers = users.map(u => {
      if (u.email.toLowerCase() === user.email.toLowerCase()) {
        return { ...u, nickname };
      }
      return u;
    });
    localStorage.setItem("turntable_users", JSON.stringify(updatedUsers));

    const updatedUser = {
      ...user,
      nickname
    };
    localStorage.setItem("turntable_current_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    return { success: true, user: updatedUser };
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API error:", err);
    }
    
    // Always clear local storage user
    localStorage.removeItem("turntable_current_user");
    setUser(null);
  };

  const unregister = async () => {
    if (!isFallback) {
      try {
        const res = await fetch("/api/auth/profile", {
          method: "DELETE",
        });
        const data = await res.json();

        if (data.fallback) {
          setIsFallback(true);
          return unregisterFallback();
        }

        if (res.ok && data.success) {
          localStorage.removeItem("turntable_current_user");
          setUser(null);
          return { success: true };
        } else {
          return { success: false, error: data.error || "회원 탈퇴에 실패했습니다." };
        }
      } catch (err) {
        console.error("Unregistration API error, switching to fallback:", err);
        setIsFallback(true);
        return unregisterFallback();
      }
    } else {
      return unregisterFallback();
    }
  };

  const unregisterFallback = async () => {
    if (!user) return { success: false, error: "로그인이 필요합니다." };

    const usersStr = localStorage.getItem("turntable_users") || "[]";
    let users: any[] = [];
    try {
      users = JSON.parse(usersStr);
    } catch (e) {}

    // Remove the user from local storage user list
    const updatedUsers = users.filter(u => u.email.toLowerCase() !== user.email.toLowerCase());
    localStorage.setItem("turntable_users", JSON.stringify(updatedUsers));

    // Remove current user session and state
    localStorage.removeItem("turntable_current_user");
    setUser(null);
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isFallback, login, signup, logout, updateProfile, unregister }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
