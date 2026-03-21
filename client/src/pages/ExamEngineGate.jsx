import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { verifyPasskey, login } from '../api';

export default function ExamEngineGate() {
  const [step, setStep] = useState(1); // 1 = passkey, 2 = student login
  const [passkey, setPasskey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const nav = useNavigate();

  const handlePasskey = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyPasskey(passkey);
      setStep(2);
      toast.success('Access granted. Please log in.');
    } catch {
      toast.error('Invalid passkey. Contact admin.');
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      if (data.user.role === 'admin') {
        toast.error('Admin accounts cannot take exams.');
        setLoading(false); return;
      }
      saveAuth(data.token, data.user);
      
      // Enforce fullscreen for offline mode as requested
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Fullscreen failed:", err);
        // We continue anyway as the ExamPage might handle the lock 
        // but user asked for "instantly in full screen"
      }

      toast.success(`Welcome ${data.user.name}! Loading exam...`);
      nav('/exam-engine/exam?mode=offline');
    } catch (err) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="exam-bg" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient lights */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%', width: 350, height: 350,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,169,110,0.08) 0%, transparent 70%)',
        filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', right: '10%', width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(122,155,122,0.06) 0%, transparent 70%)',
        filter: 'blur(80px)', animation: 'float 8s ease-in-out infinite reverse',
      }} />

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: 420, padding: '0 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--gold) 0%, rgba(200,169,110,0.5) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, boxShadow: '0 0 40px rgba(200,169,110,0.3)',
          }}>🔐</div>
          <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: 28, color: '#E6EDF3', marginBottom: 6 }}>
            EXAM ENGINE
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(230,237,243,0.5)' }}>
            {step === 1 ? 'Enter admin passkey to access exam portal' : 'Log in with your student credentials'}
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, maxWidth: 120, height: 4, borderRadius: 2,
              background: step >= s ? 'var(--gold)' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Passkey form */}
        {step === 1 && (
          <div className="glass-card-dark" style={{ padding: '32px 28px' }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#E6EDF3', marginBottom: 20 }}>
              🔑 Admin Passkey
            </h2>
            <form onSubmit={handlePasskey}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(230,237,243,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Passkey
                </label>
                <input
                  type="password"
                  value={passkey}
                  onChange={e => setPasskey(e.target.value)}
                  placeholder="Enter admin passkey..."
                  required
                  style={{
                    width: '100%', padding: '13px 16px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '2px solid rgba(200,169,110,0.3)',
                    borderRadius: 12, color: '#E6EDF3', fontSize: 15,
                    outline: 'none', fontFamily: 'Inter', letterSpacing: 2,
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(200,169,110,0.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(200,169,110,0.3)'}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
                color: 'var(--forest)', border: 'none', borderRadius: 12,
                fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                transition: 'opacity 0.2s', opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Verifying...' : 'Access Exam Portal →'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(230,237,243,0.3)' }}>
              This page is not publicly indexed. For authorized use only.
            </p>
          </div>
        )}

        {/* Student login form */}
        {step === 2 && (
          <div className="glass-card-dark" style={{ padding: '32px 28px' }}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: '#E6EDF3', marginBottom: 4 }}>
              👤 Student Login
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(230,237,243,0.5)', marginBottom: 20 }}>Use your registered credentials</p>
            <form onSubmit={handleLogin}>
              {[['Email', email, setEmail, 'email', 'rahul@email.com'], ['Password', password, setPassword, 'password', '••••••••']].map(([label, val, setter, type, ph]) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(230,237,243,0.6)', textTransform: 'uppercase', marginBottom: 8 }}>{label}</label>
                  <input
                    type={type} value={val} onChange={e => setter(e.target.value)}
                    placeholder={ph} required
                    style={{
                      width: '100%', padding: '13px 16px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#E6EDF3', fontSize: 15,
                      outline: 'none', fontFamily: 'Inter',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(122,155,122,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              ))}
              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                marginTop: 4, opacity: loading ? 0.7 : 1,
              }}>
                {loading ? 'Logging in...' : 'Enter Exam Hall →'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
