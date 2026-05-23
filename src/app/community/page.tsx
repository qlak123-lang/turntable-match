import React from "react";
import { dbQuery, getDbPool } from "@/utils/db";
import { getPosts, Post } from "@/utils/communityDb";
import CommunityClient from "./CommunityClient";

export const revalidate = 10; // ISR revalidation interval in seconds

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

export default async function CommunityPage() {
  const db = getDbPool();
  let initialPosts: Post[] = [];
  let isFallbackDb = false;

  if (!db) {
    initialPosts = getPosts();
    isFallbackDb = true;
  } else {
    try {
      const rows = await dbQuery('SELECT * FROM posts ORDER BY created_at DESC');
      initialPosts = rows.map(formatDbPost);
    } catch (err) {
      console.error("Failed to fetch posts from database in Server Component, using mock fallback:", err);
      initialPosts = getPosts();
      isFallbackDb = true;
    }
  }

  return (
    <CommunityClient initialPosts={initialPosts} isDbFallback={isFallbackDb} />
  );
}
