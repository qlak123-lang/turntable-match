"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

interface HeroProps {
  onScrollToBooking: () => void;
  abGroup: "A" | "B";
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function Hero({ onScrollToBooking, abGroup, onTriggerLog }: HeroProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    onTriggerLog("hero_mounted", { abGroup });
  }, [abGroup, onTriggerLog]);

  const handleCtaClick = (buttonText: string) => {
    onTriggerLog("hero_cta_clicked", { abGroup, buttonText });
    onScrollToBooking();
  };

  const handleSecondaryClick = () => {
    onTriggerLog("hero_guide_clicked", { abGroup });
    const target = document.getElementById("simulator");
    if (target) {
      const headerOffset = 70;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Render static defaults on SSR to prevent hydration mismatch, then switch on client mount
  const headline =
    !isMounted || abGroup === "A" ? (
      <>
        단 2시간, 선별된 <em>10명의 이성</em>과<br />
        나누는 깊이 있는 일대일 대화
      </>
    ) : (
      <>
        신원 보증 직장인 솔로 미팅,<br />
        <em>턴테이블 매치</em>에서 안전하게
      </>
    );

  const ctaText =
    !isMounted || abGroup === "A" ? "지금 신청하기" : "실시간 성비 맞춤 자리 확인하기";

  return (
    <section className={styles.hero}>
      <div className={styles.bgOverlay}>
        <Image
          src="/cozy_lounge.png"
          alt="Warm elegant private alley lounge for blind dates"
          fill
          priority
          className={styles.bgImage}
          sizes="100vw"
        />
        <div className={styles.gradient}></div>
      </div>

      <div className={styles.container}>
        <div className={styles.badgeRow}>
          <span className={`${styles.badge} ${styles.badgeGreen}`}>
            ✓ 서울권 유일 결혼중개업 정식 등록
          </span>
          <span className={styles.badge}>누적 참가자 45,000명+</span>
          <span className={styles.badge}>평균 매칭률 40%</span>
        </div>

        <h1 className={styles.headline}>{headline}</h1>

        <p className={styles.subcopy}>
          가벼운 만남 어플에 지치셨나요? 무거운 결혼정보회사는 부담스러우신가요?<br />
          사원증/명함 신원 인증을 완료한 신뢰할 수 있는 2030 직장인들과<br />
          외부 시선이 차단된 프라이빗 라운지에서 자연스럽게 대화해보세요.
        </p>

        <div className={styles.ctaRow}>
          <button className={styles.primaryCta} onClick={() => handleCtaClick(ctaText)}>
            {ctaText}
          </button>
          <button className={styles.secondaryCta} onClick={handleSecondaryClick}>
            1분 대화 시뮬레이터 체험
          </button>
        </div>

        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statVal}>45,000+</span>
            <span className={styles.statLabel}>누적 참가자 수</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>320+</span>
            <span className={styles.statLabel}>누적 성혼 커플 수</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statVal}>40%</span>
            <span className={styles.statLabel}>10대10 미팅 매칭 성공률</span>
          </div>
        </div>
      </div>
    </section>
  );
}
