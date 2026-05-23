"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import StickyHeader from "@/components/StickyHeader";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Product {
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

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Modal / Checkout flow
  const [checkoutStep, setCheckoutStep] = useState<"checkout" | "processing" | "success">("checkout");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
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

  // Load product
  useEffect(() => {
    if (!productId) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            setIsFallbackMode(true);
            loadLocalProduct(productId);
          } else if (Array.isArray(data)) {
            // Find product matching ID
            const found = data.find(p => p.id.toString() === productId);
            if (found) {
              setProduct(found);
            } else {
              // Try loading local as backup
              loadLocalProduct(productId);
            }
          }
        } else {
          setIsFallbackMode(true);
          loadLocalProduct(productId);
        }
      } catch (err) {
        console.warn("API error, switching to local product lookup:", err);
        setIsFallbackMode(true);
        loadLocalProduct(productId);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const loadLocalProduct = (id: string) => {
    const local = localStorage.getItem("turntable_products");
    let prods = INITIAL_MOCK_PRODUCTS;
    if (local) {
      try {
        prods = JSON.parse(local);
      } catch (e) {
        prods = INITIAL_MOCK_PRODUCTS;
      }
    }
    const found = prods.find(p => p.id.toString() === id);
    setProduct(found || null);
  };

  const handleOrderClick = () => {
    if (!user) {
      showToast("로그인이 필요합니다. 로그인 페이지로 이동합니다.", "warning");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }
    
    setIsCheckoutOpen(true);
    setCheckoutStep("checkout");
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setCheckoutStep("processing");

    if (isFallbackMode) {
      // Local fallback purchase
      setTimeout(() => {
        saveLocalOrder();
        setCheckoutStep("success");
      }, 1500);
    } else {
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            paymentMethod
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.fallback) {
            saveLocalOrder();
          }
          setCheckoutStep("success");
        } else {
          const data = await res.json();
          // Fallback to local if server fails but we are logged in
          if (data.error && data.error.includes("DATABASE_URL")) {
            saveLocalOrder();
            setCheckoutStep("success");
          } else {
            showToast(data.error || "결제 등록에 실패했습니다.", "error");
            setCheckoutStep("checkout");
          }
        }
      } catch (err) {
        console.error(err);
        saveLocalOrder();
        setCheckoutStep("success");
      }
    }
  };

  const saveLocalOrder = () => {
    if (!product || !user) return;
    const localOrdersStr = localStorage.getItem("turntable_orders") || "[]";
    try {
      const currentOrders = JSON.parse(localOrdersStr);
      const newOrder = {
        id: `order-${Date.now()}`,
        user_email: user.email,
        product_id: product.id,
        price: product.price,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
        product_title: product.title,
        product_image_url: product.image_url,
        product_category: product.category
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center pt-[70px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#E56B6F] rounded-full animate-spin"></div>
          <p className="text-gray-400 text-xs animate-pulse font-medium">상품 정보를 불러오고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F7F4EB] text-[#3D3434] font-sans flex flex-col pt-[70px]">
        <StickyHeader />
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-20 text-center space-y-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-extrabold text-gray-700">해당 상품을 찾을 수 없습니다.</h2>
          <p className="text-gray-400 text-xs font-semibold">삭제되었거나 없는 상품 주소입니다.</p>
          <Link href="/store" className="inline-block bg-black hover:bg-[#E56B6F] text-white font-bold py-2.5 px-6 rounded-full text-xs transition-colors">
            스토어 목록으로 가기
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EB] text-[#3D3434] font-sans flex flex-col pt-[70px]">
      <StickyHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
          <Link href="/store" className="hover:text-[#E56B6F] transition-colors">스토어</Link>
          <span>&gt;</span>
          <span className="text-gray-600 truncate max-w-[200px]">{product.title}</span>
        </div>

        {/* Product Box Section */}
        <div className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8">
          
          {/* Product Image Panel (Left/Top) */}
          <div className="md:col-span-6 flex flex-col gap-4">
            <div className="aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200/60 relative">
              {product.image_url ? (
                <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold bg-neutral-100">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Product Description Panel (Right/Bottom) */}
          <div className="md:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="bg-[#E56B6F] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block">
                {product.category}
              </span>
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">
                {getCategoryLabel(product.category)}
              </span>
              <h1 className="text-xl md:text-2xl font-black text-[#3D3434] leading-snug tracking-tight">
                {product.title}
              </h1>
              
              <div className="border-t border-b border-gray-100 py-4 mt-6">
                <span className="text-xs text-gray-400 font-bold block mb-1">서비스 요금</span>
                <span className="text-2xl font-black text-[#3D3434] font-sans">
                  {product.price.toLocaleString()}원
                </span>
              </div>

              <div className="space-y-2 mt-4">
                <span className="text-xs text-gray-400 font-bold block">상세 소개</span>
                <p className="text-xs text-gray-500 font-medium leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 border border-gray-200/40">
                  {product.description}
                </p>
              </div>
            </div>

            <div className="pt-6 flex flex-col gap-3">
              <button 
                onClick={handleOrderClick}
                className="w-full bg-black hover:bg-[#E56B6F] hover:shadow-md hover:shadow-[#E56B6F]/20 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all duration-300 cursor-pointer shadow-sm text-center"
              >
                신청 및 결제하기
              </button>
              <Link
                href="/store"
                className="w-full bg-white hover:bg-gray-50 text-gray-500 border border-gray-200/80 font-bold text-xs py-3 px-6 rounded-2xl transition-all cursor-pointer text-center"
              >
                스토어 목록으로 가기
              </Link>
            </div>
          </div>

        </div>

        {/* Detailed Guidelines Block */}
        <div className="bg-[#FDFBF7] rounded-3xl border border-gray-200/60 p-6 md:p-8 space-y-6">
          <h3 className="text-sm font-black text-[#3D3434] uppercase tracking-wider border-b border-gray-100 pb-3">
            이용 및 환불 규정 안내
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[11px] text-gray-400 leading-relaxed font-semibold">
            <div className="space-y-2.5">
              <p className="text-gray-600 font-bold">✓ 이용 안내</p>
              <p>• 결제 완료 시 마이페이지 및 등록된 연락처로 알림톡 안내문이 발송됩니다.</p>
              <p>• 1:1 컨설팅 및 개별 매칭의 경우 담당 매니저 배정 후 1~2일 내 사전 면담 조율 연락을 드립니다.</p>
              <p>• 로테이션 미팅 참가권은 신청하신 일자의 성비 조율을 거쳐 최종 참가 확정 문자를 전송해 드립니다.</p>
            </div>
            <div className="space-y-2.5">
              <p className="text-rose-500 font-bold">✓ 취소 및 환불 안내</p>
              <p>• 1:1 프로필 컨설팅은 컨설턴트 면담 조율 진행 전단계까지 100% 환불 가능합니다.</p>
              <p>• 매칭 티켓의 경우 알고리즘 분석 및 소개팅 상대 매칭 조율이 이미 완료된 이후에는 환불이 불가능합니다.</p>
              <p>• 로테이션 미팅 참가 취소는 행사 시작 3일 전까지 취소 시 전액 환불되며, 이후에는 성비 균형상 취소/환불이 불가하오니 유의하시기 바랍니다.</p>
            </div>
          </div>
        </div>

      </main>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-[#3D3434]/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-md border border-gray-200/80 shadow-2xl p-6 md:p-8 animate-slide-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-lg font-extrabold text-[#3D3434]">
                {checkoutStep === "success" ? "결제 완료" : "프리미엄 세션 신청"}
              </h2>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                disabled={checkoutStep === "processing"}
                className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-30 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {checkoutStep === "checkout" && (
              <form onSubmit={handlePaySubmit} className="space-y-6">
                <div className="bg-[#F7F4EB] rounded-2xl p-4 border border-gray-200/60 flex gap-3 items-center">
                  <div className="w-16 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0 border border-gray-300/30">
                    {product.image_url && (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#E56B6F] block mb-0.5">
                      {getCategoryLabel(product.category)}
                    </span>
                    <h4 className="font-extrabold text-sm text-[#3D3434] truncate leading-tight">
                      {product.title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-2 border-b border-gray-100 pb-4">
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>주문금액</span>
                    <span>{product.price.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 font-semibold">
                    <span>할인혜택</span>
                    <span className="text-emerald-500">-0원</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#3D3434] pt-2">
                    <span>총 결제금액</span>
                    <span className="text-base text-[#E56B6F]">{product.price.toLocaleString()}원</span>
                  </div>
                </div>

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

                <div className="text-[10px] text-gray-400 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                  ⚠️ 본 결제는 모의 결제 화면으로 실제 대금이 청구되지 않습니다.
                  결제 완료 시 매칭 안내 문자 및 프로필 컨설팅 상세 안내가 카카오톡으로 즉시 발송됩니다.
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E56B6F] hover:bg-[#d4595d] text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer text-center text-sm"
                >
                  {product.price.toLocaleString()}원 결제하기
                </button>
              </form>
            )}

            {checkoutStep === "processing" && (
              <div className="py-16 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#E56B6F] animate-spin"></div>
                <p className="text-sm font-semibold text-gray-600 animate-pulse">안전하게 결제를 진행 중입니다...</p>
              </div>
            )}

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
                  onClick={() => setIsCheckoutOpen(false)}
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
