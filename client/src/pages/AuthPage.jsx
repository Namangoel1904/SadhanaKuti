import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { register, login } from '../api';

export default function AuthPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { saveAuth } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', batch: '', stream: 'PCM', password: '', confirmPassword: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === 'signup' && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      const payload = tab === 'signup'
        ? { name: form.name, email: form.email, phone: form.phone, batch: form.batch, stream: form.stream, password: form.password }
        : { email: form.email, password: form.password };

      const data = tab === 'signup' ? await register(payload) : await login(payload);
      saveAuth(data.token, data.user);
      toast.success(tab === 'signup' ? 'Account created! Welcome!' : 'Welcome back!');
      nav(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'white', fontFamily: 'Outfit, sans-serif' }}>
      {/* ── Left Side: Branding ───────────────── */}
      <div className="mobile-hide" style={{
        flex: 1, background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
           <div style={{
            width: 42, height: 42, background: 'linear-gradient(135deg,#2e7d32,#66bb6a)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 20,
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 22, color: '#1b5e20' }}>Sadhna Kuti</span>
        </div>

        <div style={{ maxWidth: 440 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(46,125,50,0.1)', borderRadius: 100,
            padding: '6px 16px', marginBottom: 24, color: '#2e7d32', fontWeight: 700, fontSize: 13, letterSpacing: 1
          }}>
            ✨ JOIN THE RANKERS
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#1b5e20', lineHeight: 1.2, marginBottom: 24 }}>
            Unlock your potential for <span style={{ color: '#4caf50' }}>JEE &amp; NEET</span>
          </h1>
          <p style={{ fontSize: 17, color: '#444', lineHeight: 1.6, marginBottom: 40 }}>
            Get access to personalized mock tests, real-time analytics, and curated study material from India's top educators.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>📊</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1b5e20' }}>Offline &amp; Online Test Series</div>
                <div style={{ fontSize: 14, color: '#666' }}>Track your progress at a granular level.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 44, height: 44, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>⏱️</div>
              <div>
                <div style={{ fontWeight: 700, color: '#1b5e20' }}>Timed Mock Exams</div>
                <div style={{ fontSize: 14, color: '#666' }}>Simulate the real exam environment.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Side: Form ───────────────── */}
      <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', padding: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, alignItems: 'center', marginBottom: 60 }}>
          <Link to="/" style={{
            fontSize: 14, color: '#555', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, border: '1px solid #e0e0e0',
            fontWeight: 600, transition: 'all 0.2s',
          }}>← Home</Link>
          <span style={{ fontSize: 14, color: '#666' }}>
            {tab === 'signup' ? 'Already have an account?' : "Don't have an account?"}
          </span>
          <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{
            padding: '8px 24px', borderRadius: 8, border: '1px solid #e0e0e0', background: 'white',
            fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', color: '#1b5e20'
          }}>
            {tab === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#000', marginBottom: 8 }}>
            {tab === 'signup' ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#666', marginBottom: 40 }}>
            {tab === 'signup' ? 'Fill in your details to start your preparation journey.' : 'Enter your credentials to access your dashboard.'}
          </p>

          <form onSubmit={handleSubmit}>
            {tab === 'signup' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px 20px', marginBottom: 20 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" placeholder="+91 00000 00000" value={form.phone} onChange={e => set('phone', e.target.value)} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Batch Selection</label>
                  <select className="form-input" value={form.batch} onChange={e => set('batch', e.target.value)} required style={{ background: 'white' }}>
                    <option value="">Select your target year</option>
                    <option value="2025">Target 2025</option>
                    <option value="2026">Target 2026</option>
                    <option value="Dropper">Repeater / Dropper</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Select Your Stream</label>
                  <div style={{ display: 'flex', background: '#f5f5f5', padding: 4, borderRadius: 10, marginTop: 4 }}>
                    {['PCM', 'PCB', 'BOTH'].map((s) => (
                      <button key={s} type="button" onClick={() => set('stream', s)} style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                        background: form.stream === s ? '#4caf50' : 'transparent',
                        color: form.stream === s ? 'white' : '#666'
                      }}>
                        {s === 'PCM' ? 'PCM (JEE)' : s === 'PCB' ? 'PCB (NEET)' : 'BOTH'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'login' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 20 }}>
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="john@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>

            {tab === 'signup' && (
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">Confirm Password</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required />
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '16px', background: '#1b5e20', color: 'white', border: 'none',
              borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}>
              {loading ? 'Processing...' : tab === 'signup' ? 'Create Account →' : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#666', lineHeight: 1.5, marginTop: 40 }}>
            By signing up, you agree to our <span style={{ color: '#4caf50', cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#4caf50', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
