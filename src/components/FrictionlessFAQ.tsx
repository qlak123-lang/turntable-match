"use client";

import React, { useState } from "react";
import styles from "./FrictionlessFAQ.module.css";

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "처음 참여하는데 분위기가 어색하진 않을까요?",
    answer: "모든 테이블에 전문 호스트가 상주하며 자연스러운 아이스브레이킹 대화를 리드해 드립니다. 또한 사전 제공되는 '감정 프로필'과 밸런스 게임 카드를 통해 취향이나 연애관 같은 확실한 공통 대화 주제가 확보되므로 어색함 없이 유쾌하게 대화를 이끌어가실 수 있습니다."
  },
  {
    question: "신원 인증 및 재직 검증은 정확히 어떻게 진행되나요?",
    answer: "가입 단계에서 입력하신 이름, 생년월일 정보와 휴대폰 본인인증 정보를 일치시킨 후, 제출해주신 사원증 혹은 직장 명함 이미지를 매칭 전담 운영팀이 수동으로 최종 교차 검증합니다. 허위 기재나 도용 의심 시 즉각 반려 처리되며 참여 권한이 부여되지 않습니다."
  },
  {
    question: "제출한 사원증 사진이나 개인정보가 노출될 우려가 있나요?",
    answer: "개인 정보 유출은 철저히 방지됩니다. 업로드된 사원증/명함 이미지는 직장 승인 인증 검증이 완료되거나 신청 모임 일정이 완료된 후 7일 이내에 스토리지 상에서 복구 불가능하도록 자동 휘발 파기됩니다. 또한 현장 매뉴얼상 외부 시선이 차단된 프라이빗 골목 공간에서 모임이 진행되며, 참가자간의 상세 연락처는 상호 호감이 일치할 때 당일 자정에만 안전하게 오픈됩니다."
  },
  {
    question: "갑작스러운 노쇼(No-Show)로 성비가 안 맞으면 어떻게 되나요?",
    answer: "턴테이블 매치는 남녀 10:10 비율 맞춤 매칭을 최우선 원칙으로 합니다. 불성실한 노쇼를 예방하기 위해 예약금 제도가 운영되며 무단 노쇼 시 강력한 원스트라이크 아웃 규정이 적용되어 영구 참가 배제 조치됩니다. 긴급 상황으로 성비 불균형 발생 시 즉각 대기 인원 예약 풀이 매칭 호출되며, 최소 비율(8:8) 미달 시 모임은 연기 및 전액 즉시 환불 처리됩니다."
  },
  {
    question: "모임 참가 시 복장(드레스코드) 제한이 있나요?",
    answer: "신뢰할 수 있고 깔끔한 소개팅 분위기를 연출하기 위해 비즈니스 캐주얼 또는 깔끔한 댄디/페미닌 룩을 기본 권장 드립니다. 지나치게 편안한 홈웨어, 트레이닝복, 모자 착용 또는 위생 불량 시 현장 호스트의 재량으로 참가가 제한될 수 있으며 이 경우 예약 환불은 불가합니다."
  },
  {
    question: "환불 규정은 어떻게 되나요?",
    answer: "확정된 성비 비율 유지를 위해 환불 규정은 엄격히 적용됩니다. 모임 5일 전 취소 시 100% 환불, 3일 전 취소 시 50% 환불이 가능하며, 모임 2일 전부터는 매칭 정원 균형 유지를 위해 환불이 불가능합니다. 신중한 예약을 부탁드립니다."
  }
];

interface FrictionlessFAQProps {
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function FrictionlessFAQ({ onTriggerLog }: FrictionlessFAQProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    const isOpening = activeIndex !== index;
    setActiveIndex(isOpening ? index : null);
    onTriggerLog("faq_toggled", { question: faqs[index].question, action: isOpening ? "open" : "close" });
  };

  return (
    <section className={`${styles.section} section-padding`} id="faq">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Frictionless FAQ</span>
          <h2 className={styles.title}>자주 묻는 질문</h2>
          <p className={styles.subtitle}>
            마지막 의사결정을 가로막는 회의론적인 의문과 불안 요소를 미리 확인해 드립니다.
          </p>
        </div>

        <div className={styles.faqContainer}>
          {faqs.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <div 
                key={idx} 
                className={`${styles.faqItem} ${isActive ? styles.faqItemActive : ""}`}
              >
                <button 
                  className={styles.questionHeader} 
                  onClick={() => toggleFAQ(idx)}
                >
                  <span>Q. {item.question}</span>
                  <span className={`${styles.arrow} ${isActive ? styles.arrowActive : ""}`}>▼</span>
                </button>
                <div className={`${styles.answerPanel} ${isActive ? styles.answerPanelActive : ""}`}>
                  <div className={styles.answerContent}>
                    {item.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
