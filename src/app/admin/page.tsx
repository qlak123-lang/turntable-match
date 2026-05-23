"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPosts, savePosts, getCategoryLabel, Post } from "@/utils/communityDb";

interface AdminUser {
  id?: string | number;
  email: string;
  nickname: string;
  isAdmin: boolean;
  createdAt?: string;
}

interface Product {
  id: string | number;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
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

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout, isFallback } = useAuth();
  
  // Dashboard state
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Sidebar tab state: "dashboard" | "users" | "posts" | "products"
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "posts" | "products">("dashboard");

  // Filters and searches
  const [userSearch, setUserSearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState<"all" | Post["category"]>("all");

  // User detail viewer state
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Post edit state
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<Post["category"]>("general");
  const [editContent, setEditContent] = useState("");
  const [updatingPost, setUpdatingPost] = useState(false);

  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodTitle, setProdTitle] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPrice, setProdPrice] = useState<number | "">("");
  const [prodCategory, setProdCategory] = useState<string>("ticket");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");

  const handleViewUserDetails = (targetUser: AdminUser) => {
    setSelectedUser(targetUser);
  };

  const handleEditPost = (targetPost: Post) => {
    setEditingPost(targetPost);
    setEditTitle(targetPost.title);
    setEditCategory(targetPost.category);
    setEditContent(targetPost.content);
  };

  const handleUpdatePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    if (!editTitle.trim() || !editContent.trim()) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setUpdatingPost(true);
    if (isFallback) {
      const currentPosts = getPosts();
      const updated = currentPosts.map(p => {
        if (p.id === editingPost.id) {
          return {
            ...p,
            title: editTitle.trim(),
            content: editContent.trim(),
            category: editCategory
          };
        }
        return p;
      });
      savePosts(updated);
      setPosts(updated);
      setUpdatingPost(false);
      setEditingPost(null);
      alert("로컬 저장소의 게시글이 수정되었습니다.");
    } else {
      try {
        const res = await fetch(`/api/posts/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim(),
            content: editContent.trim(),
            category: editCategory
          }),
        });

        if (res.ok) {
          setPosts(prev =>
            prev.map(p =>
              p.id === editingPost.id
                ? { ...p, title: editTitle.trim(), content: editContent.trim(), category: editCategory }
                : p
            )
          );
          setEditingPost(null);
          alert("게시글이 성공적으로 수정되었습니다.");
        } else {
          const data = await res.json();
          alert(data.error || "게시글 수정에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      } finally {
        setUpdatingPost(false);
      }
    }
  };

  // Authenticate and protect route
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else if (!user.isAdmin) {
        alert("관리자 권한이 없습니다.");
        router.push("/");
      }
    }
  }, [user, authLoading, router]);

  // Load dashboard data
  useEffect(() => {
    if (authLoading || !user || !user.isAdmin) return;

    async function loadDashboardData() {
      try {
        // 1. Fetch posts
        const postsRes = await fetch("/api/posts");
        let postsData: Post[] = [];
        if (postsRes.ok) {
          const data = await postsRes.json();
          if (data.fallback) {
            postsData = getPosts();
          } else {
            postsData = Array.isArray(data) ? data : [];
          }
        } else {
          postsData = getPosts();
        }
        setPosts(postsData);

        // 2. Fetch users
        const usersRes = await fetch("/api/admin/users");
        if (usersRes.ok) {
          const data = await usersRes.json();
          if (data.fallback) {
            loadLocalUsers();
          } else {
            setUsers(Array.isArray(data) ? data : []);
          }
        } else {
          loadLocalUsers();
        }

        // 3. Fetch products
        const productsRes = await fetch("/api/products");
        let productsData: Product[] = [];
        if (productsRes.ok) {
          const data = await productsRes.json();
          if (data.fallback) {
            productsData = loadLocalProducts();
          } else {
            productsData = Array.isArray(data) ? data : [];
          }
        } else {
          productsData = loadLocalProducts();
        }
        setProducts(productsData);
      } catch (err) {
        console.error("Error loading admin dashboard data:", err);
        setPosts(getPosts());
        loadLocalUsers();
        setProducts(loadLocalProducts());
      } finally {
        setLoadingData(false);
      }
    }

    loadDashboardData();
  }, [user, authLoading]);

  // Local users loader helper
  const loadLocalUsers = () => {
    const localUsersStr = localStorage.getItem("turntable_users") || "[]";
    try {
      const parsed = JSON.parse(localUsersStr);
      const mapped: AdminUser[] = parsed.map((u: any, idx: number) => ({
        id: `mock-user-${idx}`,
        email: u.email,
        nickname: u.nickname,
        isAdmin: u.isAdmin,
        createdAt: "로컬 스토리지"
      }));
      setUsers(mapped);
    } catch (e) {
      setUsers([]);
    }
  };

  // Local products loader helper
  const loadLocalProducts = (): Product[] => {
    const local = localStorage.getItem("turntable_products");
    if (!local) {
      localStorage.setItem("turntable_products", JSON.stringify(INITIAL_MOCK_PRODUCTS));
      return INITIAL_MOCK_PRODUCTS;
    } else {
      try {
        return JSON.parse(local);
      } catch (e) {
        return INITIAL_MOCK_PRODUCTS;
      }
    }
  };

  // Toggle user admin rights
  const handleToggleAdmin = async (targetUser: AdminUser) => {
    // Prevent toggling oneself
    if (targetUser.email === user?.email) {
      alert("자기 자신의 관리자 권한은 변경할 수 없습니다.");
      return;
    }

    const nextIsAdmin = !targetUser.isAdmin;
    const confirmMsg = `${targetUser.nickname}님의 권한을 ${nextIsAdmin ? "관리자(Admin)" : "일반 사용자(User)"}로 변경하시겠습니까?`;
    if (!confirm(confirmMsg)) return;

    if (isFallback) {
      const localUsersStr = localStorage.getItem("turntable_users") || "[]";
      try {
        const parsed = JSON.parse(localUsersStr);
        const updated = parsed.map((u: any) => {
          if (u.email === targetUser.email) {
            return { ...u, isAdmin: nextIsAdmin };
          }
          return u;
        });
        localStorage.setItem("turntable_users", JSON.stringify(updated));
        loadLocalUsers();
        alert("로컬 저장소의 권한이 정상 변경되었습니다.");
      } catch (e) {
        alert("권한 변경 실패");
      }
    } else {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: targetUser.id, isAdmin: nextIsAdmin }),
        });
        if (res.ok) {
          setUsers(prev =>
            prev.map(u => (u.id === targetUser.id ? { ...u, isAdmin: nextIsAdmin } : u))
          );
          alert("권한이 정상 변경되었습니다.");
        } else {
          const data = await res.json();
          alert(data.error || "권한 변경에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      }
    }
  };

  // Delete user account
  const handleDeleteUser = async (targetUser: AdminUser) => {
    // Prevent deleting oneself
    if (targetUser.email === user?.email) {
      alert("자기 자신의 계정은 삭제할 수 없습니다.");
      return;
    }

    if (!confirm(`${targetUser.nickname}님의 회원 계정을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;

    if (isFallback) {
      const localUsersStr = localStorage.getItem("turntable_users") || "[]";
      try {
        const parsed = JSON.parse(localUsersStr);
        const updated = parsed.filter((u: any) => u.email !== targetUser.email);
        localStorage.setItem("turntable_users", JSON.stringify(updated));
        loadLocalUsers();
        alert("로컬 저장소에서 계정이 정상 삭제되었습니다.");
      } catch (e) {
        alert("계정 삭제 실패");
      }
    } else {
      try {
        const res = await fetch(`/api/admin/users?userId=${targetUser.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setUsers(prev => prev.filter(u => u.id !== targetUser.id));
          alert("계정이 성공적으로 삭제되었습니다.");
        } else {
          const data = await res.json();
          alert(data.error || "계정 삭제에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      }
    }
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm("정말 이 게시글을 영구적으로 삭제하시겠습니까?")) return;

    if (isFallback) {
      const currentPosts = getPosts();
      const filtered = currentPosts.filter(p => p.id !== postId);
      savePosts(filtered);
      setPosts(filtered);
      alert("게시글이 삭제되었습니다.");
    } else {
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setPosts(prev => prev.filter(p => p.id !== postId));
          alert("게시글이 삭제되었습니다.");
        } else {
          const data = await res.json();
          alert(data.error || "게시글 삭제에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      }
    }
  };

  // Product helper label
  const getProductCategoryLabel = (cat: string) => {
    switch (cat) {
      case "ticket": return "입장 티켓";
      case "consulting": return "맞춤 컨설팅";
      case "matching": return "개별 매칭";
      default: return "기타 상품";
    }
  };

  // Product and image handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadImage(e.target.files[0]);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/products/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProdImageUrl(data.imageUrl);
        alert("이미지가 정상 업로드되었습니다.");
      } else {
        const data = await res.json();
        if (isFallback) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProdImageUrl(reader.result as string);
            alert("로컬 스토리지 모드용 이미지 변환 완료 (Base64)");
          };
          reader.readAsDataURL(file);
        } else {
          alert(data.error || "이미지 업로드에 실패했습니다.");
        }
      }
    } catch (err) {
      console.error(err);
      if (isFallback) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProdImageUrl(reader.result as string);
          alert("로컬 스토리지 모드용 이미지 변환 완료 (Base64)");
        };
        reader.readAsDataURL(file);
      } else {
        alert("이미지 업로드 중 오류가 발생했습니다.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodTitle.trim() || !prodDesc.trim() || !prodCategory || prodPrice === "") {
      alert("모든 필드를 채워주세요.");
      return;
    }

    const priceNum = parseInt(String(prodPrice), 10);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("올바른 가격을 입력해주세요.");
      return;
    }

    setSavingProduct(true);

    if (isFallback) {
      const currentProducts = loadLocalProducts();
      if (editingProduct) {
        const updated = currentProducts.map(p => {
          if (p.id === editingProduct.id) {
            return {
              ...p,
              title: prodTitle.trim(),
              description: prodDesc.trim(),
              price: priceNum,
              category: prodCategory,
              image_url: prodImageUrl || null
            };
          }
          return p;
        });
        localStorage.setItem("turntable_products", JSON.stringify(updated));
        setProducts(updated);
        alert("로컬 저장소의 상품이 수정되었습니다.");
      } else {
        const newProduct: Product = {
          id: `local-prod-${Date.now()}`,
          title: prodTitle.trim(),
          description: prodDesc.trim(),
          price: priceNum,
          category: prodCategory,
          image_url: prodImageUrl || null
        };
        const updated = [newProduct, ...currentProducts];
        localStorage.setItem("turntable_products", JSON.stringify(updated));
        setProducts(updated);
        alert("로컬 저장소에 상품이 등록되었습니다.");
      }
      closeProductModal();
      setSavingProduct(false);
    } else {
      try {
        const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
        const method = editingProduct ? "PATCH" : "POST";
        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: prodTitle.trim(),
            description: prodDesc.trim(),
            price: priceNum,
            category: prodCategory,
            imageUrl: prodImageUrl || null
          })
        });

        if (res.ok) {
          const savedData = await res.json();
          if (editingProduct) {
            setProducts(prev => prev.map(p => p.id === editingProduct.id ? savedData : p));
            alert("상품이 성공적으로 수정되었습니다.");
          } else {
            setProducts(prev => [savedData, ...prev]);
            alert("상품이 성공적으로 등록되었습니다.");
          }
          closeProductModal();
        } else {
          const data = await res.json();
          alert(data.error || "상품 저장에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      } finally {
        setSavingProduct(false);
      }
    }
  };

  const handleDeleteProduct = async (prodId: string | number) => {
    if (!confirm("정말 이 상품을 영구적으로 삭제하시겠습니까?")) return;

    if (isFallback) {
      const currentProducts = loadLocalProducts();
      const filtered = currentProducts.filter(p => p.id !== prodId);
      localStorage.setItem("turntable_products", JSON.stringify(filtered));
      setProducts(filtered);
      alert("상품이 삭제되었습니다.");
    } else {
      try {
        const res = await fetch(`/api/products/${prodId}`, {
          method: "DELETE"
        });

        if (res.ok) {
          setProducts(prev => prev.filter(p => p.id !== prodId));
          alert("상품이 성공적으로 삭제되었습니다.");
        } else {
          const data = await res.json();
          alert(data.error || "상품 삭제에 실패했습니다.");
        }
      } catch (err) {
        console.error(err);
        alert("서버 연결 실패");
      }
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdTitle("");
    setProdDesc("");
    setProdPrice("");
    setProdCategory("ticket");
    setProdImageUrl("");
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdTitle(prod.title);
    setProdDesc(prod.description);
    setProdPrice(prod.price);
    setProdCategory(prod.category);
    setProdImageUrl(prod.image_url || "");
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  // Loading screen
  if (authLoading || !user || !user.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-400 animate-pulse text-sm">관리자 세션을 확인하는 중...</p>
      </div>
    );
  }

  // Filter lists based on inputs
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.nickname.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.nickname.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.content.toLowerCase().includes(postSearch.toLowerCase());
    
    const matchesCategory = postCategoryFilter === "all" || p.category === postCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(productSearch.toLowerCase());
    
    const matchesCategory = productCategoryFilter === "all" || p.category === productCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const counselCount = posts.filter(p => p.category === "counsel").length;
  const qnaCount = posts.filter(p => p.category === "qna").length;
  const generalCount = posts.filter(p => p.category === "general").length;

  return (
    <div className="min-h-screen bg-[#F7F4EB] text-[#3D3434] font-sans flex">
      
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 bg-[#3D3434] text-white flex flex-col justify-between shrink-0 shadow-lg">
        
        {/* Sidebar Header / Brand Logo */}
        <div>
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E56B6F] to-[#ff8a8f] flex items-center justify-center text-white font-black text-sm shadow-[0_2px_8px_rgba(229,107,111,0.4)]">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none">턴테이블 매치</span>
              <span className="text-[9px] text-[#E56B6F] font-bold uppercase tracking-wider mt-1.5">Admin Center</span>
            </div>
          </div>

          {/* User Profile */}
          <div className="px-6 py-5 border-b border-white/5 bg-[#2B2424]/40">
            <div className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2.5">Active Session</div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white/95 truncate block max-w-[130px]">{user.nickname}님</span>
              <span className="bg-[#E56B6F] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase leading-none">Admin</span>
            </div>
            <span className="text-[10px] text-white/50 truncate block mt-1">{user.email}</span>
          </div>

          {/* Menu Links */}
          <nav className="p-4 space-y-1">
            {[
              {
                id: "dashboard",
                label: "대시보드 홈",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )
              },
              {
                id: "users",
                label: "회원 관리",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )
              },
              {
                id: "posts",
                label: "게시글 관리",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                )
              },
              {
                id: "products",
                label: "상품 관리",
                icon: (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                )
              }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === item.id
                    ? "bg-[#E56B6F] text-white shadow-md shadow-[#E56B6F]/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Links */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold border border-white/10 hover:bg-white/5 py-2.5 rounded-xl transition-all cursor-pointer text-white/80"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            메인 홈페이지 이동
          </button>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 p-8 md:p-10 space-y-8 overflow-y-auto max-h-screen">
        
        {/* Top Header of Main Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#3D3434]">
              {activeTab === "dashboard" && "대시보드 홈"}
              {activeTab === "users" && "회원 관리"}
              {activeTab === "posts" && "커뮤니티 게시글 관리"}
              {activeTab === "products" && "상품 관리"}
            </h1>
            <p className="text-gray-400 text-xs mt-1">
              {activeTab === "dashboard" && "사이트 전체 현황 및 활성 지표를 모니터링합니다."}
              {activeTab === "users" && "가입된 전체 회원 리스트 조회 및 권한 조정, 계정 삭제 관리를 지원합니다."}
              {activeTab === "posts" && "커뮤니티 내 부적절한 게시글 필터링 및 상세 검토, 영구 삭제 처리를 지원합니다."}
              {activeTab === "products" && "스토어 상품 등록, 수정, 삭제 및 대표 이미지 관리를 진행합니다."}
            </p>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200/80 shadow-sm flex items-center gap-2 text-xs font-semibold text-gray-500 shrink-0">
            <span className={`w-2.5 h-2.5 rounded-full ${isFallback ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}`}></span>
            구동 환경: {isFallback ? "로컬 스토리지 Fallback" : "PostgreSQL Database"}
          </div>
        </div>

        {/* Dynamic Tab Render */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "총 사용자 회원 수", value: `${users.length}명`, sub: "신원 인증 및 일반 등록 회원", color: "border-sky-500" },
                { label: "전체 게시글 등록 수", value: `${posts.length}개`, sub: `연애고민 ${counselCount} | Q&A ${qnaCount} | 자유 ${generalCount}`, color: "border-[#E56B6F]" },
                { label: "등록된 상품 수", value: `${products.length}개`, sub: "티켓, 코칭, 매칭 서비스", color: "border-amber-500" },
                { label: "누적 페이지 조회수", value: `${totalViews.toLocaleString()}회`, sub: "전체 게시글 누적 읽기 합계", color: "border-teal-500" }
              ].map((stat, idx) => (
                <div key={idx} className={`bg-white p-6 rounded-2xl border-l-4 ${stat.color} shadow-sm transition-all hover:translate-y-[-2px] duration-200`}>
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">{stat.label}</span>
                  <span className="text-3xl font-black text-[#3D3434] block mt-3">{stat.value}</span>
                  <span className="text-gray-400 text-[10px] font-medium block mt-2">{stat.sub}</span>
                </div>
              ))}
            </div>

            {/* Quick Summary Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent posts summary */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#3D3434]">최근 등록 게시글 (최대 5개)</h2>
                  <button 
                    onClick={() => setActiveTab("posts")} 
                    className="text-sky-600 hover:text-sky-700 text-xs font-bold hover:underline"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F4EB]/50 border-b border-gray-100 text-gray-400 font-bold">
                        <th className="py-2.5 px-4 w-20 text-center">카테고리</th>
                        <th className="py-2.5 px-4">제목</th>
                        <th className="py-2.5 px-4 w-24">작성자</th>
                        <th className="py-2.5 px-4 w-16 text-center">조회수</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[#3D3434]">
                      {posts.slice(0, 5).map((post) => (
                        <tr key={post.id} className="hover:bg-[#FDFBF7]/40">
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              post.category === "counsel" ? "bg-rose-50 text-rose-500" : post.category === "qna" ? "bg-teal-50 text-teal-600" : "bg-gray-100 text-gray-600"
                            }`}>
                              {getCategoryLabel(post.category)}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-semibold truncate max-w-[200px]">{post.title}</td>
                          <td className="py-2.5 px-4 text-gray-500">{post.nickname}</td>
                          <td className="py-2.5 px-4 text-center text-gray-400 font-mono">{post.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Users summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#3D3434]">최근 가입 회원 (최대 5명)</h2>
                  <button 
                    onClick={() => setActiveTab("users")} 
                    className="text-sky-600 hover:text-sky-700 text-xs font-bold hover:underline"
                  >
                    전체 보기
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F7F4EB]/50 border-b border-gray-100 text-gray-400 font-bold">
                        <th className="py-2.5 px-4">이메일</th>
                        <th className="py-2.5 px-4 w-16 text-center">역할</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[#3D3434]">
                      {users.slice(0, 5).map((u, idx) => (
                        <tr key={u.id || idx} className="hover:bg-[#FDFBF7]/40">
                          <td className="py-2.5 px-4 font-semibold text-gray-600 truncate max-w-[120px]">{u.email}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              u.isAdmin ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                            }`}>
                              {u.isAdmin ? "Admin" : "User"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Users Management */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
            {/* Controller header */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-base font-extrabold text-[#3D3434]">가입 회원 명부</h2>
              
              {/* Search user */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="이메일, 닉네임 검색..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-[#E56B6F]"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              {loadingData ? (
                <div className="py-20 text-center text-xs text-gray-400 animate-pulse">데이터 로드 중...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">조회된 회원이 없습니다.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F4EB]/40 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-6 w-12 text-center">번호</th>
                      <th className="py-4 px-4">이메일 계정</th>
                      <th className="py-4 px-4 w-40">닉네임</th>
                      <th className="py-4 px-4 w-28 text-center">권한 역할</th>
                      <th className="py-4 px-6 w-48 text-center">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[#3D3434]">
                    {filteredUsers.map((u, idx) => (
                      <tr key={u.id || idx} className="hover:bg-[#FDFBF7]/30 transition-colors">
                        <td className="py-4 px-6 text-center text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-4 px-4 font-bold text-gray-700 truncate max-w-[180px]">{u.email}</td>
                        <td className="py-4 px-4 font-medium text-gray-600">{u.nickname}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.isAdmin ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-150 text-slate-600 border border-slate-200"
                          }`}>
                            {u.isAdmin ? "관리자 (Admin)" : "일반 회원 (User)"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewUserDetails(u)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            자세히 보기
                          </button>
                          <button
                            onClick={() => handleToggleAdmin(u)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            권한 변경
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: Posts Management */}
        {activeTab === "posts" && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
            {/* Controllers */}
            <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "전체" },
                  { key: "counsel", label: "연애고민" },
                  { key: "qna", label: "Q&A" },
                  { key: "general", label: "자유잡담" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setPostCategoryFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      postCategoryFilter === tab.key
                        ? "bg-[#E56B6F] text-white"
                        : "bg-[#F7F4EB] text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search posts */}
              <div className="relative w-full lg:w-72">
                <input
                  type="text"
                  placeholder="제목, 내용, 작성자 검색..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              {loadingData ? (
                <div className="py-20 text-center text-xs text-gray-400 animate-pulse">데이터 로드 중...</div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">등록된 게시글이 없습니다.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F4EB]/40 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-4 w-12 text-center">번호</th>
                      <th className="py-4 px-4 w-24 text-center">카테고리</th>
                      <th className="py-4 px-4">게시글 제목</th>
                      <th className="py-4 px-4 w-28">작성자 닉네임</th>
                      <th className="py-4 px-4 w-16 text-center">조회수</th>
                      <th className="py-4 px-4 w-40 text-center">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[#3D3434]">
                    {filteredPosts.map((post, idx) => (
                      <tr key={post.id} className="hover:bg-[#FDFBF7]/30 transition-colors">
                        <td className="py-4 px-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            post.category === "counsel"
                              ? "bg-rose-50 text-rose-500 border border-rose-100"
                              : post.category === "qna"
                              ? "bg-teal-50 text-teal-600 border border-teal-100"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}>
                            {getCategoryLabel(post.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-gray-700 max-w-[220px] truncate" title={post.title}>
                          {post.title}
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-medium">{post.nickname}</td>
                        <td className="py-4 px-4 text-center text-gray-400 font-mono">{post.views}</td>
                        <td className="py-4 px-4 text-center flex items-center justify-center gap-2">
                          <a
                            href={`/community/${post.id}`}
                            target="_blank"
                            className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] decoration-none"
                          >
                            상세 보기
                          </a>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            글 삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab: Products Management */}
        {activeTab === "products" && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden flex flex-col">
            {/* Controllers */}
            <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Category tabs */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: "전체" },
                  { key: "ticket", label: "입장 티켓" },
                  { key: "consulting", label: "맞춤 컨설팅" },
                  { key: "matching", label: "개별 매칭" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setProductCategoryFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      productCategoryFilter === tab.key
                        ? "bg-[#E56B6F] text-white"
                        : "bg-[#F7F4EB] text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search products & Add product button */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="상품명, 설명 검색..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                  />
                </div>
                <button
                  onClick={openAddProductModal}
                  className="w-full sm:w-auto bg-black hover:bg-[#E56B6F] hover:shadow-md text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>상품 등록</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-x-auto">
              {loadingData ? (
                <div className="py-20 text-center text-xs text-gray-400 animate-pulse">데이터 로드 중...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-20 text-center text-xs text-gray-400">등록된 상품이 없습니다.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F7F4EB]/40 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                      <th className="py-4 px-4 w-12 text-center">번호</th>
                      <th className="py-4 px-4 w-24">썸네일</th>
                      <th className="py-4 px-4">상품명</th>
                      <th className="py-4 px-4 w-24 text-center">카테고리</th>
                      <th className="py-4 px-4 w-28 text-right">가격 (KRW)</th>
                      <th className="py-4 px-4 w-40 text-center">관리 작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[#3D3434]">
                    {filteredProducts.map((prod, idx) => (
                      <tr key={prod.id} className="hover:bg-[#FDFBF7]/30 transition-colors">
                        <td className="py-4 px-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="w-16 h-10 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-gray-300 font-bold uppercase">No Image</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-gray-700 max-w-[200px] truncate" title={prod.title}>
                            {prod.title}
                          </div>
                          <div className="text-[10px] text-gray-400 max-w-[200px] truncate mt-0.5" title={prod.description}>
                            {prod.description}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-bold ${
                            prod.category === "ticket"
                              ? "bg-rose-50 text-rose-500 border border-rose-100"
                              : prod.category === "consulting"
                              ? "bg-teal-50 text-teal-600 border border-teal-100"
                              : "bg-amber-50 text-amber-600 border border-amber-100"
                          }`}>
                            {getProductCategoryLabel(prod.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-gray-700">
                          {prod.price.toLocaleString()}원
                        </td>
                        <td className="py-4 px-4 text-center flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditProductModal(prod)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 font-bold px-3 py-1.5 rounded-lg transition-all text-[11px] cursor-pointer"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative animate-slide-up">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold text-[#3D3434] mb-4 pb-2 border-b border-gray-100">
              회원 상세 정보
            </h3>

            <div className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-3 py-2 border-b border-gray-55">
                <span className="text-gray-400">ID</span>
                <span className="col-span-2 text-gray-700 font-mono select-all">{selectedUser.id}</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-55">
                <span className="text-gray-400">이메일 계정</span>
                <span className="col-span-2 text-gray-700 font-bold select-all">{selectedUser.email}</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-55">
                <span className="text-gray-400">닉네임</span>
                <span className="col-span-2 text-gray-700 font-bold">{selectedUser.nickname}</span>
              </div>
              <div className="grid grid-cols-3 py-2 border-b border-gray-55">
                <span className="text-gray-400">권한 역할</span>
                <span className="col-span-2">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedUser.isAdmin ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {selectedUser.isAdmin ? "관리자 (Admin)" : "일반 회원 (User)"}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-3 py-2">
                <span className="text-gray-400">가입 일시</span>
                <span className="col-span-2 text-gray-600 font-mono">
                  {selectedUser.createdAt && selectedUser.createdAt !== "로컬 스토리지"
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : "로컬 스토리지 가입"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="bg-black hover:bg-neutral-900 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 relative animate-slide-up">
            <button
              type="button"
              onClick={() => setEditingPost(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={updatingPost}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold text-[#3D3434] mb-4 pb-2 border-b border-gray-100">
              게시글 수정
            </h3>

            <form onSubmit={handleUpdatePostSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider">제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="게시글 제목을 입력하세요"
                  className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                  required
                  disabled={updatingPost}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2 uppercase tracking-wider">카테고리</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                    disabled={updatingPost}
                  >
                    <option value="general">자유잡담</option>
                    <option value="counsel">연애고민</option>
                    <option value="qna">Q&A</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 uppercase tracking-wider">작성자 닉네임</label>
                  <input
                    type="text"
                    value={editingPost.nickname}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-400 rounded-xl px-4 py-2.5 text-xs focus:outline-none cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider">내용</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="내용을 입력해 주세요"
                  rows={8}
                  className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F] font-normal leading-relaxed resize-none"
                  required
                  disabled={updatingPost}
                />
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-2 px-5 rounded-xl text-xs transition-all duration-200 cursor-pointer"
                  disabled={updatingPost}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-900 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={updatingPost}
                >
                  {updatingPost ? "수정 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 relative animate-slide-up max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeProductModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
              disabled={savingProduct}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-extrabold text-[#3D3434] mb-4 pb-2 border-b border-gray-100">
              {editingProduct ? "상품 정보 수정" : "신규 상품 등록"}
            </h3>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider">상품명</label>
                <input
                  type="text"
                  value={prodTitle}
                  onChange={(e) => setProdTitle(e.target.value)}
                  placeholder="상품 이름을 입력하세요 (예: 1:1 골드 매칭권)"
                  className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                  required
                  disabled={savingProduct}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-2 uppercase tracking-wider">카테고리</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                    disabled={savingProduct}
                  >
                    <option value="ticket">입장 티켓</option>
                    <option value="consulting">맞춤 컨설팅</option>
                    <option value="matching">개별 매칭</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-2 uppercase tracking-wider">가격 (KRW)</label>
                  <input
                    type="number"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="숫자만 입력하세요"
                    className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F]"
                    required
                    disabled={savingProduct}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider">상품 설명</label>
                <textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="상품에 대한 구체적인 설명을 입력하세요"
                  rows={4}
                  className="w-full bg-[#F7F4EB]/40 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#E56B6F] font-normal leading-relaxed resize-none"
                  required
                  disabled={savingProduct}
                />
              </div>

              {/* Drag and Drop Thumbnail Upload Zone */}
              <div>
                <label className="block text-gray-400 mb-2 uppercase tracking-wider">상품 썸네일 이미지</label>
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full min-h-[140px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all duration-200 relative ${
                    dragActive 
                      ? "border-[#E56B6F] bg-[#E56B6F]/5" 
                      : "border-gray-300 hover:border-gray-400 bg-[#F7F4EB]/20"
                  }`}
                >
                  <input
                    type="file"
                    id="product-image-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading || savingProduct}
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E56B6F] rounded-full animate-spin"></div>
                      <span className="text-[10px] text-gray-400">이미지를 업로드하고 있습니다...</span>
                    </div>
                  ) : prodImageUrl ? (
                    <div className="flex items-center gap-4 w-full">
                      <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100">
                        <img src={prodImageUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 truncate mb-1">업로드된 이미지</p>
                        <button
                          type="button"
                          onClick={() => setProdImageUrl("")}
                          className="text-rose-500 hover:underline text-[10px] font-bold"
                        >
                          이미지 제거
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label htmlFor="product-image-upload" className="flex flex-col items-center gap-2 cursor-pointer w-full text-center py-4">
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[11px] text-gray-500">
                        이미지 파일을 여기에 <span className="text-[#E56B6F] font-bold">드래그 앤 드롭</span>하거나 <span className="underline font-bold">클릭하여 선택</span>하세요.
                      </span>
                      <span className="text-[9px] text-gray-400">Netlify Blobs 스토어 및 로컬 빌드 환경 지원</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeProductModal}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-500 font-bold py-2 px-5 rounded-xl text-xs transition-all duration-200 cursor-pointer"
                  disabled={savingProduct}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-neutral-900 text-white font-bold py-2 px-5 rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
                  disabled={savingProduct || isUploading}
                >
                  {savingProduct ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
