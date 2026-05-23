"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./StickyHeader.module.css";
import { useAuth } from "@/context/AuthContext";

interface StickyHeaderProps {
  onScrollToBooking?: () => void;
}

export default function StickyHeader({ onScrollToBooking }: StickyHeaderProps) {
  const pathname = usePathname();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

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
                href="/store"
                className={`${styles.navLink} ${pathname.startsWith("/store") ? styles.active : ""}`}
              >
                스토어
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

          {/* User Auth Section */}
          {user ? (
            <div className={styles.userInfo}>
              <span className={styles.nickname}>
                {user.nickname}님
                {user.isAdmin && <span className={styles.adminBadge}>Admin</span>}
              </span>
              <Link href="/mypage" className={styles.authBtn}>
                마이페이지
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className={`${styles.authBtn} ${styles.adminBtn}`}>
                  관리자
                </Link>
              )}
              <button className={styles.authBtn} onClick={logout}>
                로그아웃
              </button>
            </div>
          ) : (
            <Link href="/login" className={styles.authBtn}>
              로그인
            </Link>
          )}
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
              href="/store"
              className={`${styles.mobileLink} ${pathname.startsWith("/store") ? styles.active : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              스토어
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
          style={{ width: "100%", marginBottom: "15px" }}
        >
          실시간 남은 좌석 확인
        </button>

        {/* Mobile Authentication */}
        <div className={styles.mobileAuthContainer}>
          {user ? (
            <div className={styles.mobileUserInfo}>
              <div className={styles.mobileNickname}>
                {user.nickname}님
                {user.isAdmin && <span className={styles.adminBadge}>Admin</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%", marginTop: "12px" }}>
                <Link 
                  href="/mypage" 
                  className={styles.authBtn}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ width: "100%" }}
                >
                  마이페이지
                </Link>
                {user.isAdmin && (
                  <Link 
                    href="/admin" 
                    className={`${styles.authBtn} ${styles.adminBtn}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ width: "100%" }}
                  >
                    관리자 페이지
                  </Link>
                )}
                <button 
                  className={styles.authBtn} 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  style={{ width: "100%" }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <Link 
              href="/login" 
              className={styles.authBtn}
              onClick={() => setMobileMenuOpen(false)}
              style={{ display: "block", textAlign: "center" }}
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
