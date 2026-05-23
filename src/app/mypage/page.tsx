"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StickyHeader from "@/components/StickyHeader";
import { getPosts, getCategoryLabel, Post } from "@/utils/communityDb";
import Link from "next/link";

export default function MyPage() {
  const router = useRouter();
  const { user, loading: authLoading, updateProfile, unregister, isFallback } = useAuth();

  // Inputs & states
  const [nicknameInput, setNicknameInput] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [unregistering, setUnregistering] = useState(false);

  // Users' own posts
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Users' purchase records
  interface UserOrder {
    id: string | number;
    price: number;
    payment_method: string;
    created_at: string;
    product_title: string;
    product_image_url: string | null;
    product_category: string;
  }

  const [activeSubTab, setActiveSubTab] = useState<"posts" | "orders">("posts");
  const [myOrders, setMyOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Sync nickname input when user loads
  useEffect(() => {
    if (user) {
      setNicknameInput(user.nickname);
    }
  }, [user]);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load user's community posts
  useEffect(() => {
    if (!user) return;
    const userNickname = user.nickname;

    async function loadMyPosts() {
      try {
        const res = await fetch("/api/posts");
        let allPosts: Post[] = [];
        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            allPosts = getPosts();
          } else {
            allPosts = Array.isArray(data) ? data : [];
          }
        } else {
          allPosts = getPosts();
        }

        // Filter posts authored by the current user's nickname
        const filtered = allPosts.filter(
          (p) => p.nickname.toLowerCase() === userNickname.toLowerCase()
        );
        setMyPosts(filtered);
      } catch (err) {
        console.error("Error loading my posts:", err);
        const filtered = getPosts().filter(
          (p) => p.nickname.toLowerCase() === userNickname.toLowerCase()
        );
        setMyPosts(filtered);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadMyPosts();
  }, [user]);

  // Load user's purchase orders
  useEffect(() => {
    if (!user) return;

    async function loadMyOrders() {
      try {
        const res = await fetch("/api/orders/me");
        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            loadLocalOrders();
          } else {
            setMyOrders(Array.isArray(data) ? data : []);
          }
        } else {
          loadLocalOrders();
        }
      } catch (err) {
        console.error("Error loading my orders:", err);
        loadLocalOrders();
      } finally {
        setLoadingOrders(false);
      }
    }

    loadMyOrders();
  }, [user]);

  const loadLocalOrders = () => {
    if (!user) return;
    const local = localStorage.getItem("turntable_orders");
    if (!local) {
      setMyOrders([]);
    } else {
      try {
        const parsed = JSON.parse(local);
        const filtered = parsed.filter((o: any) => o.user_email === user.email);
        setMyOrders(filtered);
      } catch (e) {
        setMyOrders([]);
      }
    }
  };

  const formatOrderDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return "날짜 정보 없음";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card": return "신용카드";
      case "kakaopay": return "카카오페이";
      case "tosspay": return "토스페이";
      default: return "기타 결제";
    }
  };

  const getProductCategoryLabel = (cat: string) => {
    switch (cat) {
      case "ticket": return "입장 티켓";
      case "consulting": return "맞춤 컨설팅";
      case "matching": return "개별 매칭";
      default: return "기타 상품";
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSuccess("");
    setEditError("");

    if (!nicknameInput.trim()) {
      setEditError("닉네임을 입력해 주세요.");
      return;
    }

    if (user && nicknameInput.trim() === user.nickname) {
      setEditSuccess("현재 닉네임과 동일합니다.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(nicknameInput.trim());
      if (res.success) {
        setEditSuccess("닉네임이 성공적으로 변경되었습니다.");
        // Clear success message after 3 seconds
        setTimeout(() => setEditSuccess(""), 3000);
      } else {
        setEditError(res.error || "닉네임 수정에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setEditError("닉네임 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnregister = async () => {
    const confirmed = window.confirm(
      "정말로 탈퇴하시겠습니까?\n탈퇴 시 회원님의 개인정보는 모두 삭제되며 이 작업은 되돌릴 수 없습니다."
    );
    if (!confirmed) return;

    setUnregistering(true);
    setEditError("");
    setEditSuccess("");

    try {
      const res = await unregister();
      if (res.success) {
        alert("회원 탈퇴가 완료되었습니다. 그동안 이용해 주셔서 감사합니다.");
        router.push("/");
      } else {
        setEditError(res.error || "회원 탈퇴 처리에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      setEditError("회원 탈퇴 중 오류가 발생했습니다.");
    } finally {
      setUnregistering(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-sm">마이페이지 세션을 확인하는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EB] text-[#3D3434] font-sans flex flex-col">
      <StickyHeader />

      {/* Main dashboard space */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 mt-20 space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E56B6F] to-[#ff8a8f] flex items-center justify-center text-white font-black text-2xl shadow-[0_4px_12px_rgba(229,107,111,0.3)]">
              {user.nickname.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#3D3434] tracking-tight flex items-center gap-2">
                {user.nickname}님, 반가워요!
                {user.isAdmin && (
                  <span className="bg-[#3D3434] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase leading-none">
                    Admin
                  </span>
                )}
              </h1>
              <p className="text-gray-400 text-xs mt-1 font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {user.isAdmin && (
              <Link
                href="/admin"
                className="bg-[#3D3434] hover:bg-neutral-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                관리자 페이지로 이동
              </Link>
            )}
            <Link
              href="/community"
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              커뮤니티 바로가기
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left panel: Profile management */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm space-y-6 self-start">
            <h2 className="text-sm font-bold border-b border-gray-100 pb-3 text-gray-800 uppercase tracking-wider">
              내 정보 수정
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold">
              {editSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl px-4 py-3 font-semibold">
                  ✓ {editSuccess}
                </div>
              )}
              {editError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-500 rounded-xl px-4 py-3 font-semibold">
                  ⚠️ {editError}
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-2">이메일 주소</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">닉네임</label>
                <input
                  type="text"
                  placeholder="변경할 닉네임 입력"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                  required
                  disabled={saving || unregistering}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black hover:bg-neutral-900 text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 mt-4"
                disabled={saving || unregistering}
              >
                {saving ? "저장 중..." : "닉네임 저장"}
              </button>
            </form>

            <div className="border-t border-gray-100 pt-4 mt-2">
              <button
                type="button"
                onClick={handleUnregister}
                disabled={saving || unregistering}
                className="w-full bg-white border border-rose-200 hover:bg-rose-50 disabled:opacity-50 text-rose-500 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer text-center animate-fade-in"
              >
                {unregistering ? "탈퇴 처리 중..." : "회원 탈퇴"}
              </button>
            </div>
          </div>

          {/* Right panel: Written posts or Purchased products */}
          <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-gray-200/60 shadow-sm flex flex-col">
            <div className="flex border-b border-gray-100 mb-6 gap-6">
              <button
                onClick={() => setActiveSubTab("posts")}
                className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all duration-200 border-b-2 cursor-pointer ${
                  activeSubTab === "posts"
                    ? "border-[#E56B6F] text-[#E56B6F]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                내가 작성한 게시글 ({myPosts.length})
              </button>
              <button
                onClick={() => setActiveSubTab("orders")}
                className={`pb-3 text-sm font-bold tracking-wider uppercase transition-all duration-200 border-b-2 cursor-pointer ${
                  activeSubTab === "orders"
                    ? "border-[#E56B6F] text-[#E56B6F]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                구매 및 결제 내역 ({myOrders.length})
              </button>
            </div>

            {activeSubTab === "posts" ? (
              loadingPosts ? (
                <div className="py-20 text-center text-xs text-gray-400 animate-pulse">
                  게시글 정보를 불러오는 중...
                </div>
              ) : myPosts.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">
                  작성한 커뮤니티 게시글이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F4EB]/40 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="py-3 px-4 w-20 text-center">카테고리</th>
                        <th className="py-3 px-4">게시글 제목</th>
                        <th className="py-3 px-4 w-16 text-center">조회수</th>
                        <th className="py-3 px-4 w-28 text-center">작성일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[#3D3434]">
                      {myPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-[#FDFBF7]/30 transition-colors">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              post.category === "counsel" 
                                ? "bg-rose-50 text-rose-500 border border-rose-100" 
                                : post.category === "qna" 
                                ? "bg-teal-50 text-teal-600 border border-teal-100" 
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}>
                              {getCategoryLabel(post.category)}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-700 max-w-[250px] truncate">
                            <Link href={`/community/${post.id}`} className="hover:text-[#E56B6F] hover:underline">
                              {post.title}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400 font-mono">{post.views}</td>
                          <td className="py-3 px-4 text-center text-gray-400 font-mono">{post.createdAt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              loadingOrders ? (
                <div className="py-20 text-center text-xs text-gray-400 animate-pulse">
                  구매 내역을 불러오는 중...
                </div>
              ) : myOrders.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">
                  구매하신 상품 내역이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F4EB]/40 border-b border-gray-100 text-gray-500 font-bold">
                        <th className="py-3 px-4 w-20">썸네일</th>
                        <th className="py-3 px-4">상품명</th>
                        <th className="py-3 px-4 w-24 text-right">결제금액</th>
                        <th className="py-3 px-4 w-24 text-center">결제수단</th>
                        <th className="py-3 px-4 w-28 text-center">결제일시</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[#3D3434]">
                      {myOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#FDFBF7]/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="w-16 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200/50 flex items-center justify-center shrink-0">
                              {order.product_image_url ? (
                                <img src={order.product_image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[9px] text-gray-300 font-bold uppercase">No Image</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-700 max-w-[200px] truncate">{order.product_title}</div>
                            <span className="text-[9px] text-[#E56B6F] font-semibold block mt-0.5">
                              {getProductCategoryLabel(order.product_category)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-gray-700">
                            {order.price.toLocaleString()}원
                          </td>
                          <td className="py-3 px-4 text-center text-gray-500 font-semibold">
                            {getPaymentMethodLabel(order.payment_method)}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400 font-mono">
                            {formatOrderDate(order.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="text-xs text-gray-400 text-center py-6 mt-auto border-t border-gray-200/50 bg-white">
        © 2026 Turntable Match. All rights reserved.
      </footer>
    </div>
  );
}
