"use client";

import React, { useState } from "react";
import styles from "./BookingSection.module.css";

export interface ScheduleSession {
  id: string;
  date: string;
  time: string;
  location: string;
  ageGroupLabel: string;
  ageGroupId: string; // "young" | "mid" | "classic"
  maleCount: number; // Max 10
  femaleCount: number; // Max 10
  maleLimitText?: string;
  femaleLimitText?: string;
}

const mockSessions: ScheduleSession[] = [
  {
    id: "s1",
    date: "5월 30일 (토)",
    time: "16:00 ~ 19:00 (3시간)",
    location: "삼청동 턴테이블 골목 전용 라운지",
    ageGroupLabel: "남성 90~96년생 · 여성 92~98년생",
    ageGroupId: "mid",
    maleCount: 9,
    femaleCount: 8,
    maleLimitText: "남성 마감 임박 (1석 남음)",
    femaleLimitText: "여성 2석 남음"
  },
  {
    id: "s2",
    date: "5월 31일 (일)",
    time: "14:00 ~ 17:00 (3시간)",
    location: "삼청동 턴테이블 골목 전용 라운지",
    ageGroupLabel: "남성 90~96년생 · 여성 92~98년생",
    ageGroupId: "mid",
    maleCount: 7,
    femaleCount: 9,
    femaleLimitText: "여성 마감 임박 (1석 남음)"
  },
  {
    id: "s3",
    date: "6월 06일 (토)",
    time: "17:00 ~ 20:00 (3시간)",
    location: "강남 삼성동 골목 프라이빗 라운지",
    ageGroupLabel: "남성 88~94년생 · 여성 90~96년생",
    ageGroupId: "classic",
    maleCount: 10,
    femaleCount: 6,
    maleLimitText: "남성 마감 완료",
    femaleLimitText: "여성 4석 남음"
  },
  {
    id: "s4",
    date: "6월 07일 (일)",
    time: "15:00 ~ 18:00 (3시간)",
    location: "삼청동 턴테이블 골목 전용 라운지",
    ageGroupLabel: "남성 94~00년생 · 여성 96~02년생",
    ageGroupId: "young",
    maleCount: 8,
    femaleCount: 9,
    femaleLimitText: "여성 마감 임박 (1석 남음)"
  },
  {
    id: "s5",
    date: "6월 13일 (토)",
    time: "16:00 ~ 19:00 (3시간)",
    location: "강남 삼성동 골목 프라이빗 라운지",
    ageGroupLabel: "남성 90~96년생 · 여성 92~98년생",
    ageGroupId: "mid",
    maleCount: 5,
    femaleCount: 6
  },
  {
    id: "s6",
    date: "6월 14일 (일)",
    time: "14:00 ~ 17:00 (3시간)",
    location: "삼청동 턴테이블 골목 전용 라운지",
    ageGroupLabel: "남성 88~94년생 · 여성 90~96년생",
    ageGroupId: "classic",
    maleCount: 4,
    femaleCount: 5
  }
];

interface BookingSectionProps {
  onBookClick: (session: ScheduleSession) => void;
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function BookingSection({ onBookClick, onTriggerLog }: BookingSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [fadeState, setFadeState] = useState<boolean>(true);

  const handleFilterChange = (filterId: string) => {
    onTriggerLog("booking_filter_changed", { oldFilter: activeFilter, newFilter: filterId });
    setFadeState(false);
    
    // 300ms fade transition
    setTimeout(() => {
      setActiveFilter(filterId);
      setFadeState(true);
    }, 300);
  };

  const filteredSessions = activeFilter === "all"
    ? mockSessions
    : mockSessions.filter(s => s.ageGroupId === activeFilter);

  return (
    <section className={`${styles.section} section-padding`} id="booking">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Schedule & Booking</span>
          <h2 className={styles.title}>오프라인 소개팅 매칭 일정표</h2>
          <p className={styles.subtitle}>
            본인의 연령 대역에 부합하는 일정을 선택해 주세요. 성비 10:10 매칭 원칙에 따라 철저히 관리됩니다.
          </p>
        </div>

        {/* Filters */}
        <div className={styles.filterRow}>
          {[
            { id: "all", label: "전체 보기" },
            { id: "young", label: "20대 중후반 (94~00년생)" },
            { id: "mid", label: "20대 후반~30대 초반 (90~96년생)" },
            { id: "classic", label: "30대 초중반 (88~94년생)" }
          ].map(tab => (
            <button
              key={tab.id}
              className={`${styles.filterBtn} ${activeFilter === tab.id ? styles.filterBtnActive : ""}`}
              onClick={() => handleFilterChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Schedule grid */}
        <div 
          className={`${styles.grid} fade-transition`} 
          style={{ opacity: fadeState ? 1 : 0, transform: fadeState ? "translateY(0)" : "translateY(10px)" }}
        >
          {filteredSessions.map(session => {
            const malePercent = (session.maleCount / 10) * 100;
            const femalePercent = (session.femaleCount / 10) * 100;

            return (
              <div className={styles.scheduleCard} key={session.id}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.dateBlock}>
                      <span className={styles.dateStr}>{session.date}</span>
                      <span className={styles.timeStr}>{session.time}</span>
                    </div>
                    <span className={styles.locationBadge}>{session.location.split(" ")[0]}</span>
                  </div>

                  <span className={styles.ageLimit}>{session.ageGroupLabel}</span>

                  {/* Gender ratio indicators */}
                  <div className={styles.ratioSection}>
                    <div className={styles.ratioHeader}>
                      <span>성비 모집 현황 ({session.maleCount + session.femaleCount}/20명)</span>
                      <div className={styles.ratioLabels}>
                        {session.maleLimitText && (
                          <span className={styles.pulseRed}>
                            <span className={styles.pulseDotRed} />
                            {session.maleLimitText}
                          </span>
                        )}
                        {session.femaleLimitText && (
                          <span className={styles.pulseGreen}>
                            <span className={styles.pulseDotGreen} />
                            {session.femaleLimitText}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.gaugeBar}>
                      <div className={styles.gaugeMale} style={{ width: `${malePercent / 2}%` }} />
                      <div className={styles.gaugeFemale} style={{ width: `${femalePercent / 2}%` }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "rgba(61,52,52,0.4)", marginTop: "4px" }}>
                      <span>남성 ({session.maleCount}/10)</span>
                      <span>여성 ({session.femaleCount}/10)</span>
                    </div>
                  </div>
                </div>

                <button className={styles.bookBtn} onClick={() => onBookClick(session)}>
                  신청 및 신원 인증하기
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
