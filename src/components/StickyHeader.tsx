"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./StickyHeader.module.css";

interface StickyHeaderProps {
  onScrollToBooking?: () => void;
}

export default function StickyHeader({ onScrollToBooking }: StickyHeaderProps) {
  const pathname = usePathname();
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

  const handleLogoClick = () => {
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = "/";
    }
  };

  const handleCtaClick = () => {
    if (pathname === "/" && onScrollToBooking) {
      onScrollToBooking();
    } else {
      window.location.href = "/#booking";
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo} onClick={handleLogoClick}>
          <div className={styles.logoIcon}>T</div>
          <span>턴테이블 매치</span>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navLinks}>
            <li>
              <Link
                href="/"
                className={`${styles.navLink} ${pathname === "/" ? styles.active : ""}`}
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
              >
                홈
              </Link>
            </li>
            <li>
              <Link
                href="/community"
                className={`${styles.navLink} ${pathname.startsWith("/community") ? styles.active : ""}`}
              >
                커뮤니티
              </Link>
            </li>
          </ul>
          <button className={styles.ctaBtn} onClick={handleCtaClick}>
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
            <Link
              href="/"
              className={`${styles.mobileLink} ${pathname === "/" ? styles.active : ""}`}
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
            >
              홈
            </Link>
          </li>
          <li>
            <Link
              href="/community"
              className={`${styles.mobileLink} ${pathname.startsWith("/community") ? styles.active : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              커뮤니티
            </Link>
          </li>
        </ul>
        <button 
          className={styles.ctaBtn} 
          onClick={() => {
            setMobileMenuOpen(false);
            handleCtaClick();
          }}
          style={{ width: "100%" }}
        >
          실시간 남은 좌석 확인
        </button>
      </div>
    </header>
  );
}

