"use client";

import React, { useState, useEffect } from "react";
import styles from "./StickyHeader.module.css";

interface StickyHeaderProps {
  onScrollToBooking: () => void;
}

export default function StickyHeader({ onScrollToBooking }: StickyHeaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const scrolled = (scrollTop / docHeight) * 100;
        setScrollProgress(scrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 70;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className={styles.logoIcon}>T</div>
          <span>턴테이블 매치</span>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navLinks}>
            <li>
              <a href="#concept" onClick={(e) => handleLinkClick(e, "concept")} className={styles.navLink}>
                모임 컨셉
              </a>
            </li>
            <li>
              <a href="#simulator" onClick={(e) => handleLinkClick(e, "simulator")} className={styles.navLink}>
                시뮬레이터
              </a>
            </li>
            <li>
              <a href="#process" onClick={(e) => handleLinkClick(e, "process")} className={styles.navLink}>
                진행 매뉴얼
              </a>
            </li>
            <li>
              <a href="#security" onClick={(e) => handleLinkClick(e, "security")} className={styles.navLink}>
                안심 보안
              </a>
            </li>
            <li>
              <a href="#booking" onClick={(e) => handleLinkClick(e, "booking")} className={styles.navLink}>
                예약 일정
              </a>
            </li>
            <li>
              <a href="#faq" onClick={(e) => handleLinkClick(e, "faq")} className={styles.navLink}>
                자주 묻는 질문
              </a>
            </li>
          </ul>
          <button className={styles.ctaBtn} onClick={onScrollToBooking}>
            실시간 남은 좌석 확인
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <div 
          className={`${styles.menuBtn} ${mobileMenuOpen ? styles.menuOpen : ""}`} 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className={styles.menuBar}></span>
          <span className={styles.menuBar}></span>
          <span className={styles.menuBar}></span>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div className={styles.progressBar} style={{ width: `${scrollProgress}%` }}></div>

      {/* Mobile Drawer */}
      <div className={`${styles.mobileNav} ${mobileMenuOpen ? styles.mobileNavOpen : ""}`}>
        <ul className={styles.mobileLinks}>
          <li>
            <a href="#concept" onClick={(e) => handleLinkClick(e, "concept")} className={styles.mobileLink}>
              모임 컨셉
            </a>
          </li>
          <li>
            <a href="#simulator" onClick={(e) => handleLinkClick(e, "simulator")} className={styles.mobileLink}>
              시뮬레이터
            </a>
          </li>
          <li>
            <a href="#process" onClick={(e) => handleLinkClick(e, "process")} className={styles.mobileLink}>
              진행 매뉴얼
            </a>
          </li>
          <li>
            <a href="#security" onClick={(e) => handleLinkClick(e, "security")} className={styles.mobileLink}>
              안심 보안
            </a>
          </li>
          <li>
            <a href="#booking" onClick={(e) => handleLinkClick(e, "booking")} className={styles.mobileLink}>
              예약 일정
            </a>
          </li>
          <li>
            <a href="#faq" onClick={(e) => handleLinkClick(e, "faq")} className={styles.mobileLink}>
              자주 묻는 질문
            </a>
          </li>
        </ul>
        <button 
          className={styles.ctaBtn} 
          onClick={() => {
            setMobileMenuOpen(false);
            onScrollToBooking();
          }}
          style={{ width: "100%" }}
        >
          실시간 남은 좌석 확인
        </button>
      </div>
    </header>
  );
}
