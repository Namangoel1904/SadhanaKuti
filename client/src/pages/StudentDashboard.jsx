import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getExams, getMyRegistrations, registerForExam, getAdmitCardData, getMyAttempts, getMyAttemptDetails } from '../api';
import { generateAdmitCardPDF } from '../utils/generateAdmitCardPDF';
import MathText from '../components/MathText';


function NavBar({ user, logout }) {
  const nav = useNavigate();
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 40,
      background: 'rgba(245,240,232,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(122,155,122,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, background: 'linear-gradient(135deg,var(--forest),var(--sage))',
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit',
        }}>S</div>
        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, color: 'var(--forest)' }}>Sadhna Kuti - Dashboard</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, color: '#777' }}>
          👋 {user?.name} <span className={`badge badge-${user?.stream === 'PCM' ? 'confirmed' : 'pending'}`}>{user?.stream}</span>
        </span>
        <button onClick={() => { logout(); nav('/'); }} className="btn-outline" style={{ padding: '7px 16px', fontSize: 13 }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

function RegisterModal({ selectedExams, mode, totalFee, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const allFree = selectedExams.every(ex => ex.isFree);
  const hasPaid = selectedExams.some(ex => !ex.isFree);
  const qrImageUrl = selectedExams.find(ex => !ex.isFree)?.qrImageUrl;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('examIds', JSON.stringify(selectedExams.map(ex => ex._id)));
      fd.append('mode', mode);
      if (file) fd.append('paymentScreenshot', file);
      const res = await registerForExam(fd);
      toast.success(res.confirmed ? 'Registered & Confirmed instantly! 🎉' : 'Registration submitted! Under verification.');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div className="glass-card anim-fade-up" style={{ maxWidth: 460, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 22, color: 'var(--forest)', marginBottom: 4 }}>
          Checkout ({selectedExams.length} Exam{selectedExams.length > 1 ? 's' : ''})
        </h2>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Mode: <strong style={{color: 'var(--forest)', textTransform: 'capitalize'}}>{mode}</strong></p>

        {/* Per-exam FREE/PAID list */}
        <div style={{ marginBottom: 20 }}>
          {selectedExams.map(ex => (
            <div key={ex._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{ex.title}</span>
              {ex.isFree
                ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🆓 FREE</span>
                : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--forest)' }}>₹{ex.feeAmount || 200}</span>
              }
            </div>
          ))}
        </div>


        <form onSubmit={handleSubmit}>
          {hasPaid && (
            <>
              <div style={{
                background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-mid) 100%)',
                borderRadius: 14, padding: '20px', textAlign: 'center', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
                  Total Paid Amount: <strong style={{ color: 'var(--gold)' }}>₹{totalFee}</strong>
                </div>
                {qrImageUrl ? (
                  <img src={qrImageUrl} alt="Payment QR" style={{ maxWidth: 180, borderRadius: 10 }} />
                ) : (
                  <div style={{ width: 180, height: 180, background: 'rgba(255,255,255,0.1)', borderRadius: 10, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', border: '2px dashed rgba(255,255,255,0.2)' }}>
                    QR Code will be<br />set by Admin
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 10 }}>Scan &amp; pay, then upload screenshot below</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Payment Screenshot</label>
                <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} style={{ display: 'block', marginTop: 6 }} required />
              </div>
            </>
          )}
          {allFree && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🆓</div>
              <div style={{ fontWeight: 700, color: '#10B981', fontSize: 15 }}>This exam is FREE!</div>
              <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>No payment needed. You'll be confirmed instantly.</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '11px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || (hasPaid && !file)}
              style={{ flex: 1, padding: '11px', background: allFree ? '#10B981' : undefined }}>
              {loading ? 'Submitting...' : allFree ? '🆓 Register Free' : 'Submit for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResultDetailsModal({ attemptId, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAttemptDetails(attemptId).then(data => {
      setDetails(data);
      setLoading(false);
    }).catch(err => {
      toast.error(err.message);
      onClose();
    });
  }, [attemptId]);

  if (loading) return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="glass-card" style={{ padding: 40, color: 'var(--forest)' }}>Loading analysis...</div>
    </div>
  );

  const { attempt, section1Details, section2Details } = details;

  const renderSection = (title, secDetails, sc) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, color: 'var(--forest)' }}>{title}</h3>
        <span className="badge badge-published">Score: {sc}</span>
      </div>
      {secDetails.map((q, i) => (
        <div key={i} style={{ 
          background: 'rgba(255,255,255,0.6)', border: `2px solid ${q.isCorrect ? 'rgba(16,185,129,0.3)' : (q.isAttempted ? 'rgba(248,113,113,0.3)' : 'rgba(0,0,0,0.05)')}`, 
          borderRadius: 12, padding: 20, marginBottom: 16 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--forest)' }}>Q{i + 1}</span>
            {q.isCorrect ? <span style={{ color: '#10B981', fontWeight: 700, fontSize: 13 }}>✅ Correct</span>
             : (q.isAttempted ? <span style={{ color: '#EF4444', fontWeight: 700, fontSize: 13 }}>❌ Incorrect</span>
             : <span style={{ color: '#888', fontWeight: 600, fontSize: 13 }}>○ Not Attempted</span>)}
          </div>
          <div style={{ fontSize: 15, marginBottom: 16, color: '#333', lineHeight: 1.6 }}>
            <MathText text={q.questionText} />
            {q.questionImageUrl && (
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <img src={q.questionImageUrl} alt="Question Diagram" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {Object.entries(q.options).map(([k, v]) => {
              const optText = typeof v === 'object' && v !== null ? (v.text || '') : v;
              const optImg = typeof v === 'object' && v !== null ? v.imageUrl : null;
              
              const isStudentChoice = q.selectedOption === k;
              const isActualCorrect = q.correctOption === k;
              
              let bg = 'rgba(0,0,0,0.02)';
              let border = '1px solid rgba(0,0,0,0.05)';
              let icon = '';
              
              if (isActualCorrect) {
                 bg = 'rgba(16,185,129,0.1)';
                 border = '2px solid rgba(16,185,129,0.5)';
                 icon = '✓';
              } else if (isStudentChoice && !isActualCorrect) {
                 bg = 'rgba(248,113,113,0.1)';
                 border = '2px solid rgba(248,113,113,0.5)';
                 icon = '✗';
              }
              
              return (
                <div key={k} style={{ 
                  padding: '10px 14px', background: bg, border, borderRadius: 8,
                  display: 'flex', gap: 12, alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 700, width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: '#444' }}>
                    {k}
                  </div>
                  <div style={{ flex: 1, fontSize: 14, color: '#333' }}>
                    <MathText text={optText} />
                    {optImg && (
                      <div style={{ marginTop: 8 }}><img src={optImg} alt={`Option ${k}`} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6 }} /></div>
                    )}
                  </div>
                  {icon && <div style={{ fontWeight: 800, color: isActualCorrect ? '#10B981' : '#EF4444' }}>{icon}</div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }} onClick={onClose}>
      <div className="glass-card anim-fade-up" style={{ 
        maxWidth: 800, width: '100%', height: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', padding: 0 
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(245,240,232,0.5)' }}>
          <div>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 24, color: 'var(--forest)' }}>
              Detailed Analysis
            </h2>
            <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}>{attempt.exam?.title}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888', lineHeight: 1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          <div style={{ display: 'flex', gap: 20, marginBottom: 32 }}>
             <div style={{ flex: 1, background: 'linear-gradient(135deg, var(--forest), var(--sage))', color: 'white', padding: 20, borderRadius: 16 }}>
               <div style={{ fontSize: 12, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Total Score</div>
               <div style={{ fontFamily: 'Outfit', fontSize: 36, fontWeight: 800 }}>{attempt.totalScore}<span style={{fontSize: 18, opacity: 0.7}}>/{attempt.maxScore}</span></div>
             </div>
          </div>

          {renderSection('Section 1', section1Details, attempt.section1Score)}
          {renderSection('Section 2', section2Details, attempt.section2Score)}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {

  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [myRegs, setMyRegs] = useState([]);
  const [myResults, setMyResults] = useState([]);
  
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [mode, setMode] = useState('online');
  const [showCheckout, setShowCheckout] = useState(false);
  const [fullscreenGateUrl, setFullscreenGateUrl] = useState(null);
  const [viewDetailsId, setViewDetailsId] = useState(null);
  
  const [tab, setTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const nav = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadData = async () => {
    try {
      const [e, r, a] = await Promise.all([getExams(), getMyRegistrations(), getMyAttempts()]);
      setExams(e);
      setMyRegs(r);
      setMyResults(a);
      setSelectedExamIds([]); // Reset selection on reload
    } catch (err) {
      toast.error('Failed to load data');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const registeredExamIds = myRegs.map(r => r.exam?._id);
  const availableExams = exams.filter(e => !registeredExamIds.includes(e._id));

  const handleAdmitCard = async (reg) => {
    try {
      const data = await getAdmitCardData(reg._id);
      await generateAdmitCardPDF(data);
      toast.success('Admit Card downloaded!');
    } catch (err) { toast.error(err.message); }
  };

  const toggleSelection = (eId) => {
    setSelectedExamIds(prev =>
      prev.includes(eId) ? prev.filter(id => id !== eId) : [...prev, eId]
    );
  };

  // Fee calculation — free exams count 0
  const calculateFee = () => {
    const selectedExams = exams.filter(e => selectedExamIds.includes(e._id));
    const paidExams = selectedExams.filter(e => !e.isFree);
    const n = paidExams.length;
    if (n === 0) return 0;
    if (mode === 'offline') {
      return Math.floor(n / 4) * 999 + (n % 4) * 300;
    } else {
      return Math.floor(n / 4) * 699 + (n % 4) * 200;
    }
  };

  const totalFee = calculateFee();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingBottom: selectedExamIds.length > 0 ? 80 : 0 }}>
      <NavBar user={user} logout={logout} />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <div className="glass-card mobile-stack" style={{ padding: '24px 28px', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 26, color: 'var(--forest)', marginBottom: 4 }}>
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ fontSize: 14, color: '#777' }}>Batch {user?.batch} · Stream {user?.stream}</p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 28, color: 'var(--forest)' }}>{myRegs.length}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Registered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 28, color: 'var(--sage)' }}>{myResults.filter(r => r.submittedAt).length}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Completed</div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(26,46,26,0.06)', borderRadius: 14, padding: 5, width: 'fit-content' }}>
          {[['available','📋 Available Exams'], ['myexams','📌 My Registrations'], ['results','🏆 My Results']].map(([k,v]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '10px 20px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontFamily: 'Outfit', fontWeight: 600, fontSize: 14,
              background: tab === k ? 'var(--forest)' : 'transparent',
              color: tab === k ? 'var(--cream)' : 'var(--forest)',
              transition: 'all 0.2s',
            }}>{v}</button>
          ))}
        </div>

        {/* ── Available Exams ── */}
        {tab === 'available' && (
          <div>
            {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading exams...</div>
              : availableExams.length === 0 ? (
                <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                  <p>No new exams available for your stream right now.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {availableExams.map(exam => {
                    const isSelected = selectedExamIds.includes(exam._id);
                    const dateDisplay = exam.startDate
                      ? (exam.endDate && exam.endDate !== exam.startDate
                          ? `${exam.startDate} → ${exam.endDate}`
                          : exam.startDate)
                      : (exam.date || '');
                    return (
                      <div key={exam._id} className="glass-card" 
                        style={{ 
                          padding: '24px', transition: 'all 0.2s', cursor: 'pointer',
                          border: isSelected ? '2px solid var(--forest)' : '2px solid transparent',
                          background: isSelected ? 'rgba(26,46,26,0.02)' : 'var(--cream)'
                        }}
                        onClick={() => toggleSelection(exam._id)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17, color: 'var(--forest)' }}>{exam.title}</h3>
                          <div style={{
                            width: 24, height: 24, borderRadius: 6, border: '2px solid var(--forest)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isSelected ? 'var(--forest)' : 'transparent',
                            color: 'var(--cream)', fontSize: 14, flexShrink: 0, marginLeft: 8,
                          }}>
                            {isSelected && '✓'}
                          </div>
                        </div>
                        {/* FREE / PAID badge */}
                        <div style={{ marginBottom: 10 }}>
                          {exam.isFree
                            ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>🆓 FREE — No payment needed</span>
                            : <span style={{ background: 'rgba(234,179,8,0.12)', color: '#b45309', border: '1px solid rgba(234,179,8,0.35)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>💳 PAID</span>
                          }
                        </div>
                        {[['📅', dateDisplay], ['🕐', exam.time], ['📍', exam.centerName]].map(([icon, val]) => (
                          <div key={icon} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#666' }}>
                            <span>{icon}</span><span>{val}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(122,155,122,0.1)', borderRadius: 8, fontSize: 12, color: '#555', wordBreak: 'break-word' }}>
                          📚 {exam.syllabus}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        )}

        {/* ── My Registrations ── */}
        {tab === 'myexams' && (
          <div>
            {myRegs.length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📌</div>
                <p>You haven't registered for any exam yet.</p>
                <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('available')}>Browse Exams</button>
              </div>
            ) : myRegs.map(reg => (
              <div key={reg._id} className="glass-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
                <div className="mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17, color: 'var(--forest)', marginBottom: 6 }}>
                      {reg.exam?.title} 
                      <span className={`badge badge-${reg.status}`} style={{ marginLeft: 12, textTransform: 'capitalize' }}>{reg.mode} Mode</span>
                    </h3>
                    <div style={{ fontSize: 13, color: '#777' }}>
                      {(() => {
                        const ex = reg.exam;
                        if (!ex) return null;
                        const d = ex.startDate
                          ? (ex.endDate && ex.endDate !== ex.startDate ? `${ex.startDate} → ${ex.endDate}` : ex.startDate)
                          : (ex.date || '');
                        return <>{d} · {ex.time}{reg.mode === 'offline' && ` · ${ex.centerName}`}</>;
                      })()}
                    </div>
                    {reg.rollNumber && (
                      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
                        🎫 Roll No: {reg.rollNumber}
                      </div>
                    )}
                  </div>
                  <div className="mobile-stack" style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'flex-end' }}>
                    <span className={`badge badge-${reg.status}`}>
                      {reg.status === 'pending' ? '⏳ Under Verification'
                        : reg.status === 'confirmed' ? '✅ Confirmed'
                        : '❌ Rejected'}
                    </span>
                    {reg.exam?.isFree && reg.status === 'confirmed' && (
                      <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>🆓 FREE</span>
                    )}
                    {reg.status === 'confirmed' && reg.mode === 'offline' && (
                      <button className="btn-gold" style={{ padding: '8px 18px', fontSize: 13 }}
                        onClick={() => handleAdmitCard(reg)}>
                        📄 Download Admit Card
                      </button>
                    )}
                    {reg.status === 'confirmed' && reg.mode === 'online' && (() => {
                      const ex = reg.exam;
                      if (!ex) return null;
                      const today = todayStr;
                      const start = ex.startDate || ex.date || '';
                      const end = ex.endDate || ex.date || '';
                      const isInRange = start && today >= start && (!end || today <= end);
                      return isInRange ? (
                        <button className="btn-gold" style={{ padding: '8px 18px', fontSize: 13, background: 'var(--gold)', color: 'var(--forest)' }}
                          onClick={() => setFullscreenGateUrl(`/exam-engine/exam?examId=${ex._id}&mode=online`)}>
                          ▶ Start Online Exam
                        </button>
                      ) : (
                        <div style={{ fontSize: 12, color: '#888' }}>Exam link activates on {start}</div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {tab === 'results' && (
          <div>
            {myResults.filter(a => a.submittedAt).length === 0 ? (
              <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                <p>No exam results yet. Give your first exam!</p>
              </div>
            ) : myResults.filter(a => a.submittedAt).map(attempt => (
              <div key={attempt._id} className="glass-card" style={{ padding: '20px 24px', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 17, color: 'var(--forest)', marginBottom: 6 }}>
                      {attempt.exam?.title}
                    </h3>
                    <div style={{ fontSize: 13, color: '#777' }}>{attempt.exam?.date}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 32, color: 'var(--forest)' }}>
                        {attempt.totalScore}
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>out of {attempt.maxScore}</div>
                    </div>
                    <span className={`badge badge-${attempt.resultStatus}`}>
                      {attempt.resultStatus === 'hold' ? '⚠️ Result on Hold' : '✅ Published'}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                    <span style={{ color: '#55a' }}>Section 1: <strong>{attempt.section1Score}</strong>/100</span>
                    <span style={{ color: '#a55' }}>Section 2: <strong>{attempt.section2Score}</strong>/100</span>
                  </div>
                  {attempt.resultStatus === 'published' && (
                    <button className="btn-outline" onClick={() => setViewDetailsId(attempt._id)} style={{ padding: '6px 14px', fontSize: 12 }}>
                      📊 View Detailed Analysis
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewDetailsId && (
        <ResultDetailsModal attemptId={viewDetailsId} onClose={() => setViewDetailsId(null)} />
      )}

      {/* Floating Checkout Bar */}
      {selectedExamIds.length > 0 && (() => {
        const selectedExams = availableExams.filter(e => selectedExamIds.includes(e._id));
        const allFreeSelected = selectedExams.every(ex => ex.isFree);
        return (
          <div className="anim-fade-up" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'rgba(245,240,232,0.97)', backdropFilter: 'blur(20px)',
            padding: isMobile ? '12px 16px' : '16px 40px',
            borderTop: '1px solid rgba(122,155,122,0.2)',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.1)', zIndex: 50,
            display: 'flex', alignItems: 'center',
            gap: isMobile ? 10 : 24,
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            justifyContent: isMobile ? 'space-between' : 'center',
          }}>
            {/* Mode selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? '1 1 auto' : undefined }}>
              <div style={{ fontSize: 13, color: '#777', whiteSpace: 'nowrap' }}>
                <strong>{selectedExamIds.length}</strong> exam{selectedExamIds.length > 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(26,46,26,0.06)', borderRadius: 8, padding: 3 }}>
                {['online', 'offline'].map(m => (
                  <button key={m} disabled={m === 'offline'} onClick={() => setMode(m)} style={{
                    padding: '5px 12px', border: 'none', borderRadius: 6,
                    cursor: m === 'offline' ? 'not-allowed' : 'pointer',
                    fontFamily: 'Outfit', fontWeight: 600, fontSize: 12, textTransform: 'capitalize',
                    background: mode === m ? 'var(--forest)' : 'transparent',
                    color: mode === m ? 'var(--cream)' : (m === 'offline' ? '#ccc' : 'var(--forest)'),
                    transition: 'all 0.2s',
                  }}>
                    {m}{m === 'offline' && <span style={{ fontSize: 9, marginLeft: 4, verticalAlign: 'middle', opacity: 0.8 }}>(Soon)</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Fee info */}
            <div style={{ textAlign: 'right', flex: isMobile ? '0 1 auto' : 1 }}>
              {allFreeSelected ? (
                <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: isMobile ? 16 : 20, color: '#10B981' }}>🆓 FREE</div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 1 }}>
                    {mode === 'offline' ? '₹300 (4 for ₹999)' : '₹200 (4 for ₹699)'}
                  </div>
                  <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: isMobile ? 18 : 24, color: 'var(--forest)', whiteSpace: 'nowrap' }}>
                    ₹{totalFee}
                  </div>
                </>
              )}
            </div>

            {/* Checkout button */}
            <button className="btn-primary" onClick={() => setShowCheckout(true)}
              style={{ padding: isMobile ? '10px 18px' : '12px 28px', fontSize: isMobile ? 14 : 15, whiteSpace: 'nowrap',
                background: allFreeSelected ? '#10B981' : undefined }}>
              {allFreeSelected ? '🆓 Register Free →' : 'Checkout →'}
            </button>
          </div>
        );
      })()}

      {showCheckout && (
        <RegisterModal 
          selectedExams={availableExams.filter(e => selectedExamIds.includes(e._id))} 
          mode={mode} 
          totalFee={totalFee}
          onClose={() => setShowCheckout(false)} 
          onSuccess={loadData} 
        />
      )}

      {fullscreenGateUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="glass-card-dark anim-fade-up" style={{ maxWidth: 520, width: '100%', padding: '40px 36px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🖥️</div>
            <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 24, color: '#E6EDF3', marginBottom: 16 }}>
              Full Screen Required
            </h1>
            <p style={{ color: 'rgba(230,237,243,0.7)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              This exam is monitored. You must take the exam in full-screen mode. <br/><br/>
              <strong style={{ color: '#f87171' }}>⚠️ Warning:</strong> If you exit full screen or switch tabs, your exam will be automatically submitted immediately!
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-outline" style={{ flex: 1, borderColor: '#555', color: '#ccc' }} onClick={() => setFullscreenGateUrl(null)}>
                Cancel
              </button>
              <button className="btn-gold" style={{ flex: 2, padding: '14px', fontSize: 16 }} onClick={async () => {
                try {
                  await document.documentElement.requestFullscreen();
                  nav(fullscreenGateUrl);
                  setFullscreenGateUrl(null);
                } catch (err) {
                  toast.error('Failed to enter full screen. Please allow it or use a supported browser.');
                }
              }}>
                Enter Full Screen & Start Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
