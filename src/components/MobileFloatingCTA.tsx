"use client";

import React, { useState, useEffect } from "react";
import styles from "./MobileFloatingCTA.module.css";

interface MobileFloatingCTAProps {
  onScrollToBooking: () => void;
  abGroup: "A" | "B";
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function MobileFloatingCTA({ onScrollToBooking, abGroup, onTriggerLog }: MobileFloatingCTAProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = 500;
      if (window.scrollY > heroHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCtaClick = () => {
    onTriggerLog("floating_cta_clicked", { abGroup });
    onScrollToBooking();
  };

  const text = abGroup === "A" 
    ? "🔥 이번주 토요일 마감 임박 모임 신청하기" 
    : "⚡ 실시간 성비 매칭 완료된 모임 자리 확보하기";

  return (
    <div className={`${styles.floatingBar} ${isVisible ? styles.visible : ""}`}>
      <div className={styles.infoCol}>
        <div className={styles.pulseDot} />
        <span className={styles.text}>{text}</span>
      </div>
      <button className={styles.ctaBtn} onClick={handleCtaClick}>
        실시간 예약하기
      </button>
    </div>
  );
}
