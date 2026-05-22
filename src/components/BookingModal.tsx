"use client";

import React, { useState, useEffect } from "react";
import styles from "./BookingModal.module.css";
import { ScheduleSession } from "./BookingSection";

interface BookingModalProps {
  session: ScheduleSession | null;
  onClose: () => void;
  onTriggerLog: (eventName: string, params: Record<string, any>) => void;
}

type Step = 1 | 2 | 3 | 4 | "success";

interface FormState {
  name: string;
  birthdate: string;
  gender: "남성" | "여성" | "";
  phone: string;
  otp: string;
  phoneVerified: boolean;
  companyName: string;
  jobTitle: string;
  cardImageUploaded: boolean;
  heightRange: string;
  balanceQ1: string;
  balanceQ2: string;
  balanceQ3: string;
}

const initialFormState: FormState = {
  name: "",
  birthdate: "",
  gender: "",
  phone: "",
  otp: "",
  phoneVerified: false,
  companyName: "",
  jobTitle: "",
  cardImageUploaded: false,
  heightRange: "",
  balanceQ1: "",
  balanceQ2: "",
  balanceQ3: ""
};

export default function BookingModal({ session, onClose, onTriggerLog }: BookingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");

  // Load from local storage if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("tt_booking_autosave");
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setForm(prev => ({
            ...prev,
            ...parsed,
            otp: "", // reset verification code
            phoneVerified: false // force re-verification for safety
          }));
          setAutoSaveStatus("이전 임시 저장본을 불러왔습니다.");
          setTimeout(() => setAutoSaveStatus(""), 3000);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Save to local storage whenever form changes
  const saveToLocal = (updatedForm: FormState) => {
    if (typeof window !== "undefined") {
      // Don't store credentials or validation state, just input profiles
      const dataToSave = {
        name: updatedForm.name,
        birthdate: updatedForm.birthdate,
        gender: updatedForm.gender,
        phone: updatedForm.phone,
        companyName: updatedForm.companyName,
        jobTitle: updatedForm.jobTitle,
        heightRange: updatedForm.heightRange,
        balanceQ1: updatedForm.balanceQ1,
        balanceQ2: updatedForm.balanceQ2,
        balanceQ3: updatedForm.balanceQ3
      };
      localStorage.setItem("tt_booking_autosave", JSON.stringify(dataToSave));
      setAutoSaveStatus("임시 저장 완료 ✓");
      setTimeout(() => setAutoSaveStatus(""), 2000);
    }
  };

  const updateForm = (updates: Partial<FormState>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    saveToLocal(newForm);
  };

  if (!session) return null;

  const handleSendOtp = () => {
    if (!form.phone || form.phone.length < 10) {
      setOtpError("올바른 휴대전화 번호를 입력해 주세요.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    onTriggerLog("otp_send_clicked", { phone: form.phone });

    setTimeout(() => {
      setOtpLoading(false);
      setOtpSent(true);
      onTriggerLog("otp_sent_success", {});
    }, 1200);
  };

  const handleVerifyOtp = () => {
    if (!form.otp || form.otp.length < 4) {
      setOtpError("인증번호 4자리를 입력해 주세요.");
      return;
    }
    onTriggerLog("otp_verify_clicked", { otp: form.otp });
    
    // Simulate SMS service verification
    if (form.otp === "1234" || form.otp.length === 4) {
      updateForm({ 
        phoneVerified: true,
        // Auto-fill mock verified credentials based on gender selection for premium UX
        name: form.name || (form.gender === "남성" ? "김우빈" : "김태희"),
        birthdate: form.birthdate || "1994-06-12"
      });
      setOtpError("");
      onTriggerLog("otp_verify_success", { verifiedName: form.gender === "남성" ? "김우빈" : "김태희" });
    } else {
      setOtpError("인증번호가 일치하지 않습니다. (테스트용 입력: 1234)");
    }
  };

  const handleImageUploadSim = () => {
    setUploadLoading(true);
    onTriggerLog("upload_started", {});

    setTimeout(() => {
      setUploadLoading(false);
      updateForm({ cardImageUploaded: true });
      onTriggerLog("upload_success", {});
    }, 1500);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!form.phoneVerified) {
        setOtpError("본인인증을 먼저 완료해 주세요.");
        return;
      }
      setStep(2);
      onTriggerLog("modal_step_changed", { from: 1, to: 2 });
    } else if (step === 2) {
      if (!form.companyName || !form.jobTitle || !form.cardImageUploaded) {
        alert("모든 재직 검증 정보를 입력하고 사원증/명함을 업로드해 주세요.");
        return;
      }
      setStep(3);
      onTriggerLog("modal_step_changed", { from: 2, to: 3 });
    } else if (step === 3) {
      if (!form.heightRange) {
        alert("신장 대역을 선택해 주세요.");
        return;
      }
      setStep(4);
      onTriggerLog("modal_step_changed", { from: 3, to: 4 });
    } else if (step === 4) {
      if (!form.balanceQ1 || !form.balanceQ2 || !form.balanceQ3) {
        alert("모든 가치관 밸런스 게임 문항에 답해 주세요.");
        return;
      }
      // Submit registration
      setStep("success");
      onTriggerLog("registration_completed", {
        sessionId: session.id,
        heightRange: form.heightRange,
        companyName: form.companyName
      });
      // Clear autosave
      localStorage.removeItem("tt_booking_autosave");
    }
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    onTriggerLog("modal_step_changed", { direction: "prev", current: step });
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalContent}>
        
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>턴테이블 참가 예약 신청</h3>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Progress Tracker */}
        {step !== "success" && (
          <div className={styles.progressTracker}>
            <div className={`${styles.trackerStep} ${step === 1 ? styles.trackerStepActive : ""} ${step > 1 ? styles.trackerStepDone : ""}`}>
              <div className={styles.stepDot} /> 본인인증
            </div>
            <div className={`${styles.trackerStep} ${step === 2 ? styles.trackerStepActive : ""} ${step > 2 ? styles.trackerStepDone : ""}`}>
              <div className={styles.stepDot} /> 재직검증
            </div>
            <div className={`${styles.trackerStep} ${step === 3 ? styles.trackerStepActive : ""} ${step > 3 ? styles.trackerStepDone : ""}`}>
              <div className={styles.stepDot} /> 신장입력
            </div>
            <div className={`${styles.trackerStep} ${step === 4 ? styles.trackerStepActive : ""} ${step > 4 ? styles.trackerStepDone : ""}`}>
              <div className={styles.stepDot} /> 감정프로필
            </div>
          </div>
        )}

        {/* Body content based on step */}
        <div className={styles.formBody}>
          {step === 1 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "rgba(61,52,52,0.6)", marginBottom: "20px" }}>
                정확한 성비 구성과 신뢰성 보장을 위해 본인 신용평가원 기반 휴대폰 인증이 최초 1회 의무 적용됩니다.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>성별 선택</label>
                <div className={styles.row}>
                  <button
                    className={`${styles.heightBtn} ${form.gender === "남성" ? styles.heightBtnActive : ""}`}
                    onClick={() => updateForm({ gender: "남성" })}
                  >
                    남성 (Men)
                  </button>
                  <button
                    className={`${styles.heightBtn} ${form.gender === "여성" ? styles.heightBtnActive : ""}`}
                    onClick={() => updateForm({ gender: "여성" })}
                  >
                    여성 (Women)
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>휴대전화 번호</label>
                <div className={styles.inputWithButton}>
                  <input
                    type="tel"
                    placeholder="010-0000-0000 ('-' 제외)"
                    className={styles.input}
                    value={form.phone}
                    disabled={form.phoneVerified}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                  />
                  <button
                    className={styles.inlineBtn}
                    onClick={handleSendOtp}
                    disabled={otpLoading || form.phoneVerified}
                  >
                    {otpLoading ? "전송중..." : otpSent ? "재전송" : "인증번호 발송"}
                  </button>
                </div>
              </div>

              {otpSent && !form.phoneVerified && (
                <div className={styles.formGroup} style={{ animation: "slideUp 0.3s ease" }}>
                  <label className={styles.label}>인증번호 입력</label>
                  <div className={styles.inputWithButton}>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="인증번호 4자리 입력 (테스트: 1234)"
                      className={styles.input}
                      value={form.otp}
                      onChange={(e) => updateForm({ otp: e.target.value })}
                    />
                    <button className={styles.inlineBtn} onClick={handleVerifyOtp} style={{ backgroundColor: "var(--accent)" }}>
                      인증 확인
                    </button>
                  </div>
                </div>
              )}

              {form.phoneVerified && (
                <div className={styles.formGroup} style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem", animation: "slideUp 0.3s ease" }}>
                  ✓ 휴대전화 본인 인증이 정상 완료되었습니다. (자동입력: {form.name} / {form.birthdate})
                </div>
              )}

              {otpError && <p style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600 }}>{otpError}</p>}
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "rgba(61,52,52,0.6)", marginBottom: "20px" }}>
                소속 직장을 검증합니다. 업로드된 사원증/명함은 매칭 일정 확정 승인 후 <strong>7일 이내에 물리 데이터베이스에서 완벽히 영구 파기</strong>됩니다.
              </p>

              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>회사명</label>
                  <input
                    type="text"
                    placeholder="예: Toss, 삼성전자"
                    className={styles.input}
                    value={form.companyName}
                    onChange={(e) => updateForm({ companyName: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>직무</label>
                  <input
                    type="text"
                    placeholder="예: 서비스 기획자, 개발자"
                    className={styles.input}
                    value={form.jobTitle}
                    onChange={(e) => updateForm({ jobTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>사원증, 명함 또는 재직증명서 증빙 파일 업로드</label>
                {!form.cardImageUploaded ? (
                  <div className={styles.uploadArea} onClick={handleImageUploadSim}>
                    <span className={styles.uploadIcon}>📁</span>
                    <span className={styles.uploadText}>
                      {uploadLoading ? "파일 업로드 중..." : "이미지 업로드하기"}
                    </span>
                    <span className={styles.uploadSubtext}>사원증, 명함 중 택 1 사진 파일 업로드 필수</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "0.9rem", marginBottom: "10px" }}>
                      ✓ 증빙 이미지가 정상 로드되었습니다.
                    </div>
                    {/* Visual Masking Crop Guide */}
                    <div className={styles.cropContainer}>
                      <div className={styles.cropImage} style={{ background: "#4e4444", height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)" }}>
                        [ 직장 사원증 증빙 이미지 템플릿 ]
                      </div>
                      
                      {/* Interactive visual masking box overlays */}
                      <div className={`${styles.cropMaskGuide} ${styles.maskSsn}`}>
                        🔒 개인정보 마스킹 권장<br />
                        (주민번호 뒷자리 영역)
                      </div>
                      <div className={`${styles.cropMaskGuide} ${styles.maskAddr}`}>
                        🔒 개인정보 마스킹 권장<br />
                        (자택 주소/민감한 상세 스펙)
                      </div>
                    </div>
                    <button className={styles.prevBtn} style={{ marginTop: "10px", padding: "6px 12px", fontSize: "0.8rem", borderRadius: "6px" }} onClick={() => updateForm({ cardImageUploaded: false })}>
                      사진 재지정
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "rgba(61,52,52,0.6)", marginBottom: "20px" }}>
                앉아서 진행하는 미팅 특성상 신장에 관한 질문이 많습니다. <br />
                직접적인 키 수치 입력 대신 <strong>범위형 입력</strong>을 선택해 상대방의 부담을 줄이고 투명성을 높입니다.
              </p>

              <div className={styles.formGroup}>
                <label className={styles.label}>본인의 신장 범위 선택</label>
                <div className={styles.heightGrid}>
                  {form.gender === "남성" ? (
                    // Male Ranges
                    ["165~169cm", "170~174cm", "175~179cm", "180~184cm", "185cm 이상"].map(range => (
                      <button
                        key={range}
                        className={`${styles.heightBtn} ${form.heightRange === range ? styles.heightBtnActive : ""}`}
                        onClick={() => updateForm({ heightRange: range })}
                      >
                        {range}
                      </button>
                    ))
                  ) : (
                    // Female Ranges
                    ["150~154cm", "155~159cm", "160~164cm", "165~169cm", "170cm 이상"].map(range => (
                      <button
                        key={range}
                        className={`${styles.heightBtn} ${form.heightRange === range ? styles.heightBtnActive : ""}`}
                        onClick={() => updateForm({ heightRange: range })}
                      >
                        {range}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <p style={{ fontSize: "0.85rem", color: "rgba(61,52,52,0.6)", marginBottom: "20px" }}>
                상대방과의 내면 가치 대화 확률을 높이기 위한 감정프로필 밸런스 게임입니다. 현장에서 대화 나눌 이성들에게 매칭 확률 계산의 기초 데이터로 매칭 전송됩니다.
              </p>

              {/* Question 1 */}
              <div className={styles.questionBlock}>
                <span className={styles.questionTitle}>
                  <span className={styles.questionBadge}>Q1</span>
                  연인의 이성친구(남사친/여사친) 허용 범위는?
                </span>
                <div className={styles.optionsFlex}>
                  {[
                    "연락은 가능하나 단둘이 만남은 불가",
                    "단순 업무/학업 연락 외에는 연락도 절대 불가",
                    "미리 공유만 해준다면 커피나 식사까지는 허용"
                  ].map(option => (
                    <button
                      key={option}
                      className={`${styles.gameOption} ${form.balanceQ1 === option ? styles.gameOptionActive : ""}`}
                      onClick={() => updateForm({ balanceQ1: option })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2 */}
              <div className={styles.questionBlock}>
                <span className={styles.questionTitle}>
                  <span className={styles.questionBadge}>Q2</span>
                  이상적인 연락 및 데이트 주기는?
                </span>
                <div className={styles.optionsFlex}>
                  {[
                    "평일 퇴근 후 1~2회 + 주말 하루 온전히 시간 보내기",
                    "평일에는 업무/카톡 위주, 데이트는 주말에 집중",
                    "매시간 활발한 카톡 + 평일 주말 기회 될 때마다 만나기"
                  ].map(option => (
                    <button
                      key={option}
                      className={`${styles.gameOption} ${form.balanceQ2 === option ? styles.gameOptionActive : ""}`}
                      onClick={() => updateForm({ balanceQ2: option })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 3 */}
              <div className={styles.questionBlock}>
                <span className={styles.questionTitle}>
                  <span className={styles.questionBadge}>Q3</span>
                  나의 소비 및 결혼 가치관에 가까운 것은?
                </span>
                <div className={styles.optionsFlex}>
                  {[
                    "미래 결혼 자금 준비와 저축이 삶의 최우선",
                    "쓸 때는 쓰고 아낄 때는 아끼는 유연한 자산 관리",
                    "일생에 한 번뿐인 젊음, 나를 위한 투자와 취향 소비"
                  ].map(option => (
                    <button
                      key={option}
                      className={`${styles.gameOption} ${form.balanceQ3 === option ? styles.gameOptionActive : ""}`}
                      onClick={() => updateForm({ balanceQ3: option })}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className={styles.successMessage}>
              <span className={styles.successIcon}>🎉</span>
              <h3 className={styles.successTitle}>신청 예약 완료</h3>
              <p className={styles.successText}>
                김재혁님, <strong>{session.date} {session.time.split(" ")[0]}</strong> 일정 신청이 정상 접수되었습니다.<br /><br />
                직장 재직 정보 검증 승인은 보통 1~2시간 이내에 완료되며,<br />
                매칭 정원이 모두 완료되는 대로 상세 모임 매뉴얼 링크와 알림톡이 전송됩니다.
              </p>
              <button className={styles.nextBtn} style={{ marginTop: "30px", width: "150px" }} onClick={onClose}>
                닫기
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== "success" && (
          <div className={styles.modalFooter}>
            {step > 1 ? (
              <button className={`${styles.footerBtn} ${styles.prevBtn}`} onClick={handlePrevStep}>
                이전 단계
              </button>
            ) : (
              <button className={`${styles.footerBtn} ${styles.prevBtn}`} onClick={onClose}>
                취소
              </button>
            )}
            
            <button className={`${styles.footerBtn} ${styles.nextBtn}`} onClick={handleNextStep}>
              {step === 4 ? "신청서 최종 제출" : "다음 단계로"}
            </button>
          </div>
        )}

        {/* LocalStorage Autosave Status Indicator */}
        {autoSaveStatus && <div className={styles.autosaveText}>{autoSaveStatus}</div>}
      </div>
    </div>
  );
}
