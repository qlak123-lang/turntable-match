"use client";

import React, { useState, useRef, MouseEvent } from "react";
import styles from "./ConceptFeature.module.css";

interface ConceptItem {
  icon: string;
  title: string;
  desc: string;
}

const concepts: ConceptItem[] = [
  {
    icon: "🍷",
    title: "와인 소셜링 미팅",
    desc: "엄선된 프리미엄 와인 테이스팅과 함께 자연스러운 아이스브레이킹으로 서로의 라이프스타일과 취향을 교류합니다."
  },
  {
    icon: "🏮",
    title: "한옥 티 카페 소셜 미팅",
    desc: "종로 삼청동의 고즈넉하고 프라이빗한 한옥 라운지에서 고풍스럽고 편안한 무드의 티타임을 가지며 차분하게 교감합니다."
  },
  {
    icon: "🎬",
    title: "영화 & 독서 가치관 미팅",
    desc: "인생 영화와 인생 도서를 주제로 깊이 있는 대화를 나누며 취향과 일상 가치관이 닮아 있는 대상을 탐색합니다."
  },
  {
    icon: "🔮",
    title: "사주 & 타로 성향 미팅",
    desc: "사주와 타로 매칭 요소를 재미로 곁들여 서로의 연애 성향과 에너지 합을 가볍고 흥미롭게 맞추어 보는 기획 미팅입니다."
  }
];

interface ConceptFeatureProps {
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function ConceptFeature({ onTriggerLog }: ConceptFeatureProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: "50%", y: "50%" });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Position of cursor relative to card
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalized coordinates (-0.5 to 0.5)
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;
    
    // Calculate rotation angles (max 15 degrees)
    const rotateX = -normalizedY * 20;
    const rotateY = normalizedX * 20;
    
    setRotation({ x: rotateX, y: rotateY });
    setGlowPos({
      x: `${(x / rect.width) * 100}%`,
      y: `${(y / rect.height) * 100}%`
    });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    onTriggerLog("profile_card_hovered", {});
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  return (
    <section className={`${styles.section} section-padding`} id="concept">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Meeting Concepts & Profile</span>
          <h2 className={styles.title}>내면 가치와 취향을 나누는 테마 모임</h2>
          <p className={styles.subtitle}>
            외모와 조건을 나열하는 획일화된 소개팅을 넘어 서로의 일상 가치관을 공유하는 특별한 시간
          </p>
        </div>

        <div className={styles.mainLayout}>
          {/* Concept Cards */}
          <div className={styles.conceptGrid}>
            {concepts.map((item, idx) => (
              <div className={styles.conceptCard} key={idx}>
                <div className={styles.iconWrapper}>{item.icon}</div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive 3D Card Demo */}
          <div className={styles.demoColumn}>
            <div className={styles.demoInfo}>
              <h3 className={styles.demoTitle}>실물 감성 & 3D 인터랙티브 프로필 카드</h3>
              <p className={styles.demoDesc}>
                카드에 마우스를 올리거나 터치하여 회전시켜 보세요. 오프라인 현장에서 교환하는 가치관 프로필 카드를 가상으로 체험할 수 있습니다.
              </p>
            </div>

            <div className={styles.cardWrapper}>
              <div
                ref={cardRef}
                className={styles.profileCard}
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: isHovered
                    ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(1.05)`
                    : "rotateX(0deg) rotateY(0deg) scale(1)",
                  boxShadow: isHovered
                    ? "0 20px 40px rgba(61, 52, 52, 0.16)"
                    : "0 10px 30px rgba(61, 52, 52, 0.08)",
                  // Pass custom properties for radial glow placement
                  //@ts-ignore
                  "--glow-x": glowPos.x,
                  "--glow-y": glowPos.y
                }}
              >
                {/* Radial Glow Overlay */}
                <div className={styles.cardGlow} />

                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <span className={styles.profileLogo}>Turntable Match</span>
                  <span className={styles.stamp}>VERIFIED</span>
                </div>

                {/* Card Body */}
                <div className={styles.cardBody}>
                  <div className={styles.userNameRow}>
                    <span className={styles.userName}>김재혁</span>
                    <span className={styles.userAge}>31세 · 남성</span>
                  </div>
                  <div className={styles.jobBadge}>Toss · 서비스 기획자</div>

                  <div className={styles.specsList}>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>인증 정보</span>
                      <span className={styles.specVal} style={{ color: "var(--accent)" }}>사원증 인증 완료</span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>신장(키) 대역</span>
                      <span className={styles.specVal}>177cm ~ 179cm</span>
                    </div>
                    <div className={styles.specItem}>
                      <span className={styles.specLabel}>음주 / 흡연</span>
                      <span className={styles.specVal}>가끔 사회적 음주 / 비흡연</span>
                    </div>
                  </div>

                  <div className={styles.emotionSection}>
                    <span className={styles.emotionLabel}>감정 프로필 : 연애 가치관</span>
                    <p className={styles.emotionQuote}>
                      "서로의 성장과 커리어를 진심으로 응원해줄 수 있는 관계를 원해요. 주말에는 한적한 골목 카페에서 나누는 소소한 대화를 좋아합니다."
                    </p>
                  </div>
                </div>

                {/* Card Footer */}
                <div className={styles.cardFooter}>
                  <span>ID: TT-2026-0951</span>
                  <span>개인정보 암호화 보호</span>
                </div>
              </div>
            </div>
            
            <span className={styles.cardHint}>💡 마우스를 올려 카드를 이리저리 기울여보세요!</span>
          </div>
        </div>
      </div>
    </section>
  );
}
