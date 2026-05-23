"use client";

import { useEffect } from "react";

interface ViewCounterProps {
  id: string;
}

export default function ViewCounter({ id }: ViewCounterProps) {
  useEffect(() => {
    if (!id) return;
    
    // Increment view count in background on client mount
    async function incrementPostView() {
      try {
        await fetch(`/api/posts/${id}/view`, {
          method: "POST"
        });
      } catch (err) {
        console.error("Failed to increment view count on client side:", err);
      }
    }
    
    incrementPostView();
  }, [id]);

  return null;
}
