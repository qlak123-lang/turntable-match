"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import StickyHeader from "@/components/StickyHeader";
import { getPosts, addPost, getCategoryLabel, Post } from "@/utils/communityDb";

type CategoryFilter = "all" | Post["category"];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // Form State
  const [writeNickname, setWriteNickname] = useState("");
  const [writeTitle, setWriteTitle] = useState("");
  const [writeCategory, setWriteCategory] = useState<Post["category"]>("counsel");
  const [writeContent, setWriteContent] = useState("");
  const [formError, setFormError] = useState("");

  // Load posts from localStorage on mount
  useEffect(() => {
    setPosts(getPosts());
  }, []);

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = category === "all" || post.category === category;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.nickname.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination Variables
  const postsPerPage = 20;
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  
  // Adjust current page if it exceeds total pages after filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [category, searchQuery, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  // Pagination chunk logic (1-10, 11-20 pages)
  const pageChunkSize = 10;
  const currentChunk = Math.floor((currentPage - 1) / pageChunkSize);
  const startPage = currentChunk * pageChunkSize + 1;
  const endPage = Math.min(startPage + pageChunkSize - 1, totalPages);

  const handlePrevRange = () => {
    if (currentChunk > 0) {
      setCurrentPage(startPage - 1);
    }
  };

  const handleNextRange = () => {
    if (endPage < totalPages) {
      setCurrentPage(startPage + pageChunkSize);
    }
  };

  // Submit Post
  const handleWriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeNickname.trim()) {
      setFormError("닉네임을 입력해 주세요.");
      return;
    }
    if (!writeTitle.trim()) {
      setFormError("제목을 입력해 주세요.");
      return;
    }
    if (!writeContent.trim()) {
      setFormError("내용을 입력해 주세요.");
      return;
    }

    const newPost = addPost(writeTitle, writeContent, writeNickname, writeCategory);
    setPosts([newPost, ...posts]);
    
    // Reset form
    setWriteNickname("");
    setWriteTitle("");
    setWriteCategory("counsel");
    setWriteContent("");
    setFormError("");
    setIsWriteModalOpen(false);
    setCurrentPage(1); // Go to first page to see the new post
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D3434] font-sans flex flex-col pt-[70px]">
      <StickyHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-[#F7F4EB] to-[#FDFBF7] border-b border-gray-200/60 py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <span className="text-[#E56B6F] font-serif italic text-lg md:text-xl block mb-2">Turntable Lounge</span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#3D3434] mb-3">
            턴테이블 라운지 익명 고민 게시판
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            매칭 전 설렘과 고민, 직장인 미팅 꿀팁을 익명으로 자유롭게 나누어보세요.<br />
            누구나 가입 없이 익명으로 글을 작성하고 이야기를 나눌 수 있습니다.
          </p>
        </div>
      </section>

      {/* Main Board Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        
        {/* Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-100 md:border-none pb-2 md:pb-0">
            {[
              { key: "all", label: "전체" },
              { key: "counsel", label: "연애고민" },
              { key: "qna", label: "Q&A" },
              { key: "general", label: "자유잡담" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setCategory(tab.key as CategoryFilter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  category === tab.key
                    ? "bg-[#E56B6F] text-white shadow-md shadow-[#E56B6F]/20"
                    : "bg-[#F7F4EB] text-gray-500 hover:bg-gray-200/50 hover:text-[#3D3434]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Write Button */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="제목, 내용, 작성자 검색..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#F7F4EB] border border-gray-200 rounded-full px-5 py-2 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
              />
            </div>
            
            {/* Write Button */}
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="bg-[#3D3434] hover:bg-[#E56B6F] text-white rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg shadow-[#3D3434]/10 hover:shadow-[#E56B6F]/20 flex items-center gap-1.5 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              글쓰기
            </button>
          </div>
        </div>

        {/* Post List */}
        <div className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden shadow-sm">
          {paginatedPosts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-400 text-sm">등록된 게시글이 없습니다. 첫 글을 작성해 보세요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-[#F7F4EB]/50 border-b border-gray-200/80 text-[13px] font-semibold text-gray-500">
                    <th className="py-4 px-6 w-20 text-center">번호</th>
                    <th className="py-4 px-4 w-28 text-center">카테고리</th>
                    <th className="py-4 px-4">제목</th>
                    <th className="py-4 px-4 w-32">작성자</th>
                    <th className="py-4 px-4 w-40 text-center">작성일</th>
                    <th className="py-4 px-6 w-20 text-center">조회수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-[#3D3434]">
                  {paginatedPosts.map((post, idx) => {
                    const postNumber = filteredPosts.length - (startIndex + idx);
                    return (
                      <tr key={post.id} className="hover:bg-[#FDFBF7]/60 transition-colors group">
                        <td className="py-4 px-6 text-center text-gray-400 text-xs font-mono">{postNumber}</td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              post.category === "counsel"
                                ? "bg-rose-50 text-rose-500 border border-rose-100"
                                : post.category === "qna"
                                ? "bg-teal-50 text-teal-600 border border-teal-100"
                                : "bg-gray-100 text-gray-600 border border-gray-200/60"
                            }`}
                          >
                            {getCategoryLabel(post.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium max-w-sm truncate">
                          <Link href={`/community/${post.id}`} className="hover:text-[#E56B6F] group-hover:translate-x-0.5 transition-transform inline-block w-full">
                            {post.title}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-medium">{post.nickname}</td>
                        <td className="py-4 px-4 text-center text-gray-400 text-xs font-mono">{post.createdAt}</td>
                        <td className="py-4 px-6 text-center text-gray-400 font-mono text-xs">{post.views}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-10">
            {/* Prev Range Button */}
            <button
              onClick={handlePrevRange}
              disabled={currentChunk === 0}
              className={`p-2.5 rounded-full text-sm font-semibold transition-all ${
                currentChunk === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#3D3434] hover:bg-gray-100 hover:text-[#E56B6F]"
              }`}
              title="이전 10페이지"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M17 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Prev One Page Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2.5 rounded-full text-sm font-semibold transition-all ${
                currentPage === 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#3D3434] hover:bg-gray-100 hover:text-[#E56B6F]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
              const pageNumber = startPage + index;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                    currentPage === pageNumber
                      ? "bg-[#E56B6F] text-white shadow-md shadow-[#E56B6F]/20"
                      : "text-gray-500 hover:bg-gray-100 hover:text-[#3D3434]"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next One Page Button */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2.5 rounded-full text-sm font-semibold transition-all ${
                currentPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#3D3434] hover:bg-gray-100 hover:text-[#E56B6F]"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Next Range Button */}
            <button
              onClick={handleNextRange}
              disabled={endPage === totalPages}
              className={`p-2.5 rounded-full text-sm font-semibold transition-all ${
                endPage === totalPages
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-[#3D3434] hover:bg-gray-100 hover:text-[#E56B6F]"
              }`}
              title="다음 10페이지"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#3D3434] text-white/40 py-12 px-6 text-center text-xs border-t border-white/5">
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

      {/* Write Post Modal */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-[#3D3434]/40 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in">
          <div className="bg-[#FDFBF7] rounded-3xl w-full max-w-lg border border-gray-200/80 shadow-2xl p-6 md:p-8 animate-slide-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-xl font-bold text-[#3D3434]">새 게시글 작성</h2>
              <button
                onClick={() => {
                  setIsWriteModalOpen(false);
                  setFormError("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleWriteSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-500 border border-red-100 rounded-xl px-4 py-2.5 text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  닉네임
                </label>
                <input
                  type="text"
                  placeholder="익명의 턴테이블"
                  value={writeNickname}
                  onChange={(e) => setWriteNickname(e.target.value)}
                  className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
                  maxLength={15}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    카테고리
                  </label>
                  <select
                    value={writeCategory}
                    onChange={(e) => setWriteCategory(e.target.value as Post["category"])}
                    className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all appearance-none cursor-pointer"
                  >
                    <option value="counsel">연애고민</option>
                    <option value="qna">Q&A</option>
                    <option value="general">자유잡담</option>
                  </select>
                  {/* Decorative dropdown arrow */}
                  <div className="absolute right-3 top-[34px] pointer-events-none text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  placeholder="제목을 입력해 주세요"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all"
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  내용
                </label>
                <textarea
                  placeholder="대화 에티켓을 준수하여 따뜻하고 존중하는 글을 남겨주세요."
                  rows={6}
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  className="w-full bg-[#F7F4EB] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E56B6F] focus:ring-1 focus:ring-[#E56B6F] transition-all resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsWriteModalOpen(false);
                    setFormError("");
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#3D3434] rounded-xl py-3 text-sm font-semibold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#E56B6F] hover:bg-[#d4595d] text-white rounded-xl py-3 text-sm font-semibold transition-all shadow-md shadow-[#E56B6F]/20"
                >
                  등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
