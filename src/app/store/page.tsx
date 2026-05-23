"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StickyHeader from "@/components/StickyHeader";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
}

const INITIAL_MOCK_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    title: "삼청동 라운지 로테이션 미팅 1회권",
    description: "선별된 2030 직장인과의 2시간 진중한 대화 및 삼청동 프라이빗 라운지 웰컴 드링크/간단한 다과 제공권",
    price: 59000,
    category: "ticket",
    image_url: "/images/product_ticket.png"
  },
  {
    id: "prod-2",
    title: "1:1 맞춤형 프로필 컨설팅",
    description: "전문 컨설턴트가 분석하는 프로필 사진 및 소개글 솔루션. 매칭 성공률 200% 증가 보장 서비스",
    price: 99000,
    category: "consulting",
    image_url: "/images/product_consulting.png"
  },
  {
    id: "prod-3",
    title: "프리미엄 1:1 골드 매칭 티켓",
    description: "이상형 매칭 알고리즘 및 전문 매니저의 개별 매칭 조율을 통한 1:1 소개팅 보장권",
    price: 129000,
    category: "matching",
    image_url: "/images/product_premium.png"
  }
];

export default function StorePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Modal / Checkout flow
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");

  // Custom Toast state
  const [toast, setToast] = useState<{ message: string; show: boolean; type: "success" | "error" | "warning" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "warning") => {
    setToast({ message, show: true, type });
  };

  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load products
  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        if (data.fallback) {
          setIsFallbackMode(true);
          loadLocalProducts();
        } else if (Array.isArray(data)) {
          setProducts(data);
        }
      } else {
        setIsFallbackMode(true);
        loadLocalProducts();
      }
    } catch (err) {
      console.warn("API error, switching to local products:", err);
      setIsFallbackMode(true);
      loadLocalProducts();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalProducts = () => {
    const local = localStorage.getItem("turntable_products");
    if (!local) {
      localStorage.setItem("turntable_products", JSON.stringify(INITIAL_MOCK_PRODUCTS));
      setProducts(INITIAL_MOCK_PRODUCTS);
    } else {
      try {
        setProducts(JSON.parse(local));
      } catch (e) {
        setProducts(INITIAL_MOCK_PRODUCTS);
      }
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Add event listener to refresh store when product list changes (e.g. from local storage in fallback mode)
    window.addEventListener("storage", fetchProducts);
    return () => window.removeEventListener("storage", fetchProducts);
  }, []);

  const handleOrderClick = (product: Product) => {
    if (!user) {
      showToast("로그인이 필요합니다. 로그인 페이지로 이동합니다.", "warning");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }
    
    setSelectedProduct(product);
    setCheckoutStep("checkout");
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setCheckoutStep("processing");
    
    if (isFallbackMode) {
      setTimeout(() => {
        saveLocalOrder(selectedProduct);
        setCheckoutStep("success");
      }, 1500);
    } else {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: selectedProduct.id,
            paymentMethod
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            saveLocalOrder(selectedProduct);
          }
          setCheckoutStep("success");
        } else {
          const data = await res.json();
          if (data.error && data.error.includes("DATABASE_URL")) {
            saveLocalOrder(selectedProduct);
            setCheckoutStep("success");
          } else {
            showToast(data.error || "결제 등록에 실패했습니다.", "error");
            setCheckoutStep("checkout");
          }
        }
      } catch (err) {
        console.error(err);
        saveLocalOrder(selectedProduct);
        setCheckoutStep("success");
      }
    }
  };

  const saveLocalOrder = (prod: Product) => {
    if (!user) return;
    const localOrdersStr = localStorage.getItem("turntable_orders") || "[]";
    try {
      const currentOrders = JSON.parse(localOrdersStr);
      const newOrder = {
        id: `order-${Date.now()}`,
        user_email: user.email,
        product_id: prod.id,
        price: prod.price,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        product_title: prod.title,
        product_image_url: prod.image_url,
        product_category: prod.category
      };
      localStorage.setItem("turntable_orders", JSON.stringify([newOrder, ...currentOrders]));
    } catch (e) {
      console.error("Failed to save local order:", e);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "ticket": return "입장권 / 세션티켓";
      case "consulting": return "1:1 컨설팅";
      case "matching": return "매칭 서비스";
      default: return "기타 상품";
    }
  };

  const filteredProducts = activeTab === "all"
    ? products
    : products.filter(p => p.category === activeTab);

  return (
    <div className="min-h-screen bg-[#F7F4EB] text-[#3D3434] font-sans flex flex-col pt-[70px]">
      <StickyHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#FDFBF7] to-[#F7F4EB] border-b border-gray-200/60 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-[#E56B6F] font-serif italic text-lg md:text-xl block mb-2">Premium Matching Shop</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#3D3434] mb-3">
            턴테이블 매치 프리미엄 스토어
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            나에게 딱 맞는 로테이션 미팅 참가 티켓과 소개팅 성공률을 200% 올려주는 1:1 맞춤 코칭/컨설팅 서비스를 만나보세요.
          </p>
        </div>
      </section>

      {/* Main Store Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {[
            { key: "all", label: "전체 상품" },
            { key: "ticket", label: "입장 티켓" },
            { key: "consulting", label: "맞춤 컨설팅" },
            { key: "matching", label: "개별 매칭" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#E56B6F] text-white shadow-md shadow-[#E56B6F]/20"
                  : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
            상품 정보를 불러오는 중입니다...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            등록된 상품이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div 
                key={product.id}
                className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1"
              >
                {/* Product Thumbnail */}
                <Link href={`/store/${product.id}`} className="relative aspect-video bg-gray-100 overflow-hidden shrink-0 block">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-neutral-100">
                      No Image
                    </div>
                  )}
                  {/* Category overlay */}
                  <span className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {product.category}
                  </span>
                </Link>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider block mb-1">
                      {getCategoryLabel(product.category)}
                    </span>
                    <h3 className="font-extrabold text-lg text-[#3D3434] leading-tight mb-2 tracking-tight group-hover:text-[#E56B6F] transition-colors">
                      <Link href={`/store/${product.id}`} className="hover:underline">
                        {product.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium line-clamp-3">
                      {product.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                    <span className="text-xl font-black text-[#3D3434] tracking-tight font-sans">
                      {product.price.toLocaleString()}원
                    </span>
                    <button 
                      onClick={() => handleOrderClick(product)}
                      className="bg-black hover:bg-[#E56B6F] hover:shadow-md hover:shadow-[#E56B6F]/20 text-white font-bold text-xs py-2.5 px-5 rounded-full transition-all duration-300 cursor-pointer"
                    >
                      신청하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#3D3434] text-white/40 py-12 px-6 text-center text-xs border-t border-white/5 mt-auto">
        <div className="max-w-6xl mx-auto">
          <p className="font-bold text-white/70 text-sm mb-3">턴테이블 매치 (Turntable Match)</p>
          <p className="mb-5 leading-relaxed">
            사업자등록번호: 120-00-00000 | 결혼중개업신고번호: 제 2026-서울강남-0001호 | 주소: 서울특별시 강남구 삼성동 턴테이블 빌딩 4F
            <br />
            대표이메일: support@turntablematch.com | 문의: 카카오톡 @턴테이블매치
          </p>
          <p>© 2026 Turntable Match. All rights reserved. Personal data strictly encrypted.</p>
        </div>
      </footer>

      {/* Checkout Modal / Step Flow */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-[#3D3434]/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-md border border-gray-200/80 shadow-2xl p-6 md:p-8 animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-lg font-extrabold text-[#3D3434]">
                {checkoutStep === "success" ? "결제 완료" : "프리미엄 세션 신청"}
              </h2>
              <button
                onClick={() => setSelectedProduct(null)}
                disabled={checkoutStep === "processing"}
                className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-30 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step 1: Checkout Form */}
            {checkoutStep === "checkout" && (
              <form onSubmit={handlePaySubmit} className="space-y-6">
                {/* Product Summary */}
                <div className="bg-[#F7F4EB] rounded-2xl p-4 border border-gray-200/60 flex gap-3 items-center">
                  <div className="w-16 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-gray-300/30">
                    {selectedProduct.image_url && (
                      <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#E56B6F] block mb-0.5">
                      {getCategoryLabel(selectedProduct.category)}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#3D3434] truncate leading-tight">
                      {selectedProduct.title}
                    </h4>
                  </div>
                </div>

                {/* Pricing Info */}
                <div className="space-y-2 border-b border-gray-100 pb-4">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>주문금액</span>
                    <span>{selectedProduct.price.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>할인혜택</span>
                    <span className="text-emerald-500">-0원</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#3D3434] pt-2">
                    <span>총 결제금액</span>
                    <span className="text-base text-[#E56B6F]">{selectedProduct.price.toLocaleString()}원</span>
                  </div>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    결제 수단 선택
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "card", label: "신용카드" },
                      { id: "kakaopay", label: "카카오페이" },
                      { id: "tosspay", label: "토스페이" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`py-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          paymentMethod === method.id
                            ? "border-black bg-black text-white shadow-sm"
                            : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terms Disclaimer */}
                <div className="text-[10px] text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                  ⚠️ 본 결제는 모의 결제 화면으로 실제 대금이 청구되지 않습니다.
                  결제 완료 시 매칭 안내 문자 및 프로필 컨설팅 상세 안내가 카카오톡으로 즉시 발송됩니다.
                </div>

                {/* Pay Button */}
                <button
                  type="submit"
                  className="w-full bg-[#E56B6F] hover:bg-[#d4595d] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center text-sm"
                >
                  {selectedProduct.price.toLocaleString()}원 결제하기
                </button>
              </form>
            )}

            {/* Step 2: Processing Loader */}
            {checkoutStep === "processing" && (
              <div className="py-16 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#E56B6F] animate-spin"></div>
                <p className="text-sm font-semibold text-gray-600 animate-pulse">안전하게 결제를 진행 중입니다...</p>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {checkoutStep === "success" && (
              <div className="py-6 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 border border-emerald-100 flex items-center justify-center mx-auto animate-float">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-[#3D3434]">주문 및 결제 완료!</h3>
                  <p className="text-xs text-gray-400 leading-relaxed px-4">
                    정상적으로 결제가 완료되었습니다.<br />
                    매칭 확정 일정 및 모바일 사원증 인증 정보는 마이페이지 및 알림톡으로 발송되었습니다.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer mt-4"
                >
                  확인
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast?.show && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 p-4 flex items-center gap-3 animate-slide-in-right">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-500" 
              : toast.type === "warning"
              ? "bg-amber-50 text-amber-500"
              : "bg-rose-50 text-rose-500"
          }`}>
            {toast.type === "success" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : toast.type === "warning" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
