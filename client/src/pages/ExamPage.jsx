import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getExams, getMyRegistrations, getQuestionPaperStudent, startAttempt, submitAttempt } from '../api';
import MathText from '../components/MathText';


// MHT-CET Section Config
const getExamConfig = (stream, subjectConfig) => {
  const sc = subjectConfig || {
    section1: { partA: { label: 'Physics', count: 50 }, partB: { label: 'Chemistry', count: 50 } },
    section2: { label: stream === 'PCB' ? 'Biology' : 'Mathematics' }
  };

  const s1Count = (sc.section1.partA.count || 50) + (sc.section1.partB.count || 50);
  const s2Count = stream === 'BOTH' ? 150 : (stream === 'PCM' ? 50 : 100); // MHT-CET standard still applies for total but label matches config

  return {
    sections: [
      { 
        label: `Section 1: ${sc.section1.partA.label} & ${sc.section1.partB.label}`, 
        subjects: [sc.section1.partA.label, sc.section1.partB.label], 
        counts: [sc.section1.partA.count, sc.section1.partB.count], 
        totalQ: s1Count, 
        marksPerQ: 1, 
        duration: 90 
      },
      { 
        label: `Section 2: ${sc.section2.label}`, 
        subjects: [sc.section2.label], 
        counts: [stream === 'PCB' ? 100 : 50], 
        totalQ: stream === 'PCB' ? 100 : 50, 
        marksPerQ: stream === 'PCB' ? 1 : 2, 
        duration: 90 
      },
    ]
  };
};


const Q_STATUS = { NOT_VISITED: 'not-visited', ANSWERED: 'answered', NOT_ANSWERED: 'not-answered', MARKED: 'marked', MARKED_ANSWERED: 'marked-answered' };

function Timer({ seconds, onExpire, label }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const id = setInterval(() => setRemaining(r => r <= 1 ? (onExpire(), 0) : r - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  const urgent = remaining < 300;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderRadius: 10,
      background: urgent ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.08)',
      border: `1px solid ${urgent ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.1)'}`,
    }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 20, color: urgent ? '#f87171' : 'var(--gold)', letterSpacing: 2 }}>
        {m}:{s}
      </span>
    </div>
  );
}

export default function ExamPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [config, setConfig] = useState(null);
  const [section, setSection] = useState(0); // 0 or 1
  const [questions, setQuestions] = useState([[], []]); // [section1Qs, section2Qs]
  const [answers, setAnswers] = useState([[], []]); // [{selectedOption, markedForReview}]
  const [currentQ, setCurrentQ] = useState(0);
  const [section1Locked, setSection1Locked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [examId, setExamId] = useState(null);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [violations, setViolations] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('examTheme') !== 'light');


  const captureRef = useRef(false);
  const submitRef = useRef(null); // Updated in useEffect after definition

  // ── Initialize exam ───────────
  useEffect(() => {
    const init = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const specificExamId = searchParams.get('examId');

        // Find confirmed registration
        const regs = await getMyRegistrations();
        let confirmed;
        if (specificExamId) {
          confirmed = regs.find(r => r.status === 'confirmed' && (r.exam._id === specificExamId || r.exam === specificExamId));
        } else {
          confirmed = regs.find(r => r.status === 'confirmed');
        }

        if (!confirmed) {
          toast.error('No confirmed registration found for this exam.');
          nav('/dashboard'); return;
        }
        const eId = confirmed.exam._id || confirmed.exam;
        setExamId(eId);

        const currentStream = confirmed.student?.stream || user.stream || 'PCM';
        const cfg = getExamConfig(currentStream, confirmed.exam.subjectConfig);
        setConfig(cfg);
        setExam(confirmed.exam);


        // Fetch questions
        const qData = await getQuestionPaperStudent(eId);
        const s1 = qData.find(d => d.section === 1)?.questions || [];
        const s2 = qData.find(d => d.section === 2)?.questions || [];
        setQuestions([s1, s2]);

        // Initialize answer states
        setAnswers([
          s1.map(() => ({ selectedOption: '', markedForReview: false, visited: false })),
          s2.map(() => ({ selectedOption: '', markedForReview: false, visited: false })),
        ]);

        await startAttempt(eId);
        setLoading(false);
      } catch (err) {
        toast.error(err.message || 'Failed to load exam');
        nav('/dashboard');
      }
    };
    init();
  }, []);

  // ── Initial Fullscreen Check ───────────
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');
    
    if (!document.fullscreenElement && mode !== 'offline') {
      toast.error('Exams must be launched from the dashboard in full screen mode.');
      nav('/dashboard');
    }
  }, [nav]);

  // ── Visibility Monitoring (Removed Tab Switch) ───────────
  // Tab switch monitoring removed per request as Fullscreen is strictly enforced.
  

  // ── Section auto-lock ───────────
  const handleSection1Expire = useCallback(() => {
    setSection1Locked(true);
    setSection(1);
    setCurrentQ(0);
    toast('⏰ Section 1 locked! Section 2 now active.', { icon: '🔒', duration: 5000 });
    // Mark answers as visited
    setAnswers(prev => {
      const a = [...prev];
      // Section 1 answers that are empty but visited → not-answered
      return a;
    });
  }, []);

  const handleSection2Expire = useCallback(async () => {
    if (!submitted) await handleSubmit(true);
  }, [submitted]);

  // ── Helpers ───────────
  const getQStatus = (sIdx, qIdx) => {
    if (qIdx >= answers[sIdx].length) return Q_STATUS.NOT_VISITED;
    const a = answers[sIdx][qIdx];
    if (!a.visited) return Q_STATUS.NOT_VISITED;
    if (a.markedForReview && a.selectedOption) return Q_STATUS.MARKED_ANSWERED;
    if (a.markedForReview) return Q_STATUS.MARKED;
    if (a.selectedOption) return Q_STATUS.ANSWERED;
    return Q_STATUS.NOT_ANSWERED;
  };

  const markVisited = (sIdx, qIdx) => {
    setAnswers(prev => {
      const n = prev.map(s => [...s]);
      if (n[sIdx][qIdx]) n[sIdx][qIdx] = { ...n[sIdx][qIdx], visited: true };
      return n;
    });
  };

  const navigateTo = (sIdx, qIdx) => {
    if (sIdx === 0 && section1Locked) return;
    setSection(sIdx);
    setCurrentQ(qIdx);
    markVisited(sIdx, qIdx);
  };

  const setOption = (opt) => {
    setAnswers(prev => {
      const n = prev.map(s => [...s]);
      if (n[section][currentQ]) n[section][currentQ] = { ...n[section][currentQ], selectedOption: opt, visited: true };
      return n;
    });
  };

  const toggleMark = () => {
    setAnswers(prev => {
      const n = prev.map(s => [...s]);
      if (n[section][currentQ]) {
        const cur = n[section][currentQ];
        n[section][currentQ] = { ...cur, markedForReview: !cur.markedForReview, visited: true };
      }
      return n;
    });
  };

  const clearResponse = () => {
    setAnswers(prev => {
      const n = prev.map(s => [...s]);
      if (n[section][currentQ]) n[section][currentQ] = { ...n[section][currentQ], selectedOption: '', markedForReview: false };
      return n;
    });
  };

  const goNext = () => {
    const maxQ = questions[section].length - 1;
    if (currentQ < maxQ) {
      const nxt = currentQ + 1;
      setCurrentQ(nxt);
      markVisited(section, nxt);
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1);
      markVisited(section, currentQ - 1);
    }
  };

  // ── Submit ───────────
  const handleSubmit = async (auto = false) => {
    if (submitted) return; // Prevent double submission
    if (!auto && !window.confirm('Are you sure you want to submit the exam?')) return;
    try {
      const payload = {
        examId,
        section1Answers: answers[0].map((a, i) => ({ questionIndex: i, selectedOption: a.selectedOption, markedForReview: a.markedForReview })),
        section2Answers: answers[1].map((a, i) => ({ questionIndex: i, selectedOption: a.selectedOption, markedForReview: a.markedForReview })),
      };
      const res = await submitAttempt(payload);
      setResult(res);
      setSubmitted(true);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

  // ── Fullscreen Enforcer ───────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !submitted) {
        setShowFullscreenWarning(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [submitted]);

  // ── Anti-Cheat: Tab Switch & Focus Loss ───────────
  useEffect(() => {
    let timeoutId;
    const handleViolation = () => {
      if (submitted) return;
      
      // Prevent double fires
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViolations(v => {
          const newV = v + 1;
          if (newV >= 3) {
            toast.error('Exam submitted automatically due to multiple tab switches or window minimizes!', { duration: 5000 });
            if (submitRef.current) submitRef.current(true);
          } else {
            toast.error(`Warning ${newV}/3: Navigating away from the exam window is prohibited. Your exam will be submitted automatically at 3 strikes!`, { duration: 6000, icon: '🚨' });
          }
          return newV;
        });
      }, 500);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleViolation();
    };
    
    const onBlur = () => {
      handleViolation();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [submitted]);

  // ── Result screen ───────────
  if (submitted && result) {
    return (
      <div className="exam-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24 }}>
        <div className="glass-card-dark anim-fade-up" style={{ maxWidth: 520, width: '100%', padding: '40px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>
            {result.resultStatus === 'hold' ? '⚠️' : '🎉'}
          </div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: '#E6EDF3', marginBottom: 8 }}>
            {result.resultStatus === 'hold' ? 'Result on HOLD' : 'Exam Submitted!'}
          </h1>

          {result.resultStatus === 'hold' ? (
            <p style={{ color: '#f87171', fontSize: 14, marginBottom: 24 }}>
              Your result is under review.
            </p>
          ) : (
            <p style={{ color: 'rgba(230,237,243,0.6)', fontSize: 14, marginBottom: 24 }}>
              Your score has been recorded and is now available on your dashboard.
            </p>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 52, color: 'var(--gold)' }}>
                {result.totalScore}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(230,237,243,0.5)' }}>out of {result.maxScore}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[['Section 1', result.section1Score, 100], ['Section 2', result.section2Score, 100]].map(([label, score, max]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px' }}>
                <div style={{ fontSize: 12, color: 'rgba(230,237,243,0.5)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 24, color: '#E6EDF3' }}>{score}/{max}</div>
              </div>
            ))}
          </div>

          {/* Tab Switch Warning Removed */}

          <button className="btn-gold" style={{ width: '100%', padding: '14px' }} onClick={() => nav('/dashboard')}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="exam-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'rgba(230,237,243,0.6)' }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'float 2s infinite' }}>📝</div>
          <div style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: 18 }}>Loading Exam...</div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[section]?.[currentQ];
  const curAnswer = answers[section]?.[currentQ];
  const sectionConfig = config?.sections?.[section];

  return (
    <div className="exam-bg" data-theme={isDarkMode ? 'dark' : 'light'} style={{ 
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', 
      overflow: 'hidden', position: 'fixed', inset: 0,
      background: 'var(--exam-bg)', color: 'var(--exam-text)'
    }}>
      {/* ── Fullscreen Warning Modal ── */}
      {showFullscreenWarning && !submitted && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', padding: 24, textAlign: 'center'
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 32, marginBottom: 16, color: '#f87171' }}>
            Warning: Fullscreen Exited
          </h2>
          <p style={{ fontSize: 16, color: 'var(--exam-text-dim)', marginBottom: 32, maxWidth: 500, lineHeight: 1.6 }}>
            You have exited fullscreen mode. The exam is temporarily paused and the interface is locked. 
            Please return to fullscreen to continue your exam.
          </p>
          <button 
            onClick={() => {
              document.documentElement.requestFullscreen().then(() => {
                setShowFullscreenWarning(false);
              }).catch(() => toast.error("Failed to enter fullscreen"));
            }}
            style={{
              padding: '14px 32px', background: '#3b82f6', color: 'white', border: 'none', 
              borderRadius: 12, fontSize: 16, cursor: 'pointer', fontWeight: 700,
              fontFamily: 'Outfit', boxShadow: '0 4px 20px rgba(59,130,246,0.3)', transition: 'transform 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Return to Fullscreen
          </button>
        </div>
      )}
      {/* ── Top Bar ── */}
      <header className="exam-topbar" style={{
        background: 'var(--exam-header)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--exam-border)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 14, color: 'var(--gold)' }}>CETPortal</div>
          <div style={{ height: 20, width: 1, background: 'var(--exam-border)' }} />
          <div style={{ fontSize: 13, color: 'var(--exam-text-dim)' }}>
            {exam?.title || 'MHT-CET Mock Test'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button 
            onClick={() => {
              const newMode = !isDarkMode;
              setIsDarkMode(newMode);
              localStorage.setItem('examTheme', newMode ? 'dark' : 'light');
            }}
            style={{
              padding: '6px 12px', background: 'var(--exam-input-bg)', border: '1px solid var(--exam-border)',
              borderRadius: 8, color: 'var(--exam-text)', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
            }}
          >
            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          {violations > 0 && (
            <div style={{
              background: 'rgba(220,38,38,0.15)',
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#f87171',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'Inter, sans-serif'
            }}>
              🚨 Warning: {violations}/3 Tab Switches - Exam auto-submits at 3!
            </div>
          )}
          <div style={{ fontSize: 13, color: 'rgba(230,237,243,0.6)' }}>{user?.name}</div>
          {!section1Locked ? (
            <Timer key="s1" seconds={90 * 60} onExpire={handleSection1Expire} label="Section 1" />
          ) : (
            <Timer key="s2" seconds={90 * 60} onExpire={handleSection2Expire} label="Section 2" />
          )}
        </div>
      </header>

      {/* ── Section Tabs ── */}
      <div style={{
        background: 'var(--exam-tabs)', borderBottom: '1px solid var(--exam-border)',
        display: 'flex', padding: '0 20px',
      }}>
        {config?.sections?.map((s, i) => (
          <button key={i}
            onClick={() => { if (!(i === 0 && section1Locked)) { setSection(i); setCurrentQ(0); markVisited(i, 0); } }}
            disabled={i === 0 && section1Locked}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent',
              color: section === i ? 'var(--gold)' : 'var(--exam-text-muted)',
              fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, cursor: (i === 0 && section1Locked) ? 'not-allowed' : 'pointer',
              borderBottom: section === i ? '2px solid var(--gold)' : '2px solid transparent',
              transition: 'all 0.2s', opacity: (i === 0 && section1Locked) ? 0.4 : 1,
            }}>
            {s.label} {i === 0 && section1Locked ? '🔒' : ''}
            <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--exam-text-muted)' }}>
              ({answers[i]?.filter(a => a.selectedOption).length}/{questions[i]?.length})
            </span>
          </button>
        ))}
      </div>


      {/* ── Main Content ── */}
      <div className="exam-layout" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Question Area */}
        <div className="exam-main" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {/* Subject navigator within section */}
          {sectionConfig?.subjects?.length > 1 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {sectionConfig.subjects.reduce((acc, subj, si) => {
                const startQ = sectionConfig.counts.slice(0, si).reduce((a, b) => a + b, 0);
                acc.push(
                  <button key={si} onClick={() => navigateTo(section, startQ)}
                    style={{
                      padding: '6px 14px', background: 'var(--exam-input-bg)',
                      border: '1px solid var(--exam-border)', borderRadius: 8,
                      color: 'var(--exam-text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit',
                    }}>
                    {subj} (Q{startQ + 1}–Q{startQ + sectionConfig.counts[si]})
                  </button>

                );
                return acc;
              }, [])}
            </div>
          )}

          {currentQuestion ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(230,237,243,0.4)', fontWeight: 600 }}>
                  Q{currentQ + 1} of {questions[section].length} · {sectionConfig?.marksPerQ} Mark{sectionConfig?.marksPerQ > 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12, color: curAnswer?.markedForReview ? 'var(--marked)' : 'rgba(230,237,243,0.4)' }}>
                    {curAnswer?.markedForReview ? '🟣' : '○'} Marked
                  </span>
                </div>
              </div>

              {/* Question text */}
              <div style={{
                background: 'var(--exam-card)', border: '1px solid var(--exam-border)',
                borderRadius: 14, padding: '24px', marginBottom: 20,
                fontSize: 16, lineHeight: 1.7, color: 'var(--exam-text)',
              }}>
                <strong style={{ fontFamily: 'Outfit', color: 'var(--gold)', marginRight: 8 }}>Q{currentQ + 1}.</strong>
                <MathText text={currentQuestion.questionText} />
              </div>



              {/* Options */}
              <div>
                {Object.entries(currentQuestion.options).map(([key, val]) => (
                  <div key={key}
                    className={`exam-option ${curAnswer?.selectedOption === key ? 'selected' : ''}`}
                    onClick={() => setOption(key)}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, fontFamily: 'Outfit',
                      background: curAnswer?.selectedOption === key ? 'var(--gold)' : 'var(--exam-input-bg)',
                      color: curAnswer?.selectedOption === key ? (isDarkMode ? 'var(--forest)' : 'white') : 'var(--exam-text-dim)',
                      border: `2px solid ${curAnswer?.selectedOption === key ? 'var(--gold)' : 'var(--exam-border)'}`,
                    }}>{key}</div>
                    <span style={{ fontSize: 15, lineHeight: 1.6, color: curAnswer?.selectedOption === key ? 'var(--exam-text)' : 'var(--exam-text-dim)' }}>
                      <MathText text={val} />
                    </span>

                  </div>

                ))}
              </div>

              {/* Action bar */}
              <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
                  <button onClick={toggleMark} style={{
                    padding: '10px 18px', background: curAnswer?.markedForReview ? 'rgba(123,97,255,0.2)' : 'var(--exam-input-bg)',
                    border: `1px solid ${curAnswer?.markedForReview ? 'rgba(123,97,255,0.5)' : 'var(--exam-border)'}`,
                    borderRadius: 10, color: curAnswer?.markedForReview ? '#a78bfa' : 'var(--exam-text)',
                    fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>🟣 {curAnswer?.markedForReview ? 'Unmark' : 'Mark for Review'}</button>
                  <button onClick={clearResponse} style={{
                    padding: '10px 18px', background: 'var(--exam-input-bg)', border: '1px solid var(--exam-border)',
                    borderRadius: 10, color: 'var(--exam-text-dim)', fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>✕ Clear</button>
                  <div style={{ flex: 1 }} />
                  <button onClick={goPrev} disabled={currentQ === 0}
                    style={{
                      padding: '10px 18px', background: 'var(--exam-input-bg)', border: '1px solid var(--exam-border)',
                      borderRadius: 10, color: 'var(--exam-text)', fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      opacity: currentQ === 0 ? 0.3 : 1,
                    }}>← Prev</button>

                <button onClick={goNext} disabled={currentQ === questions[section].length - 1}
                  style={{
                    padding: '10px 18px', background: 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                    border: 'none', borderRadius: 10, color: 'var(--forest)',
                    fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                    opacity: currentQ === questions[section].length - 1 ? 0.5 : 1,
                  }}>Save & Next →</button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(230,237,243,0.4)' }}>
              No questions loaded for this section yet.
            </div>
          )}
        </div>

        {/* ── Question Palette ── */}
        <div className="exam-sidebar" style={{
          width: 260, background: 'var(--exam-sidebar)', borderLeft: '1px solid var(--exam-border)',
          padding: '16px', display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          {/* Legend */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--exam-text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Question Status</div>
            {[
              ['not-visited', 'Not Visited'],
              ['answered', 'Answered'],
              ['not-answered', 'Not Answered'],
              ['marked', 'Marked (Not Ans)'],
              ['marked-answered', 'Marked + Answered'],
            ].map(([cls, label]) => (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div className={`q-box ${cls}`} style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--exam-text-dim)' }}>{label}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--exam-border)', marginBottom: 14 }} />


          {/* Palette */}
          <div style={{ flex: 1 }}>
            {/* Section 1 labels */}
            {[0, 1].map(si => (
              <div key={si} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--exam-text-muted)', fontWeight: 600, marginBottom: 8 }}>
                  {config?.sections?.[si]?.label?.split(':')[1] || `S${si+1}`}
                  {si === 0 && section1Locked ? ' 🔒' : ''}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {questions[si].map((_, qi) => {
                    const status = getQStatus(si, qi);
                    const isCurrent = si === section && qi === currentQ;
                    return (
                      <button key={qi}
                        className={`q-box ${status}${isCurrent ? ' current' : ''}`}
                        onClick={() => navigateTo(si, qi)}
                        disabled={si === 0 && section1Locked}>
                        {qi + 1}
                      </button>
                    );
                  })}
                  {questions[si].length === 0 && (
                    <div style={{ fontSize: 11, color: 'rgba(230,237,243,0.3)', padding: '4px 0' }}>No questions uploaded</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12, color: 'rgba(230,237,243,0.4)', marginBottom: 10, textAlign: 'center' }}>
              {answers[0].filter(a => a.selectedOption).length + answers[1].filter(a => a.selectedOption).length} answered total
            </div>
            <button className="btn-gold" style={{ width: '100%', padding: '12px', borderRadius: 10 }}
              onClick={() => handleSubmit(false)}>
              🏁 Submit Exam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
