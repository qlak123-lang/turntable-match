"use client";

import React, { useState } from "react";
import styles from "./SocialProof.module.css";

interface Review {
  name: string;
  ageGender: string;
  companyType: string;
  verifyText: string;
  date: string;
  chats: { sender: "left" | "right"; text: string }[];
}

const mockReviews: Review[] = [
  {
    name: "박민경",
    ageGender: "29세 여성",
    companyType: "대학병원 간호사",
    verifyText: "재직증명서 신원 인증 완료",
    date: "2026.04.18 참여",
    chats: [
      { sender: "left", text: "민경님 어제 턴테이블 소개팅 어떠셨어요? 피곤하진 않으셨구요?ㅠㅠ" },
      { sender: "right", text: "아 아뇨!! 진짜 너무 좋았어요!! 처음에는 엄청 어색할 줄 알았는데 라운지가 조용하고 아늑한 골목에 있어서 행인들이랑 마주칠 일이 없으니까 심적으로 진짜 편하더라고요ㅎㅎ" },
      { sender: "right", text: "그리고 10분마다 남성분들 로테이션할 때 호스트분이 정중하게 리드해주셔서 어색한 타이밍 전혀 없었어요! 어제 매칭된 분이랑 오늘 퇴근하고 연락하기로 했어요!! 대박ㅠㅠㅠ" }
    ]
  },
  {
    name: "이동혁",
    ageGender: "32세 남성",
    companyType: "네이버 개발자",
    verifyText: "사원증 신원 인증 완료",
    date: "2026.05.02 참여",
    chats: [
      { sender: "left", text: "동혁님 어제 매칭 성공 축하드립니다! 연락은 잘 되시나요?" },
      { sender: "right", text: "네! 감사합니다! 사실 소개팅 어플이나 결정사는 좀 내키지 않아서 시간 낭비 없이 검증된 분들 만나려고 참가했거든요." },
      { sender: "right", text: "한 번 참가해서 대기업, 공공기관 분들 10명이랑 일대일 대화 나눌 수 있어서 너무 합리적이었고요, 가치관 프로필 카드가 미리 제공되니까 대화 소재 찾기도 엄청 쉬웠네요. 강추합니다 진짜." }
    ]
  },
  {
    name: "김소희",
    ageGender: "30세 여성",
    companyType: "외국계 기업 마케터",
    verifyText: "사원증 신원 인증 완료",
    date: "2026.05.10 참여",
    chats: [
      { sender: "left", text: "소희님 턴테이블 매치 참가 소감 여쭤봐도 될까요? :) " },
      { sender: "right", text: "네네!! 예전에 대로변 카페 미팅 갔을 때 밖에서 다 쳐다봐서 창피했던 기억이 있었는데... 여긴 골목 안쪽 프라이빗 라운지여서 너무 안전하다는 느낌을 받았어요!" },
      { sender: "right", text: "특히 감정프로필 미리 작성해서 대화 주제 겹치게 해주는 거랑, 앉아있느라 키를 알기 힘든 단점을 보완해서 프로필 카드에 범위형 키가 미리 적혀있던 디테일이 진짜 대박이었던 것 같아요ㅋㅋ" }
    ]
  }
];

const mockMarriageStories = [
  {
    tag: "누적 성혼 118호",
    couple: "남 32세(SK텔레콤) ♡ 여 30세(공립 초등교사)",
    text: "턴테이블 매치 24년 2월 모임에서 만나 올해 5월에 결혼합니다. 가벼운 만남 어플과는 시작점부터 신뢰의 깊이가 달랐습니다.",
    date: "2026.05 결혼"
  },
  {
    tag: "누적 성혼 204호",
    couple: "남 34세(삼성전자) ♡ 여 31세(종합병원 약사)",
    text: "직무와 나이대 필터링 덕분에 대화가 너무 잘 통했어요. 10분이라는 시간이 서로의 끌림을 느끼기에 충분했습니다.",
    date: "2026.03 결혼"
  },
  {
    tag: "누적 성혼 322호",
    couple: "남 31세(현대자동차) ♡ 여 29세(IT 스타트업 디자이너)",
    text: "지인 추천으로 호기심에 참가했는데 평생의 동반자를 만났네요. 가치관 밸런스 게임 카드가 서로의 결혼관을 맞추는 첫 열쇠였습니다.",
    date: "2026.05 결혼"
  }
];

interface SocialProofProps {
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function SocialProof({ onTriggerLog }: SocialProofProps) {
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);

  const handleNext = () => {
    const nextIdx = (activeReviewIdx + 1) % mockReviews.length;
    setActiveReviewIdx(nextIdx);
    onTriggerLog("review_carousel_next", { index: nextIdx });
  };

  const handlePrev = () => {
    const prevIdx = (activeReviewIdx - 1 + mockReviews.length) % mockReviews.length;
    setActiveReviewIdx(prevIdx);
    onTriggerLog("review_carousel_prev", { index: prevIdx });
  };

  const currentReview = mockReviews[activeReviewIdx];

  return (
    <section className={`${styles.section} section-padding`} id="social-proof">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Social Proof</span>
          <h2 className={styles.title}>참가자들이 증명하는 신뢰와 성과</h2>
          <p className={styles.subtitle}>
            소중한 시간과 비용을 낭비하지 마세요. 실제 참가자들이 입증한 검증된 데이터입니다.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Reviews Carousel */}
          <div className={styles.carouselContainer}>
            <div className={styles.carouselHeader}>
              <div className={styles.carouselTitle}>
                <span className={styles.kakaoBadge}>KakaoTalk</span>
                <span>실제 참가자 리얼 톡후기</span>
              </div>
              <div className={styles.carouselControls}>
                <button className={styles.controlBtn} onClick={handlePrev} aria-label="이전 후기">
                  ←
                </button>
                <button className={styles.controlBtn} onClick={handleNext} aria-label="다음 후기">
                  →
                </button>
              </div>
            </div>

            <div className={styles.reviewContent}>
              <div className={styles.chatBubbleList}>
                {currentReview.chats.map((chat, idx) => (
                  <div
                    key={idx}
                    className={`${styles.chatBubble} ${
                      chat.sender === "left" ? styles.chatLeft : styles.chatRight
                    }`}
                  >
                    {chat.text}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.chatMeta}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {currentReview.name} ({currentReview.ageGender})
                </span>
                <span className={styles.userVerify}>✓ {currentReview.companyType} · {currentReview.verifyText}</span>
              </div>
              <span className={styles.reviewDate}>{currentReview.date}</span>
            </div>
          </div>

          {/* Referral Stat Card */}
          <div className={styles.statCard}>
            <div className={styles.radialProgress}>
              <div className={styles.radialText}>
                <span className={styles.radialPercent}>65%</span>
                <span className={styles.radialLabel}>지인추천</span>
              </div>
            </div>
            <h3 className={styles.statCardTitle}>지인 추천 참여율 65%</h3>
            <p className={styles.statCardDesc}>
              턴테이블 매치는 자극적인 유료 마케팅 비용을 최소화하고, 실제 만족한 참가자들의 입소문과 추천을 통해 매주 모임 정원을 조기 마감하고 있습니다.
            </p>
          </div>
        </div>

        {/* Marriage success cards */}
        <div className={styles.marriageSection}>
          <div className={styles.marriageHeader}>
            <h3 className={styles.marriageTitle}>320쌍이 넘는 커플들이 약속한 결실</h3>
            <div>
              <span>누적 성혼 커플 </span>
              <span className={styles.marriageCount}>320쌍 돌파</span>
            </div>
          </div>

          <div className={styles.marriageGrid}>
            {mockMarriageStories.map((story, index) => (
              <div className={styles.marriageCard} key={index}>
                <div className={styles.marriageCardHeader}>
                  <span className={styles.marriageTag}>{story.tag}</span>
                  <span className={styles.marriageDate}>{story.date}</span>
                </div>
                <span className={styles.marriageCouple}>{story.couple}</span>
                <p className={styles.marriageText}>{story.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
