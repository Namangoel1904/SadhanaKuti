import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ══════════════════════════════════════════════
   DESIGN TOKENS  (original Sadhna Kuti palette)
   ══════════════════════════════════════════════ */
const T = {
  bg:       '#F5F0E8',           // cream
  bgAlt:    '#EDE6D6',           // cream-dark
  forest:   '#1A2E1A',           // primary dark
  forestMid:'#2A4A2A',
  sage:     '#7A9B7A',
  gold:     '#C8A96E',
  goldLight:'#DDBF8A',
  white:    '#ffffff',
  charcoal: '#2C2C2C',
  muted:    '#666666',           // paragraph text
  faint:    'rgba(0,0,0,0.35)',  // footnotes
  border:   'rgba(26,46,26,0.08)',
};

/* 7-layer neomorphic shadow — exact OrbAI spec */
const NEO = [
  '0px 0.71px 0.71px -0.58px rgba(0,0,0,0.07)',
  '0px 1.81px 1.81px -1.17px rgba(0,0,0,0.07)',
  '0px 3.62px 3.62px -1.75px rgba(0,0,0,0.07)',
  '0px 6.87px 6.87px -2.33px rgba(0,0,0,0.06)',
  '0px 13.65px 13.65px -2.92px rgba(0,0,0,0.05)',
  '0px 30px 30px -3.5px rgba(0,0,0,0.03)',
  'inset 0px 3px 1px 0px rgb(255,255,255)',
].join(', ');

/* hover inset (nav link style from OrbAI) */
const NEO_HOVER = 'inset 0px 1px 2px 0px rgba(0,0,0,0.3)';

/* ══════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════ */
const NAV_LINKS = ['Features', 'Pricing', 'About', 'Process', 'Contact'];

const STATS = [
  { value: '100%', label: 'Strict Anti-Cheat' },
  { value: 'Instant', label: 'Real-Time Results' },
  { value: 'NTA Pattern', label: 'Replica UI' },
  { value: 'Dual', label: 'Online/Offline Modes' },
];

const FEATURES = [
  { icon: '🎯', title: 'MHT-CET Pattern',      desc: 'Exact replica of the real exam interface — 2-section auto-lock, color-coded question palette.' },
  { icon: '📄', title: 'Instant Admit Cards',   desc: 'NTA-style admit cards auto-generated with roll number, exam center, and full schedule.' },
  { icon: '📊', title: 'Real-Time Results',     desc: 'Submit your exam and get a section-wise score breakdown instantly on your dashboard.' },
  { icon: '🛡️', title: 'Integrity Monitoring',  desc: 'Full-screen exam mode with auto-submit on exit and AI monitoring. Every exam is 100% fair.' },
  { icon: '⚡', title: 'Live Dashboard',        desc: 'Admin adds a new exam — it reflects immediately on your stream-specific dashboard.' },
  { icon: '🏆', title: 'PCM & PCB Tracks',      desc: 'Separate, tailored tracks for JEE aspirants (PCM) and NEET aspirants (PCB) on one platform.' },
];

const PROCESS = [
  { num: '01', title: 'Register & Choose Stream',  desc: 'Sign up in 60 seconds, select your stream (PCM / PCB / Both), and browse upcoming exams.' },
  { num: '02', title: 'Register & Pay Fast',        desc: 'Select exams, choose Online or Offline mode, upload your payment screenshot for instant verification.' },
  { num: '03', title: 'Appear & Conquer',            desc: 'Get your Admit Card, appear in the real-replica interface, and review your results the same day.' },
];

const TICKER_ITEMS = [
  'MHT-CET 2026 Pattern', 'JEE Main Prep', 'NEET Aspirants', 'Instant Admit Cards',
  'Online & Offline Modes', 'Real Results', 'PCM & PCB Tracks', 'Fair Exams',
];

const PRICING = {
  offline: [
    { name: 'Per Exam', price: 300, original: null, popular: false, desc: 'Try any single exam at your own pace.', cta: 'Get Started', features: ['Access to any 1 exam','Offline exam center','NTA-style Admit Card','Real-time result','Section-wise score report'] },
    { name: 'Bundle — 4 Exams', price: 999, original: 1200, popular: true, desc: 'Best value — appear in 4 exams and save ₹201.', cta: 'Get Started', features: ['Access to any 4 exams','Offline exam center','NTA-style Admit Cards','Real-time result for each','Section-wise score report','Priority verification'] },
    { name: 'Full Series', price: null, original: null, popular: false, desc: 'All upcoming exams in one go. Contact us for pricing.', cta: 'Contact Us', features: ['All exams in the series','Offline exam center','All Admit Cards included','Priority verification','Dedicated support','Exclusive result analysis'] },
  ],
  online: [
    { name: 'Per Exam', price: 200, original: null, popular: false, desc: 'Appear for any single exam from home.', cta: 'Get Started', features: ['Access to any 1 exam','Appear from home','Real-time result','Section-wise score report','Secure fullscreen mode'] },
    { name: 'Bundle — 4 Exams', price: 699, original: 800, popular: true, desc: 'Max value — appear in 4 online exams and save ₹101.', cta: 'Get Started', features: ['Access to any 4 exams','Appear from home','Real-time result for each','Section-wise score report','Secure fullscreen mode','Priority verification'] },
    { name: 'Full Series', price: null, original: null, popular: false, desc: 'All upcoming online exams in one bundle. Contact for pricing.', cta: 'Contact Us', features: ['All online exams in series','Appear from anywhere','Priority verification','Dedicated support','Exclusive result analysis','Custom scheduling'] },
  ],
};

/* ══════════════════════════════════════════════
   HOOKS
   ══════════════════════════════════════════════ */

/* Scroll-reveal (one-shot, IntersectionObserver) */
function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

/* ══════════════════════════════════════════════
   COMPONENTS
   ══════════════════════════════════════════════ */

/* ─── Glass / Neo Button ──────────────────── */
function NeoBtn({ to, children, dark, style = {}, onClick }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: '12px 28px',
    borderRadius: 14, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
    cursor: 'pointer', textDecoration: 'none',
    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    letterSpacing: 0.2, whiteSpace: 'nowrap',
    ...(dark ? {
      background: T.forest, color: T.white,
      boxShadow: '0 4px 20px rgba(26,46,26,0.25)',
      border: 'none',
    } : {
      background: T.bg, color: T.charcoal,
      boxShadow: NEO,
      border: 'none',
    }),
    ...style,
  };
  const isHash = to?.startsWith('#');
  const Comp = isHash ? 'a' : (to ? Link : 'button');
  const props = isHash ? { href: to } : (to ? { to } : { onClick, type: 'button' });
  return (
    <Comp {...props} style={base}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        if (!dark) e.currentTarget.style.boxShadow = NEO_HOVER;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        if (!dark) e.currentTarget.style.boxShadow = NEO;
      }}
    >{children}</Comp>
  );
}

/* ─── Feature Card ────────────────────────── */
function FeatureCard({ icon, title, desc, delay = 0 }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{
      background: T.bg, borderRadius: 20, padding: '36px 28px',
      boxShadow: NEO,
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(60px)',
      transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: T.bg, boxShadow: NEO,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 20,
      }}>{icon}</div>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 17, color: T.forest, marginBottom: 10 }}>{title}</h3>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

/* ─── Pricing Section ─────────────────────── */
function PricingSection() {
  const [mode, setMode] = useState('online');
  const [ref, vis] = useReveal();
  const plans = PRICING[mode];
  return (
    <section id="pricing" ref={ref} style={{ padding: 'clamp(80px,10vw,140px) clamp(20px,5vw,60px)', background: T.bg }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 16 }}>Transparent Pricing</p>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: T.forest, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>
            Simple Price For All
          </h2>
          <p style={{ color: T.muted, fontSize: 16, maxWidth: 420, margin: '0 auto 40px' }}>No subscriptions. Pay per exam or bundle for maximum savings.</p>

          {/* Toggle */}
          <div style={{
            display: 'inline-flex', gap: 2, background: '#ebebeb',
            borderRadius: 100, padding: 4,
          }}>
            {[
              { key: 'online', label: 'Online', badge: 'Active' },
              { key: 'offline', label: 'Offline', badge: 'Soon' },
            ].map(o => (
              <button key={o.key} onClick={() => setMode(o.key)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 24px', borderRadius: 100, border: 'none', cursor: 'pointer',
                fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14,
                background: mode === o.key ? T.white : 'transparent',
                color: mode === o.key ? T.forest : '#888',
                boxShadow: mode === o.key ? NEO : 'none',
                transition: 'all 0.25s ease',
              }}>
                {o.label}
                {o.badge && <span style={{ background: T.forest, color: T.white, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{o.badge}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          opacity: vis ? 1 : 0,
          transform: vis ? 'translateY(0)' : 'translateY(60px)',
          transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)`,
        }}>
          {mode === 'offline' ? (
            <div style={{
              background: 'rgba(26,46,26,0.03)',
              borderRadius: 24, padding: '60px 40px',
              border: '2px dashed rgba(26,46,26,0.1)',
              textAlign: 'center', maxWidth: 500, width: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20
            }}>
              <div style={{ fontSize: 48 }}>📍</div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: 28, fontWeight: 700, color: T.forest }}>Offline Exams Coming Soon</h3>
              <p style={{ color: T.muted, lineHeight: 1.6 }}>
                We are currently finalizing our offline partner centers across Maharashtra. 
                Stay tuned for physical exam center bookings in the upcoming months!
              </p>
              <button 
                onClick={() => setMode('online')}
                style={{ 
                  background: T.forest, color: T.white, border: 'none', 
                  padding: '12px 32px', borderRadius: 100, fontWeight: 600, cursor: 'pointer',
                  marginTop: 10
                }}
              >
                Book Online Exam Now →
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'stretch', width: '100%' }}>
              {plans.map((plan, i) => (
                <div key={`${mode}-${i}`} style={{
                  background: plan.popular ? T.forest : T.bg,
                  borderRadius: 20, padding: '36px 28px',
                  display: 'flex', flexDirection: 'column',
                  boxShadow: NEO,
                }}>
              {/* Name + badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <span style={{ fontWeight: 600, fontSize: 15, color: plan.popular ? 'rgba(255,255,255,0.6)' : T.muted }}>{plan.name}</span>
                {plan.popular && <span style={{ background: 'rgba(200,169,110,0.2)', color: T.gold, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(200,169,110,0.35)' }}>✦ Popular</span>}
              </div>
              {/* Price */}
              <div style={{ marginBottom: 8 }}>
                {plan.price ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 52, letterSpacing: -2, color: plan.popular ? '#F5F0E8' : T.forest, lineHeight: 1 }}>₹{plan.price}</span>
                    <span style={{ fontWeight: 500, fontSize: 14, color: plan.popular ? 'rgba(245,240,232,0.5)' : '#888', marginBottom: 6 }}>{plan.name.includes('Bundle') ? '/bundle' : '/exam'}</span>
                  </div>
                ) : (
                  <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 40, letterSpacing: -1, color: plan.popular ? '#F5F0E8' : T.forest, lineHeight: 1 }}>Custom</span>
                )}
                {plan.original && (
                  <div style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.45)' : '#888', marginTop: 6 }}>
                    <s>₹{plan.original}</s> · <span style={{ fontWeight: 700, color: plan.popular ? T.gold : T.sage }}>Save ₹{plan.original - plan.price}</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, color: plan.popular ? 'rgba(255,255,255,0.45)' : T.muted, lineHeight: 1.7, marginBottom: 28 }}>{plan.desc}</p>

              {/* CTA */}
              <NeoBtn 
                to={plan.cta === 'Contact Us' ? '#contact' : '/auth'} 
                dark={plan.popular} 
                style={{ width: '100%', marginBottom: 28 }}
              >
                {plan.cta} →
              </NeoBtn>

              <div style={{ height: 1, background: plan.popular ? 'rgba(255,255,255,0.1)' : T.border, marginBottom: 24 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: plan.popular ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }}>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: plan.popular ? 'rgba(255,255,255,0.12)' : 'rgba(26,46,26,0.06)',
                      color: plan.popular ? T.white : T.forest,
                      fontSize: 10, fontWeight: 900,
                    }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: '#aaa' }}>All prices are one-time. No hidden fees or subscriptions.</p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   MAIN LANDING PAGE
   ══════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [isMobile, setIsMobile]       = useState(window.innerWidth <= 809);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ loading: false, success: false, error: '' });
  const heroRef = useRef(null);

  /* reveal refs */
  const [statsRef, statsVis]     = useReveal();
  const [aboutRef, aboutVis]     = useReveal();
  const [processRef, processVis] = useReveal();
  const [ctaRef, ctaVis]         = useReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => setIsMobile(window.innerWidth <= 809);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const obs = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { threshold: 0.1 });
    obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);


  const hideNavBtns = isMobile && heroVisible;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', overflowX: 'hidden', color: T.charcoal }}>

      {/* ═══ NAVBAR ══════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: isMobile ? 12 : 0, left: isMobile ? 12 : 0, right: isMobile ? 12 : 0, zIndex: 100,
        padding: isMobile ? '12px 16px' : (scrolled ? '10px 48px' : '20px 48px'),
        background: isMobile ? T.bg : (scrolled ? 'rgba(245,240,232,0.92)' : 'rgba(245,240,232,0.2)'),
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        borderRadius: isMobile ? 16 : 0,
        boxShadow: isMobile ? '0 8px 32px rgba(0,0,0,0.12)' : (scrolled ? '0 1px 0 rgba(26,46,26,0.08)' : 'none'),
        transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between',
        animation: 'navSlideIn 1.4s cubic-bezier(0.16,1,0.3,1) 0.6s both',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          flexShrink: 0
        }}>
          <img src="/logo.webp" alt="Sadhna Kuti" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 17, color: T.forest,
            whiteSpace: 'nowrap'
          }}>
            Sadhna Kuti
          </span>
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 4 }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} style={{
                padding: '8px 18px', borderRadius: 100,
                color: (!isMobile && heroVisible) ? T.bg : T.forest,
                fontWeight: 500, fontSize: 14, textDecoration: 'none',
                transition: 'color 0.3s ease, background 0.25s ease-in-out, border-color 0.25s ease-in-out, backdrop-filter 0.25s ease-in-out',
                border: '1px solid transparent',
                display: 'inline-block',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = (!isMobile && heroVisible)
                    ? 'rgba(122,155,122,0.25)'
                    : 'rgba(26,46,26,0.08)';
                  e.currentTarget.style.borderColor = (!isMobile && heroVisible)
                    ? 'rgba(122,155,122,0.45)'
                    : 'rgba(26,46,26,0.15)';
                  e.currentTarget.style.backdropFilter = 'blur(10px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.backdropFilter = 'none';
                }}
              >{l}</a>
            ))}
          </div>
        )}

        {/* CTA + hamburger */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          {!hideNavBtns && (
            <NeoBtn to="/auth" dark style={{ padding: '10px 24px', fontSize: 13 }}>Get Started →</NeoBtn>
          )}
          {isMobile && (
            <button onClick={() => setMenuOpen(o => !o)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              width: 32, height: 32, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 5,
            }}>
              <span style={{ display: 'block', width: 20, height: 2, background: T.charcoal, borderRadius: 1, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(2.5px, 2.5px)' : 'none' }} /> {/* Changed T.black to T.charcoal */}
              <span style={{ display: 'block', width: 20, height: 2, background: T.charcoal, borderRadius: 1, transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} /> {/* Changed T.black to T.charcoal */}
              <span style={{ display: 'block', width: 20, height: 2, background: T.charcoal, borderRadius: 1, transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(2.5px, -2.5px)' : 'none' }} /> {/* Changed T.black to T.charcoal */}
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && isMobile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: T.bg, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          animation: 'fadeIn 0.3s ease',
        }}>
          {NAV_LINKS.map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{
              padding: '14px 32px', borderRadius: 14, width: 'calc(100% - 40px)',
              textAlign: 'center',
              color: T.forest, fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 16,
              textDecoration: 'none', boxShadow: NEO, background: T.bg,
            }}>{l}</a>
          ))}
          <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
            <NeoBtn to="/auth">Login</NeoBtn>
            <NeoBtn to="/auth" dark>Register ↗</NeoBtn>
          </div>
        </div>
      )}

      {/* ═══ HERO ════════════════════════════════ */}
      <section ref={heroRef} style={{
        minHeight: '100vh', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 100, paddingBottom: 80,
        paddingLeft: 'clamp(20px,5vw,60px)', paddingRight: 'clamp(20px,5vw,60px)',
        textAlign: 'center', overflow: 'hidden',
        backgroundImage: "url('/hero.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        {/* Dark gradient overlay — lighter so more of hero image shows */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'linear-gradient(to bottom, rgba(10,20,10,0.28) 0%, rgba(10,20,10,0.45) 60%, rgba(10,20,10,0.62) 100%)',
        }} />

        {/* Badge */}
        <div style={{
          position: 'relative', zIndex: 2,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 100, padding: '8px 20px', marginBottom: 36,
          animation: 'slideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.gold, display: 'inline-block' }} />
          <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.6 }}>
            India's Most Advanced Test Series Platform
          </span>
        </div>

        {/* ORB circle */}
        <div style={{
          position: 'relative', zIndex: 2, marginBottom: 28,
          width: 88, height: 88, borderRadius: '50%',
          background: `linear-gradient(135deg, ${T.forest}, ${T.forestMid})`,
          boxShadow: '0 0 0 8px rgba(200,169,110,0.18), 0 12px 48px rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'slideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.65s both',
        }}>
          <img src="/logo.webp" alt="Logo" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
        </div>

        {/* Heading */}
        <div style={{
          position: 'relative', zIndex: 2, maxWidth: 820,
          animation: 'slideUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.8s both',
        }}>
          <h1 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 900,
            fontSize: 'clamp(48px, 8vw, 64px)',
            lineHeight: 1.04, letterSpacing: -2, marginBottom: 24,
            textShadow: '0 4px 32px rgba(0,0,0,0.5)',
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ffdf70 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              textShadow: '0 0 30px rgba(255,223,112,0.3)',
            }}>Unlock Your Potential</span>
            <br />
            <span style={{ color: 'rgba(255,255,255,0.98)', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>with Sadhna Kuti</span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: 'rgba(255,255,255,0.70)',
            lineHeight: 1.75, maxWidth: 580, margin: '0 auto 48px',
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}>
            Practice MHT-CET, JEE &amp; NEET-pattern exams in a real exam interface.
            Register, get your Admit Card, and appear Online or Offline — all in one portal.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <NeoBtn to="/auth" dark style={{ padding: '15px 40px', fontSize: 16, background: T.gold, color: '#1A2E1A', boxShadow: `0 4px 24px rgba(200,169,110,0.45)` }}>
              Start for Free →
            </NeoBtn>
            <NeoBtn to="#features" style={{
              padding: '15px 36px', fontSize: 16,
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              boxShadow: 'none',
              textDecoration: 'none',
            }}>
              Why Choose Us?
            </NeoBtn>
          </div>
        </div>

      </section>

      {/* ═══ TICKER ══════════════════════════════ */}
      <div style={{ overflow: 'hidden', background: T.forest, padding: '14px 0' }}>
        <div style={{ display: 'flex', animation: 'ticker 30s linear infinite', width: 'max-content' }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600,
              color: 'rgba(255,255,255,0.6)', paddingRight: 48, whiteSpace: 'nowrap',
            }}>
              {item} <span style={{ opacity: 0.3, marginLeft: 20 }}>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ═══ STATS ═══════════════════════════════ */}
      <section ref={statsRef} style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: T.bg, borderRadius: 20, padding: '28px 20px', textAlign: 'center',
              boxShadow: NEO,
              opacity: statsVis ? 1 : 0,
              transform: statsVis ? 'translateY(0)' : 'translateY(60px)',
              transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 100}ms`,
            }}>
              <div style={{ 
                fontFamily: 'Outfit, sans-serif', fontWeight: 900, 
                fontSize: 'clamp(18px, 3.2vw, 29px)', color: T.charcoal, 
                lineHeight: 1.2,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 6, fontWeight: 500, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ WHY CHOOSE US (Features) ═══════════ */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,60px)', background: T.bgAlt }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 16 }}>Why Choose Us</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: T.forest, letterSpacing: -1.5, lineHeight: 1.1 }}>
              All features in 1 tool
            </h2>
            <p style={{ color: '#666', fontSize: 16, marginTop: 16, maxWidth: 480, margin: '16px auto 0' }}>
              Discover features that simplify exam prep & elevate your score.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => <FeatureCard key={i} {...f} delay={i * 80} />)}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═════════════════════════════ */}
      <PricingSection />

      {/* ═══ ABOUT ═══════════════════════════════ */}
      <section id="about" ref={aboutRef} style={{ padding: 'clamp(80px,10vw,140px) clamp(20px,5vw,60px)', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center' }}>
          <div style={{
            flex: '1 1 420px',
            opacity: aboutVis ? 1 : 0, transform: aboutVis ? 'translateX(0)' : 'translateX(-50px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 20 }}>Our Vision</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 900, color: T.forest, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 24 }}>
              Practice with<br />Purpose.
            </h2>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.85, marginBottom: 20 }}>
              Sadhna Kuti is more than a test series — it's a dedicated environment for serious aspirants.
              We replicate MHT-CET, JEE, and NEET exams so you build the stamina for top results.
            </p>
            <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.85 }}>
              Every question, every timer tick, every interface detail — meticulously crafted so the real exam
              feels like just another day at Sadhna Kuti.
            </p>
          </div>
          <div style={{
            flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 16,
            opacity: aboutVis ? 1 : 0, transform: aboutVis ? 'translateX(0)' : 'translateX(50px)',
            transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s',
          }}>
            {[
              { icon: '🛡️', label: '100% Secure Exams',  sub: 'Fullscreen enforcement & anti-cheat monitoring.' },
              { icon: '⚡', label: 'Instant Analytics',  sub: 'Detailed score breakdown immediately after submission.' },
              { icon: '🎯', label: 'NTA Standard UI',    sub: 'Practice in the exact interface of final exams.' },
            ].map((c, i) => (
              <div key={i} style={{
                background: T.bg, borderRadius: 18, padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 18,
                boxShadow: NEO,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: T.bg, boxShadow: NEO,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{c.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: T.forest, marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 13, color: '#888' }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROCESS ═════════════════════════════ */}
      <section id="process" ref={processRef} style={{
        padding: 'clamp(80px,10vw,140px) clamp(20px,5vw,60px)',
        background: T.forest,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 16 }}>Simple & Scalable</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 800, color: '#F5F0E8', letterSpacing: -1.5, lineHeight: 1.1 }}>
              A transparent process
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 16, maxWidth: 450, margin: '16px auto 0' }}>
              Three steps — register, pay, conquer.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {PROCESS.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 20, padding: '40px 28px',
                opacity: processVis ? 1 : 0,
                transform: processVis ? 'translateY(0)' : 'translateY(60px)',
                transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms`,
              }}>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 64, color: 'rgba(200,169,110,0.12)', lineHeight: 1, marginBottom: 24, letterSpacing: -2 }}>{p.num}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, color: '#F5F0E8' }}>{p.title}</h3>
                  <span style={{ color: 'rgba(245,240,232,0.2)', fontSize: 18 }}>•••</span>
                </div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.8 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CONTACT ═════════════════════════════ */}
      <section id="contact" style={{ padding: 'clamp(80px,10vw,140px) clamp(20px,5vw,60px)', background: T.bgAlt }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 16 }}>Get in Touch</p>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: T.forest, letterSpacing: -1.5, lineHeight: 1.1 }}>
              Let's connect.
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {/* Form */}
            <div style={{
              flex: '1 1 340px', background: T.bg, borderRadius: 20, padding: 36,
              boxShadow: NEO,
            }}>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setContactStatus({ loading: true, success: false, error: '' });
                  try {
                    const res = await fetch('http://localhost:5000/api/messages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contactForm),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setContactStatus({ loading: false, success: true, error: '' });
                      setContactForm({ name: '', email: '', message: '' });
                      setTimeout(() => setContactStatus({ loading: false, success: false, error: '' }), 3000);
                    } else {
                      setContactStatus({ loading: false, success: false, error: data.error || 'Failed to send message' });
                    }
                  } catch (err) {
                    setContactStatus({ loading: false, success: false, error: 'Network error. Please try again later.' });
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <input 
                  placeholder="Your Name" 
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  style={{
                    padding: '14px 18px', borderRadius: 12,
                    border: `1px solid ${T.border}`, background: T.white,
                    fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', color: T.charcoal,
                    transition: 'box-shadow 0.2s', boxShadow: 'none',
                  }}
                  onFocus={e => e.target.style.boxShadow = NEO_HOVER}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                <input 
                  placeholder="Email Address" 
                  type="email"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  style={{
                    padding: '14px 18px', borderRadius: 12,
                    border: `1px solid ${T.border}`, background: T.white,
                    fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', color: T.charcoal,
                    transition: 'box-shadow 0.2s', boxShadow: 'none',
                  }}
                  onFocus={e => e.target.style.boxShadow = NEO_HOVER}
                  onBlur={e => e.target.style.boxShadow = 'none'}
                />
                <textarea 
                  placeholder="How can we help?" 
                  rows={4} 
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  style={{
                    padding: '14px 18px', borderRadius: 12,
                    border: `1px solid ${T.border}`, background: T.white,
                    fontFamily: 'Inter, sans-serif', fontSize: 14, outline: 'none', resize: 'none', color: T.charcoal,
                  }} 
                />
                <button type="submit" disabled={contactStatus.loading} style={{
                  padding: 14, borderRadius: 14, border: 'none', cursor: contactStatus.loading ? 'not-allowed' : 'pointer',
                  background: contactStatus.loading ? T.muted : `linear-gradient(135deg, ${T.forest}, ${T.forestMid})`, 
                  color: '#F5F0E8',
                  fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14,
                  boxShadow: contactStatus.loading ? 'none' : '0 4px 20px rgba(26,46,26,0.3)', 
                  transition: 'transform 0.2s', opacity: contactStatus.loading ? 0.7 : 1
                }}
                  onMouseEnter={e => { if(!contactStatus.loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { if(!contactStatus.loading) e.currentTarget.style.transform = 'translateY(0)' }}
                >{contactStatus.loading ? 'Sending...' : 'Send Message →'}</button>
                {contactStatus.success && <div style={{ color: T.sage, fontSize: 13, textAlign: 'center', fontWeight: 600 }}>Message sent successfully! We'll be in touch.</div>}
                {contactStatus.error && <div style={{ color: '#e74c3c', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>{contactStatus.error}</div>}
              </form>
            </div>
            {/* Info */}
            <div style={{ flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
              {[
                { icon: '📞', label: 'Phone',    value: '+91 98340 68826' },
                { icon: '✉️', label: 'Email',    value: 'sadhanakuti16@gmail.com' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  background: T.bg, borderRadius: 16, padding: '18px 20px',
                  boxShadow: NEO,
                }}>
                  <span style={{ fontSize: 20, marginTop: 2 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.forest, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 14, color: T.muted }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA BANNER ═════════════════════════ */}
      <section ref={ctaRef} style={{
        padding: 'clamp(80px,10vw,140px) clamp(20px,5vw,60px)',
        background: `linear-gradient(135deg, ${T.forest} 0%, ${T.forestMid} 60%, ${T.forest} 100%)`, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Faint ripple rings */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, pointerEvents: 'none' }}>
          {[1, 0.65, 0.35].map((s, i) => (
            <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1px solid rgba(200,169,110,${0.06 + i * 0.04})`, transform: `scale(${s})` }} />
          ))}
        </div>

        <div style={{
          position: 'relative', zIndex: 1,
          opacity: ctaVis ? 1 : 0, transform: ctaVis ? 'translateY(0)' : 'translateY(40px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.sage, textTransform: 'uppercase', marginBottom: 24 }}>Ready? Let's go.</p>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontWeight: 800,
            fontSize: 'clamp(28px,5vw,56px)', letterSpacing: -1.5,
            color: '#F5F0E8', lineHeight: 1.1, marginBottom: 20,
          }}>
            Ready to Crack MHT-CET in 2026?
          </h2>
          <p style={{ color: 'rgba(245,240,232,0.6)', fontSize: 16, marginBottom: 44, maxWidth: 440, margin: '0 auto 44px' }}>
            Join 10,000+ students already practicing on India's smartest exam portal.
          </p>
          <NeoBtn to="/auth" style={{
            fontSize: 17, padding: '16px 48px',
            background: 'rgba(200,169,110,0.15)', color: T.gold, border: `1px solid rgba(200,169,110,0.4)`,
            boxShadow: '0 4px 20px rgba(200,169,110,0.15), inset 0 1px 0 rgba(200,169,110,0.2)',
          }}>Register Now — It's Free ✦</NeoBtn>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════ */}
      <footer style={{ background: '#0D1117', padding: 'clamp(48px,6vw,80px) clamp(20px,5vw,60px)', position: 'relative' }}>
        {/* Radial white gradient overlay (OrbAI style) */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(50% 50% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 100%)',
        }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 40, marginBottom: 48 }}>
            <div style={{ flex: '1 1 260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <img src="/logo.webp" alt="Sadhna Kuti" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: T.white }}>Sadhna Kuti</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, lineHeight: 1.8, maxWidth: 260 }}>
                The premier destination for competitive exam preparation in Maharashtra.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 60, flexWrap: 'wrap' }}>
              {[
                { title: 'Platform', links: NAV_LINKS },
                { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service'] },
              ].map(col => (
                <div key={col.title}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 18 }}>{col.title}</div>
                  {col.links.map(l => (
                    <div key={l} style={{ marginBottom: 12 }}>
                      <a href="#" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                      >{l}</a>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 28 }} />
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center' }}>
            SADHNA KUTI © 2026. Empowering Aspirants Across Maharashtra.
          </p>
        </div>
      </footer>

      {/* ═══ KEYFRAMES ═══════════════════════════ */}
      <style>{`
        html { scroll-behavior: smooth; }
        @keyframes navSlideIn {
          from { opacity: 0; transform: translateY(-70px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
