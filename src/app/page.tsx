"use client";

import React, { useState, useEffect, useCallback } from "react";
import StickyHeader from "@/components/StickyHeader";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ConceptFeature from "@/components/ConceptFeature";
import InteractiveSim from "@/components/InteractiveSim";
import BookingSection, { ScheduleSession } from "@/components/BookingSection";
import BookingModal from "@/components/BookingModal";
import VerificationPrivacy from "@/components/VerificationPrivacy";
import FrictionlessFAQ from "@/components/FrictionlessFAQ";
import MobileFloatingCTA from "@/components/MobileFloatingCTA";
import LogConsole, { LogEntry } from "@/components/LogConsole";

export default function Home() {
  const [abGroup, setAbGroup] = useState<"A" | "B">("A");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
  const [triggeredScrolls, setTriggeredScrolls] = useState<Record<number, boolean>>({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  // Randomly assign A/B test group on mount
  useEffect(() => {
    const randomGroup = Math.random() > 0.5 ? "A" : "B";
    setAbGroup(randomGroup);
  }, []);

  // Standard logging callback
  const triggerLog = useCallback((eventName: string, params: Record<string, any> = {}) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    setLogs((prev) => [
      ...prev,
      {
        timestamp: timeStr,
        eventName,
        params,
      },
    ]);
  }, []);

  // Track scroll depth benchmarks
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      // Check benchmarks
      const benchmarks = [25, 50, 75, 100];
      benchmarks.forEach((mark) => {
        if (scrollPercent >= mark && !triggeredScrolls[mark]) {
          setTriggeredScrolls((prev) => ({ ...prev, [mark]: true }));
          triggerLog(`scroll_depth_reached_${mark}`, { scrollPercent: `${scrollPercent}%` });
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [triggeredScrolls, triggerLog]);

  const handleSwitchAbGroup = () => {
    const nextGroup = abGroup === "A" ? "B" : "A";
    setAbGroup(nextGroup);
    // Reset triggered scrolls to allow testing scroll logs again
    setTriggeredScrolls({
      25: false,
      50: false,
      75: false,
      100: false,
    });
    triggerLog("ab_group_switched", { to: nextGroup });
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const scrollToBooking = () => {
    const bookingSection = document.getElementById("booking");
    if (bookingSection) {
      const headerOffset = 70;
      const elementPosition = bookingSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      triggerLog("scroll_to_booking_clicked", {});
    }
  };

  const handleBookClick = (session: ScheduleSession) => {
    setSelectedSession(session);
    setIsModalOpen(true);
    triggerLog("booking_modal_opened", { sessionId: session.id, date: session.date });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Sticky Header */}
      <StickyHeader onScrollToBooking={scrollToBooking} />

      {/* Main Sections */}
      <main style={{ flex: 1, paddingBottom: "70px" }}>
        {/* Hero Section */}
        <Hero
          onScrollToBooking={scrollToBooking}
          abGroup={abGroup}
          onTriggerLog={triggerLog}
        />

        {/* Social Proof Section */}
        <SocialProof onTriggerLog={triggerLog} />

        {/* Concept and 3D Card Feature */}
        <ConceptFeature onTriggerLog={triggerLog} />

        {/* Interactive Meeting Simulator */}
        <InteractiveSim onTriggerLog={triggerLog} />

        {/* Security & Verification Notice */}
        <VerificationPrivacy />

        {/* Booking Calendar Schedule */}
        <BookingSection onBookClick={handleBookClick} onTriggerLog={triggerLog} />

        {/* Frictionless FAQ */}
        <FrictionlessFAQ onTriggerLog={triggerLog} />
      </main>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "var(--neutral-dark)",
          color: "rgba(255, 255, 255, 0.4)",
          padding: "48px 24px",
          textAlign: "center",
          fontSize: "0.85rem",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ fontWeight: 700, color: "rgba(255, 255, 255, 0.7)", marginBottom: "12px" }}>
            턴테이블 매치 (Turntable Match)
          </p>
          <p style={{ marginBottom: "20px", lineHeight: "1.6" }}>
            사업자등록번호: 120-00-00000 | 결혼중개업신고번호: 제 2026-서울강남-0001호 | 주소: 서울특별시 강남구 삼성동 턴테이블 빌딩 4F
            <br />
            대표이메일: support@turntablematch.com | 문의: 카카오톡 @턴테이블매치
          </p>
          <p>© 2026 Turntable Match. All rights reserved. Personal data strictly encrypted.</p>
        </div>
      </footer>

      {/* Sticky Bottom floating CTA */}
      <MobileFloatingCTA
        onScrollToBooking={scrollToBooking}
        abGroup={abGroup}
        onTriggerLog={triggerLog}
      />

      {/* Floating Log Console */}
      <LogConsole
        logs={logs}
        abGroup={abGroup}
        onSwitchAbGroup={handleSwitchAbGroup}
        onClearLogs={handleClearLogs}
      />

      {/* Booking Modal */}
      {isModalOpen && (
        <BookingModal
          session={selectedSession}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSession(null);
            triggerLog("booking_modal_closed", {});
          }}
          onTriggerLog={triggerLog}
        />
      )}
    </div>
  );
}
