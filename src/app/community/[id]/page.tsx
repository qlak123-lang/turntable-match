import React from "react";
import Link from "next/link";
import StickyHeader from "@/components/StickyHeader";
import { getPostById, getCategoryLabel, Post } from "@/utils/communityDb";
import { dbQuery, getDbPool } from "@/utils/db";
import ViewCounter from "./ViewCounter";

export const revalidate = 10; // Revalidate every 10 seconds (ISR)

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDbPost(row: any): Post {
  const date = new Date(row.created_at);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const createdAt = `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  return {
    id: row.id.toString(),
    title: row.title,
    content: row.content,
    nickname: row.nickname,
    category: row.category,
    views: row.views || 0,
    createdAt
  };
}

export async function generateStaticParams() {
  const db = getDbPool();
  if (!db) return [];
  try {
    const rows = await dbQuery('SELECT id FROM posts ORDER BY created_at DESC LIMIT 50');
    return rows.map((row) => ({ id: row.id.toString() }));
  } catch (err) {
    console.error("Failed to generate static params:", err);
    return [];
  }
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;
  const db = getDbPool();
  let post: Post | null = null;
  const intId = parseInt(id, 10);

  if (!db || isNaN(intId)) {
    post = getPostById(id);
  } else {
    try {
      const rows = await dbQuery('SELECT * FROM posts WHERE id = $1', [intId]);
      if (rows.length > 0) {
        post = formatDbPost(rows[0]);
      }
    } catch (err) {
      console.error("Failed to fetch post in Server Component, using mock fallback:", err);
      post = getPostById(id);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#3D3434] font-sans flex flex-col pt-[70px]">
      <StickyHeader />
      <ViewCounter id={id} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        {/* Navigation Bar Back Button */}
        <div className="mb-6">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#E56B6F] font-semibold transition-all group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            목록으로 돌아가기
          </Link>
        </div>

        {/* Detailed Post Card */}
        {!post ? (
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm p-8 text-center py-20">
            <p className="text-gray-400 text-sm mb-4">존재하지 않거나 삭제된 게시글입니다.</p>
            <Link
              href="/community"
              className="bg-[#E56B6F] text-white rounded-full px-5 py-2.5 text-sm font-semibold transition-all inline-block hover:bg-[#d4595d]"
            >
              목록으로
            </Link>
          </div>
        ) : (
          <article className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            {/* Post Header */}
            <div className="p-6 md:p-8 border-b border-gray-100 bg-[#F7F4EB]/30">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    post.category === "counsel"
                      ? "bg-rose-50 text-rose-500 border border-rose-100"
                      : post.category === "qna"
                      ? "bg-teal-50 text-teal-600 border border-teal-100"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}
                >
                  {getCategoryLabel(post.category)}
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#3D3434] tracking-tight leading-tight mb-4">
                {post.title}
              </h1>

              <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-bold">{post.nickname}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span className="font-mono">{post.createdAt}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>조회수</span>
                  <span className="font-mono font-bold text-gray-500">{post.views}</span>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-6 md:p-8 min-h-[300px]">
              <div className="text-gray-700 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words font-sans">
                {post.content}
              </div>
            </div>

            {/* Content Footer Disclaimer */}
            <div className="mx-6 md:mx-8 mb-6 md:mb-8 p-4 bg-[#F7F4EB]/50 rounded-2xl border border-gray-200/50 flex items-start gap-2.5">
              <span className="text-base shrink-0">💬</span>
              <p className="text-xs text-gray-500 leading-normal">
                본 라운지 게시판은 턴테이블 매치 참가 희망자들이 소통하는 익명 공간입니다. 
                비방, 비하, 스팸 또는 불법적인 만남을 조장하는 글은 약관에 의거하여 별도의 통보 없이 삭제 조치 될 수 있습니다.
              </p>
            </div>
          </article>
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
    </div>
  );
}
