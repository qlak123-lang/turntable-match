"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./InteractiveSim.module.css";

type SimState = "idle" | "step1" | "step2" | "step3" | "step4" | "matched";

interface InteractiveSimProps {
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

export default function InteractiveSim({ onTriggerLog }: InteractiveSimProps) {
  const [simState, setSimState] = useState<SimState>("idle");
  const [activeStep, setActiveStep] = useState<number>(0);
  const [dialogTurn, setDialogTurn] = useState<number>(0);
  const [timerPercent, setTimerPercent] = useState<number>(100);
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number | null>(null);
  const [isMatchingLoading, setIsMatchingLoading] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [dialogs, setDialogs] = useState<{ sender: "left" | "right"; text: string }[]>([
    {
      sender: "left",
      text: "안녕하세요! 재혁님 맞으시죠? 가치관 카드에서 주말에 전시회 가는 것 좋아하신다고 쓰인 것 봤어요!"
    }
  ]);

  // Sync active step with simulation states
  useEffect(() => {
    if (simState === "idle") setActiveStep(0);
    else if (simState === "step1") setActiveStep(1);
    else if (simState === "step2") setActiveStep(2);
    else if (simState === "step3") setActiveStep(3);
    else if (simState === "step4" || simState === "matched") setActiveStep(4);
  }, [simState]);

  // Rotational Talk Timer Simulator (10 seconds represent 10 minutes)
  useEffect(() => {
    if (simState === "step3") {
      setTimerPercent(100);
      let elapsed = 0;
      const duration = 12000; // 12 seconds
      
      timerIntervalRef.current = setInterval(() => {
        elapsed += 100;
        const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
        setTimerPercent(remaining);

        if (elapsed >= duration) {
          clearInterval(timerIntervalRef.current!);
          // Automatically proceed to voting phase
          setSimState("step4");
          onTriggerLog("sim_timer_expired", {});
        }
      }, 100);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [simState, onTriggerLog]);

  const startSim = () => {
    setSimState("step1");
    onTriggerLog("sim_started", {});
  };

  const resetSim = () => {
    setSimState("idle");
    setDialogTurn(0);
    setSelectedMatchIdx(null);
    setIsMatchingLoading(false);
    setDialogs([
      {
        sender: "left",
        text: "안녕하세요! 재혁님 맞으시죠? 가치관 카드에서 주말에 전시회 가는 것 좋아하신다고 쓰인 것 봤어요!"
      }
    ]);
    onTriggerLog("sim_reset", {});
  };

  const handleOptionClick = (replyText: string, partnerResponse: string) => {
    // Append user message
    setDialogs(prev => [...prev, { sender: "right", text: replyText }]);
    onTriggerLog("sim_dialog_choice", { turn: dialogTurn, choice: replyText });

    setTimeout(() => {
      // Append partner response
      setDialogs(prev => [...prev, { sender: "left", text: partnerResponse }]);
      setDialogTurn(prev => prev + 1);
    }, 800);
  };

  const handleVoteSubmit = () => {
    if (selectedMatchIdx === null) return;
    setIsMatchingLoading(true);
    onTriggerLog("sim_vote_submitted", { votedIndex: selectedMatchIdx });

    setTimeout(() => {
      setIsMatchingLoading(false);
      setSimState("matched");
      onTriggerLog("sim_match_success", {});
    }, 2000);
  };

  const renderSimScreen = () => {
    switch (simState) {
      case "idle":
        return (
          <div className={styles.centeredState}>
            <div className={styles.startIcon}>🎯</div>
            <h3>1분 로테이션 미팅 시뮬레이터</h3>
            <p style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)", textAlign: "center" }}>
              신청부터 모임 진행, 최종 연락처 매칭까지의<br />
              전 과정을 1분 만에 가상으로 경험해보세요.
            </p>
            <button className={styles.simBtn} onClick={startSim}>
              시뮬레이터 시작하기
            </button>
          </div>
        );

      case "step1":
        return (
          <div className={styles.phoneScreen}>
            <div className={styles.chatHistory}>
              <div className={`${styles.msgRow} ${styles.msgReceived}`}>
                <span className={styles.msgAuthor}>턴테이블 매치 알림톡</span>
                <div className={`${styles.msgBubble} ${styles.bubbleGray}`}>
                  💌 안녕하세요 김재혁님!<br />
                  이번 주 토요일 16:00 강남 28호 모임의 성비 매칭 정원이 확정되었습니다.<br /><br />
                  - <strong>인원 구성:</strong> 남성 10명 : 여성 10명<br />
                  - <strong>장소:</strong> 삼청동 골목 프라이빗 라운지 B2 (외부 시선 차단)<br />
                  - <strong>준비물:</strong> 신원 확인용 실물 신분증
                </div>
              </div>
              <div className={`${styles.msgRow} ${styles.msgSent}`}>
                <div className={`${styles.msgBubble} ${styles.bubblePrimary}`}>
                  확인했습니다! 당일 뵙겠습니다.
                </div>
              </div>
            </div>
            <button className={styles.simBtn} onClick={() => setSimState("step2")}>
              Step 2: 오프라인 라운지 입장하기 →
            </button>
          </div>
        );

      case "step2":
        return (
          <div className={styles.phoneScreen}>
            <div className={styles.centeredState} style={{ gap: "15px" }}>
              <div style={{ fontSize: "2.5rem" }}>☕️</div>
              <h4 style={{ fontSize: "1.1rem" }}>삼청동 골목 프라이빗 라운지 도착</h4>
              <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.7)" }}>
                호스트가 신분증 대조 후 테이블 4번(고정석)을 지정해 줍니다.<br />
                테이블에는 손으로 쓴 실물 프로필 카드가 올려져 있습니다.
              </p>
              
              <div className={styles.entranceCard}>
                <div className={styles.entranceHeader}>
                  <span className={styles.entranceTitle}>김지현 (29세 · 여성)</span>
                  <span className={styles.partnerVerify}>✓ 대학병원 간호사</span>
                </div>
                <div className={styles.entranceMeta}>VERIFIED · 신장 대역: 161cm ~ 163cm</div>
                <div className={styles.entranceSpecs}>
                  <div>🏡 <strong>주말 선호:</strong> 조용한 외곽 카페 드라이브</div>
                  <div>🌱 <strong>연애 성향:</strong> 서두르지 않고 대화로 알아가기</div>
                </div>
              </div>
            </div>
            <button className={styles.simBtn} onClick={() => setSimState("step3")}>
              Step 3: 일대일 로테이션 대화 시작하기 →
            </button>
          </div>
        );

      case "step3":
        return (
          <div className={styles.phoneScreen}>
            <div>
              <div className={styles.partnerHeader}>
                <div className={styles.partnerAvatar}>👩‍⚕️</div>
                <div>
                  <div className={styles.partnerName}>김지현 (29세 · 간호사)</div>
                  <div className={styles.partnerVerify}>✓ 신원 인증 완료</div>
                </div>
              </div>

              <div className={styles.timerBar}>
                <div className={styles.timerFill} style={{ width: `${timerPercent}%` }}></div>
              </div>
            </div>

            <div className={styles.chatArea}>
              {dialogs.map((dialog, idx) => (
                <div
                  key={idx}
                  className={`${styles.msgRow} ${
                    dialog.sender === "left" ? styles.msgReceived : styles.msgSent
                  }`}
                >
                  <div
                    className={`${styles.msgBubble} ${
                      dialog.sender === "left" ? styles.bubbleGray : styles.bubblePrimary
                    }`}
                  >
                    {dialog.text}
                  </div>
                </div>
              ))}
            </div>

            {/* User Interaction Options */}
            <div className={styles.optionsArea}>
              {dialogTurn === 0 && (
                <>
                  <button
                    className={styles.optionBtn}
                    onClick={() =>
                      handleOptionClick(
                        "아, 네! 맞아요. 최근에 삼청 미술관 전시 보고 왔는데 너무 마음에 와닿더라고요.",
                        "아 진짜요? 저도 미술관 가는 것 취미인데! 삼청 쪽은 골목이 아기자기해서 더 좋죠."
                      )
                    }
                  >
                    👉 "네, 최근 삼청 미술관 다녀왔는데 너무 좋더라고요."
                  </button>
                  <button
                    className={styles.optionBtn}
                    onClick={() =>
                      handleOptionClick(
                        "네, 시끄러운 곳보다 한적하게 관람하는 걸 즐겨요. 지현님은요?",
                        "저도 삼교대 하느라 힘들어서 주말엔 조용하게 힐링하는 걸 선호해요 ㅎㅎ"
                      )
                    }
                  >
                    👉 "네, 조용히 힐링하며 관람하는 걸 즐겨요."
                  </button>
                </>
              )}

              {dialogTurn === 1 && (
                <>
                  <button
                    className={styles.optionBtn}
                    onClick={() =>
                      handleOptionClick(
                        "교대 근무 하시면 주말에 쉬는 날 맞추기 어렵진 않으세요?",
                        "다행히 스케줄 조절이 가능해서, 만나는 분 생기면 주말에 미리 오프 신청해서 맞춰요!"
                      )
                    }
                  >
                    👉 "삼교대 하시면 쉬는 날 맞추기 힘들진 않으세요?"
                  </button>
                  <button
                    className={styles.optionBtn}
                    onClick={() =>
                      handleOptionClick(
                        "그렇군요, 그럼 쉬는 날에는 주로 드라이브 자주 가시나요?",
                        "네! 근교 남양주나 양평 쪽에 조용한 강변 뷰 카페 찾아서 드라이브 가곤 해요."
                      )
                    }
                  >
                    👉 "쉬는 날엔 주로 드라이브 가시나요?"
                  </button>
                </>
              )}

              {dialogTurn >= 2 && (
                <div style={{ textAlign: "center", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                  ⏰ 10분 대화 종료! 남성분들은 다음 번호 테이블로 이동합니다.<br />
                  여성분들은 고정석에 착석하여 동선 꼬임을 방지합니다.
                  <button
                    className={styles.simBtn}
                    onClick={() => setSimState("step4")}
                    style={{ marginTop: "12px", width: "100%" }}
                  >
                    Step 4: 밤 10:00 모바일 매칭 투표하기 →
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "step4":
        return (
          <div className={styles.phoneScreen}>
            <div className={styles.voteForm}>
              <div className={styles.voteTitle}>
                💌 모임 종료 후 모바일 투표<br />
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>
                  오늘 대화 나눈 10명의 이성 중, 호감 이성을 최대 3명 선택해 주세요.
                </span>
              </div>

              {isMatchingLoading ? (
                <div className={styles.centeredState} style={{ padding: "40px 0" }}>
                  <div className={styles.pulseIndicator} />
                  <p>호감도 투표 분석 및 매칭 매트릭스 계산 중...</p>
                </div>
              ) : (
                <div className={styles.voteList}>
                  {[
                    { name: "김지현 (29세 · 간호사)", desc: "1번 테이블 · 드라이브 취미가 겹침" },
                    { name: "이지수 (31세 · 마케터)", desc: "5번 테이블 · 선호 도서 취향이 통함" },
                    { name: "최윤진 (28세 · 공무원)", desc: "8번 테이블 · 밝고 쾌활한 웃음코드" }
                  ].map((partner, idx) => (
                    <div
                      key={idx}
                      className={`${styles.voteItem} ${
                        selectedMatchIdx === idx ? styles.voteItemActive : ""
                      }`}
                      onClick={() => setSelectedMatchIdx(idx)}
                    >
                      <div>
                        <strong>{partner.name}</strong>
                        <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.4)", marginTop: "4px" }}>
                          {partner.desc}
                        </div>
                      </div>
                      <div className={styles.voteCheck}>✔</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isMatchingLoading && (
              <button
                className={styles.simBtn}
                disabled={selectedMatchIdx === null}
                onClick={handleVoteSubmit}
                style={{ opacity: selectedMatchIdx === null ? 0.5 : 1 }}
              >
                호감 매칭 제출하기
              </button>
            )}
          </div>
        );

      case "matched":
        return (
          <div className={styles.phoneScreen}>
            <div className={styles.matchSuccess}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🎉</div>
              <h3 className={styles.matchTitle}>매칭 성공!</h3>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>
                김지현님과 서로 호감을 표시하여 매칭에 성공하였습니다.<br />
                당일 자정 전, 서로의 연락처가 안심 안전하게 자동 공유됩니다.
              </p>
              
              <div className={styles.matchContact}>
                👩‍⚕️ 김지현 : 010-4821-3920
              </div>

              <p style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)" }}>
                상대방에게 매너 있는 연락을 남겨 다음 만남 약속을 계획해 보세요!
              </p>
            </div>
            
            <button className={styles.subBtn} onClick={resetSim} style={{ marginTop: "24px" }}>
              시뮬레이터 처음으로 리셋
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className={`${styles.section} section-padding`} id="simulator">
      <div className="container">
        <div className={styles.titleArea}>
          <span className={styles.tagline}>Interactive Simulation</span>
          <h2 className={styles.title}>턴테이블 소개팅이 처음이신가요?</h2>
          <p className={styles.subtitle}>
            매너 약속 준수부터 매칭까지, 참가 과정에서 마주칠 모든 단계를 미리 알아보고 불안감을 해소하세요.
          </p>
        </div>

        <div className={styles.layout}>
          {/* Static Steps on the left */}
          <div className={styles.stepsContainer}>
            {[
              {
                step: 1,
                title: "1단계: 성비 매칭 완료 및 알림톡 생성",
                desc: "남녀 10:10 비율이 달성되면 모임 전일 상세 일정 안내 및 제휴 골목 라운지 주소 링크가 알림톡으로 전송됩니다."
              },
              {
                step: 2,
                title: "2단계: 프라이빗 라운지 입장 & 프로필 교환",
                desc: "외부 시선이 차단된 아늑한 모임 공간에 입장합니다. 지정 고정석에 착석하여 사전에 입력된 밸런스 가치관 카드를 공유받습니다."
              },
              {
                step: 3,
                title: "3단계: 1대1 로테이션 10분 대화",
                desc: "남성 참가자는 매 10분마다 호스트의 사인에 맞추어 다음 번호 테이블로 회전 이동하며 10명의 이성과 밀도 높게 대화합니다."
              },
              {
                step: 4,
                title: "4단계: 모바일 호감 투표 & 자정 매칭",
                desc: "모임 종료 후 퇴장하여 밤 10시까지 최대 3명의 호감 상대방을 투표합니다. 상호 호감 매칭 성공 시 연락처가 자동 공유됩니다."
              }
            ].map((step, idx) => (
              <div
                key={idx}
                className={`${styles.stepRow} ${
                  activeStep === step.step ? styles.stepRowActive : ""
                }`}
                onClick={() => {
                  const stateMap: Record<number, SimState> = {
                    1: "step1",
                    2: "step2",
                    3: "step3",
                    4: "step4"
                  };
                  setSimState(stateMap[step.step]);
                }}
              >
                <div className={styles.stepNum}>{step.step}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Simulator on the right */}
          <div className={styles.simTerminal}>
            <div className={styles.simHeader}>
              <div className={styles.simTitle}>
                <div className={simState !== "idle" ? styles.pulseIndicator : styles.indicator}></div>
                <span>T-Match Simulator v1.0</span>
              </div>
              {simState !== "idle" && (
                <button className={styles.simCloseBtn} onClick={resetSim}>
                  초기화
                </button>
              )}
            </div>
            
            <div className={styles.simBody}>
              {renderSimScreen()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
