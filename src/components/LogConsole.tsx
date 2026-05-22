"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./LogConsole.module.css";

export interface LogEntry {
  timestamp: string;
  eventName: string;
  params: Record<string, any>;
}

interface LogConsoleProps {
  logs: LogEntry[];
  abGroup: "A" | "B";
  onSwitchAbGroup: () => void;
  onClearLogs: () => void;
}

export default function LogConsole({ logs, abGroup, onSwitchAbGroup, onClearLogs }: LogConsoleProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, isMinimized]);

  return (
    <div className={`${styles.console} ${isMinimized ? styles.minimized : ""}`}>
      {/* Header */}
      <div className={styles.header} onClick={() => setIsMinimized(!isMinimized)}>
        <div className={styles.title}>
          <div className={styles.indicator} />
          <span>CRO Analytics Debug Logs</span>
        </div>
        <button className={styles.toggleBtn}>
          {isMinimized ? "열기" : "접기"}
        </button>
      </div>

      {/* Body logs */}
      {!isMinimized && (
        <>
          <div className={styles.body} ref={bodyRef}>
            {logs.length === 0 ? (
              <div style={{ color: "#777", textAlign: "center", marginTop: "30px" }}>
                대기 중... 스크롤을 내리거나 버튼을 클릭해보세요.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div className={styles.logLine} key={idx}>
                  <span className={styles.timestamp}>{log.timestamp}</span>
                  <span className={styles.abTag}>GTM</span>
                  <strong>{log.eventName}</strong>:{" "}
                  <span style={{ color: "#e0d0a0" }}>
                    {JSON.stringify(log.params)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className={styles.footer}>
            <div className={styles.info}>
              Group: <strong style={{ color: "white" }}>{abGroup}</strong>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className={styles.abSwitchBtn} onClick={onSwitchAbGroup}>
                A/B 그룹 전환
              </button>
              <button 
                className={styles.abSwitchBtn} 
                onClick={onClearLogs}
                style={{ backgroundColor: "#555" }}
              >
                지우기
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
