"use client";

import React from "react";
import styles from "./VerificationPrivacy.module.css";

export default function VerificationPrivacy() {
  return (
    <section className={`${styles.section} section-padding`} id="security">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Security & Trust</span>
          <h2 className={styles.title}>안전과 프라이버시를 위한 3중 보안 장치</h2>
          <p className={styles.subtitle}>
            가명 미팅의 리스크와 프라이버시 침해 우려를 해결하기 위해 턴테이블 매치만의 엄격한 안전 보안 필터를 작동합니다.
          </p>
        </div>

        <div className={styles.grid}>
          {/* Card 1: Verification */}
          <div className={styles.card}>
            <div className={styles.iconWrapper} style={{ backgroundColor: "rgba(42, 157, 143, 0.15)", color: "var(--accent)" }}>
              🔒
            </div>
            <h3 className={styles.cardTitle}>100% 직장 신원 인증제</h3>
            <p className={styles.cardDesc}>
              대기업, 공공기관, 전문직, IT 대기업 등 신뢰할 수 있는 소속을 사원증/명함 및 본인 휴대폰 실명 확인을 통해 철저하게 사전 검증합니다. 신원 미확인자는 모임 참여가 원천 불가능합니다.
            </p>
          </div>

          {/* Card 2: AWS Lifecycle */}
          <div className={styles.card}>
            <div className={styles.iconWrapper} style={{ backgroundColor: "rgba(229, 107, 111, 0.15)", color: "var(--primary)" }}>
              ⚡
            </div>
            <h3 className={styles.cardTitle}>7일 이내 서류 자동 영구 파기</h3>
            <p className={styles.cardDesc}>
              제출하신 사원증/명함 파일은 모임 일정 매칭 완료 및 승인 처리 후 7일 이내에 스토리지 상에서 복구 불가능하도록 자동 영구 파기됩니다.
            </p>
            <div className={styles.lifecycleDisplay}>
              <div className={styles.lifecycleHeader}>AWS S3 Lifecycle Configuration</div>
              <div className={styles.lifecycleRule}>
                &lt;Rule&gt;<br />
                &nbsp;&nbsp;&lt;ID&gt;AutoDeleteAfter7Days&lt;/ID&gt;<br />
                &nbsp;&nbsp;&lt;Filter&gt;&lt;Prefix&gt;verifications/&lt;/Prefix&gt;&lt;/Filter&gt;<br />
                &nbsp;&nbsp;&lt;Expiration&gt;&lt;Days&gt;7&lt;/Days&gt;&lt;/Expiration&gt;<br />
                &lt;/Rule&gt;
              </div>
            </div>
          </div>

          {/* Card 3: Conduct Rule */}
          <div className={styles.card}>
            <div className={styles.iconWrapper} style={{ backgroundColor: "rgba(229, 107, 111, 0.15)", color: "#ffc107" }}>
              🚫
            </div>
            <h3 className={styles.cardTitle}>원스트라이크 아웃 매너 약속</h3>
            <p className={styles.cardDesc}>
              대화 중 과도한 개인정보 요구, 비매너 언행, 노쇼(No-Show) 발생 시 즉시 퇴장 조치되며, 향후 모든 턴테이블 매치 모임에서 영구 블랙리스트로 등록되어 참여가 제한됩니다.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
