import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getExams, createExam, updateExam, deleteExam,
  getAdminRegistrations, verifyRegistration,
  uploadQuestionPaper, getQuestionPaper,
  getAdminAttempts, getAdmitCardData,
  getMessages, deleteMessage,
} from '../api';
import MathText from '../components/MathText';


const TABS = [
  { key: 'exams', icon: '📋', label: 'Exams' },
  { key: 'verifications', icon: '✅', label: 'Verifications' },
  { key: 'questions', icon: '📝', label: 'Question Papers' },
  { key: 'results', icon: '🏆', label: 'Results' },
  { key: 'students', icon: '👥', label: 'Students' },
  { key: 'messages', icon: '✉️', label: 'Messages' },
];

function ExamsTab() {
  const [exams, setExams] = useState([]);
  const [modal, setModal] = useState(null); // null | 'create' | exam object
  const [form, setForm] = useState({ 
    title: '', date: '', time: '', syllabus: '', centerName: '', centerAddress: '', stream: 'PCM', feeAmount: 200, qrImageUrl: '',
    subjectConfig: {
      section1: { partA: { label: 'Physics', count: 50 }, partB: { label: 'Chemistry', count: 50 } },
      section2: { label: 'Biology' } // Changed later based on stream
    }
  });

  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const e = await getExams(); setExams(e); } catch {}
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ 
      title: '', date: '', time: '', syllabus: '', centerName: '', centerAddress: '', stream: 'PCM', feeAmount: 200, qrImageUrl: '',
      subjectConfig: {
        section1: { partA: { label: 'Physics', count: 50 }, partB: { label: 'Chemistry', count: 50 } },
        section2: { label: 'Mathematics' }
      }
    });
    setModal('create');
  };
  const openEdit = (exam) => { 
    setForm({ 
      ...exam, 
      subjectConfig: exam.subjectConfig || {
        section1: { partA: { label: 'Physics', count: 50 }, partB: { label: 'Chemistry', count: 50 } },
        section2: { label: exam.stream === 'PCB' ? 'Biology' : 'Mathematics' }
      }
    }); 
    setModal(exam); 
  };


  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'create') await createExam(form);
      else await updateExam(modal._id, form);
      toast.success(modal === 'create' ? 'Exam created!' : 'Exam updated!');
      setModal(null); load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this exam?')) return;
    try { await deleteExam(id); toast.success('Exam removed'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const F = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)' }}>Manage Exams</h2>
        <button className="btn-primary" onClick={openCreate}>+ Create Exam</button>
      </div>

      {exams.map(exam => (
        <div key={exam._id} className="glass-card" style={{ padding: '18px 22px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--forest)', marginBottom: 4 }}>{exam.title}</h3>
              <div style={{ fontSize: 13, color: '#777' }}>{exam.date} · {exam.time} · {exam.centerName} · <span className="badge badge-pending">{exam.stream}</span></div>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>₹{exam.feeAmount}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => openEdit(exam)}>Edit</button>
              <button className="btn-outline btn-danger" style={{ padding: '7px 16px', fontSize: 13, color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleDelete(exam._id)}>Remove</button>
            </div>
          </div>
        </div>
      ))}

      {/* Exam Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
          onClick={() => setModal(null)}>
          <div className="glass-card" style={{ maxWidth: 520, width: '100%', padding: '32px 28px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 22, color: 'var(--forest)', marginBottom: 24 }}>
              {modal === 'create' ? 'Create New Exam' : 'Edit Exam'}
            </h2>
            <form onSubmit={handleSave}>
              {[['title','Exam Title','MHT-CET Mock Test 01', 'text'],['date','Date (YYYY-MM-DD)','2026-06-15', 'date'],['time','Time (HH:MM)','09:00', 'time'],['syllabus','Syllabus / Topics','Physics Ch 1-5, Chemistry Ch 1-4...', 'text'],['centerName','Center Name','Pune Exam Center', 'text'],['centerAddress','Center Address','123, FC Road, Pune - 411004', 'text'],['qrImageUrl','QR Image URL (optional)','https://...', 'url']].map(([key, label, ph, type]) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label className="form-label">{label}</label>
                  <input className="form-input" type={type} placeholder={ph} value={form[key] || ''} onChange={e => F(key, e.target.value)} required={key !== 'qrImageUrl'} />
                </div>
              ))}
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">Stream</label>
                <select className="form-input" value={form.stream} onChange={e => {
                  const s = e.target.value;
                  setForm(f => ({
                    ...f,
                    stream: s,
                    subjectConfig: {
                      ...f.subjectConfig,
                      section2: { label: s === 'PCB' ? 'Biology' : 'Mathematics' }
                    }
                  }));
                }}>
                  <option value="PCM">PCM (JEE/MHT-CET)</option>
                  <option value="PCB">PCB (NEET/PCB)</option>
                  <option value="BOTH">BOTH</option>
                </select>
              </div>

              {/* Subject Config */}
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--forest)' }}>Section 1 Configuration</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Part A Label</label>
                    <input className="form-input" value={form.subjectConfig.section1.partA.label} 
                      onChange={e => setForm(f => ({...f, subjectConfig: {...f.subjectConfig, section1: {...f.subjectConfig.section1, partA: {...f.subjectConfig.section1.partA, label: e.target.value}} }}))} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Part A Q Count</label>
                    <input className="form-input" type="number" value={form.subjectConfig.section1.partA.count} 
                      onChange={e => setForm(f => ({...f, subjectConfig: {...f.subjectConfig, section1: {...f.subjectConfig.section1, partA: {...f.subjectConfig.section1.partA, count: Number(e.target.value)}} }}))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Part B Label</label>
                    <input className="form-input" value={form.subjectConfig.section1.partB.label} 
                      onChange={e => setForm(f => ({...f, subjectConfig: {...f.subjectConfig, section1: {...f.subjectConfig.section1, partB: {...f.subjectConfig.section1.partB, label: e.target.value}} }}))} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Part B Q Count</label>
                    <input className="form-input" type="number" value={form.subjectConfig.section1.partB.count} 
                      onChange={e => setForm(f => ({...f, subjectConfig: {...f.subjectConfig, section1: {...f.subjectConfig.section1, partB: {...f.subjectConfig.section1.partB, count: Number(e.target.value)}} }}))} />
                  </div>
                </div>

                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 14, marginTop: 16, marginBottom: 12, color: 'var(--forest)' }}>Section 2 Configuration</h4>
                <div>
                  <label className="form-label" style={{ fontSize: 11 }}>Section 2 Label</label>
                  <input className="form-input" value={form.subjectConfig.section2.label} 
                    onChange={e => setForm(f => ({...f, subjectConfig: {...f.subjectConfig, section2: {label: e.target.value}} }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setModal(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function VerificationsTab() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await getAdminRegistrations(); setRegs(r); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleAction = async (id, status) => {
    try {
      await verifyRegistration(id, status);
      toast.success(`Registration ${status}!`);
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)', marginBottom: 20 }}>
        Payment Verifications <span style={{ fontSize: 14, color: '#888', fontWeight: 400 }}>({regs.filter(r => r.status === 'pending').length} pending)</span>
      </h2>

      {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Loading...</div>
        : regs.length === 0 ? <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>No registrations yet.</div>
        : regs.map(reg => (
          <div key={reg._id} className="glass-card" style={{ padding: '20px 24px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 16, color: 'var(--forest)', marginBottom: 4 }}>
                  {reg.student?.name}
                </div>
                <div style={{ fontSize: 13, color: '#777' }}>{reg.student?.email} · {reg.student?.stream} · Batch {reg.student?.batch}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  Exam: {reg.exam?.title} · {reg.exam?.date} 
                  <span style={{ marginLeft: 8, textTransform: 'capitalize', color: 'var(--forest)', fontWeight: 600 }}>[{reg.mode || 'offline'} Mode]</span>
                </div>
                {reg.rollNumber && <div style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>Roll No: {reg.rollNumber}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <span className={`badge badge-${reg.status}`}>
                  {reg.status === 'pending' ? '⏳ Pending' : reg.status === 'confirmed' ? '✅ Confirmed' : '❌ Rejected'}
                </span>
                {reg.paymentScreenshotUrl && (
                  <a href={reg.paymentScreenshotUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--sage)', textDecoration: 'underline' }}>
                    View Payment Screenshot
                  </a>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  {reg.status !== 'confirmed' && (
                    <button className="btn-primary" style={{ padding: '7px 14px', fontSize: 13 }}
                      onClick={() => handleAction(reg._id, 'confirmed')}>✅ Confirm</button>
                  )}
                  {reg.status !== 'rejected' && (
                    <button style={{ padding: '7px 14px', fontSize: 13, cursor: 'pointer', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontFamily: 'Outfit', fontWeight: 600 }}
                      onClick={() => handleAction(reg._id, 'rejected')}>❌ Reject</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

function QuestionsTab() {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [section, setSection] = useState(1);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { getExams().then(setExams).catch(() => {}); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedExam || !fileRef.current.files[0]) { toast.error('Select exam and file'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('examId', selectedExam);
    fd.append('section', section);
    fd.append('doc', fileRef.current.files[0]);
    try {
      const res = await uploadQuestionPaper(fd);
      toast.success(`Parsed ${res.totalQuestions} questions from section ${section}!`);
      setPreview(res.questions);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const loadPreview = async () => {
    if (!selectedExam) { toast.error('Select an exam first'); return; }
    try {
      const data = await getQuestionPaper(selectedExam);
      const flat = data.flatMap(s => s.questions.map((q, i) => ({ ...q, section: s.section, qi: i + 1 })));
      setPreview(flat);
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)', marginBottom: 20 }}>Question Paper Management</h2>

      <div className="glass-card" style={{ padding: '24px', marginBottom: 24 }}>
        <form onSubmit={handleUpload} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Select Exam</label>
            <select className="form-input" value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
              <option value="">-- Choose Exam --</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 0 140px' }}>
            <label className="form-label">Section</label>
            <select className="form-input" value={section} onChange={e => setSection(Number(e.target.value))}>
              <option value={1}>Section 1 (Phy+Chem)</option>
              <option value={2}>Section 2 (Maths/Bio)</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label className="form-label">Upload Word Doc (.docx)</label>
            <input type="file" accept=".docx,.doc" ref={fileRef} style={{ display: 'block', marginTop: 6 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Parsing...' : '📤 Upload & Parse'}
            </button>
            <button type="button" className="btn-outline" onClick={loadPreview}>👁️ Preview</button>
          </div>
        </form>

        <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(122,155,122,0.1)', borderRadius: 10, fontSize: 13, color: '#555' }}>
          📌 <strong>Word doc format:</strong> Each question starts with "Q1." then options on new lines as "A. text", "*B. correct answer" (star = correct), "C. text", "D. text". Blank line between questions.
        </div>
      </div>

      {preview && preview.length > 0 && (
        <div>
          <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 18, color: 'var(--forest)', marginBottom: 14 }}>
            Preview ({preview.length} questions)
          </h3>
          {preview.slice(0, 10).map((q, i) => (
            <div key={i} className="glass-card" style={{ padding: '16px 20px', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--forest)', marginBottom: 10 }}>
                {q.section ? `S${q.section} Q${q.qi}: ` : `Q${i+1}: `}<MathText text={q.questionText} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {Object.entries(q.options).map(([key, val]) => (
                  <div key={key} style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 13,
                    background: 'rgba(122,155,122,0.08)', border: '1px solid rgba(122,155,122,0.2)',
                  }}>
                    <strong>{key}.</strong> <MathText text={val} />
                  </div>

                ))}
              </div>
            </div>
          ))}
          {preview.length > 10 && (
            <div style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 10 }}>
              ...and {preview.length - 10} more questions
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsTab() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAdminAttempts().then(a => { setAttempts(a); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)', marginBottom: 20 }}>
        Exam Results {loading ? '' : `(${attempts.length})`}
      </h2>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        : attempts.length === 0 ? <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>No results submitted yet.</div>
        : attempts.map(a => (
          <div key={a._id} className="glass-card" style={{ padding: '18px 22px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: 'var(--forest)', marginBottom: 4 }}>
                  {a.student?.name} <span style={{ fontSize: 12, color: '#aaa' }}>· {a.student?.email}</span>
                </div>
                <div style={{ fontSize: 13, color: '#777' }}>{a.exam?.title} · {a.exam?.date}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  S1: {a.section1Score}/100 · S2: {a.section2Score}/100 · Total: <strong>{a.totalScore}/200</strong>
                </div>
                {/* Tab Switch Warning Removed */}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`badge badge-${a.resultStatus}`}>{a.resultStatus}</span>

              </div>
            </div>
          </div>
        ))}

      {/* Screenshot modal removed */}
    </div>
  );
}

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(() => {})
      .catch(() => {});
    // Get all students via a custom endpoint
    fetch('/api/attempts/admin/students', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setStudents(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)' }}>
          Students ({students.length})
        </h2>
        <input className="form-input" placeholder="🔍 Search by name or email..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        : filtered.length === 0 ? <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>No students found.</div>
        : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8, color: '#888' }}>
                  {['Name', 'Email', 'Phone', 'Batch', 'Stream', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '0 16px 8px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id} className="glass-card" style={{ fontSize: 13 }}>
                    {[
                      <strong style={{ color: 'var(--forest)' }}>{s.name}</strong>,
                      s.email, s.phone, s.batch,
                      <span className={`badge badge-${s.stream === 'PCM' ? 'confirmed' : 'pending'}`}>{s.stream}</span>,
                      new Date(s.createdAt).toLocaleDateString(),
                    ].map((val, i) => (
                      <td key={i} style={{ padding: '12px 16px' }}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

function MessagesTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (err) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await deleteMessage(id);
      toast.success('Message deleted');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: 22, color: 'var(--forest)' }}>
          Contact Messages ({messages.length})
        </h2>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading...</div>
        : messages.length === 0 ? <div className="glass-card" style={{ padding: 40, textAlign: 'center', color: '#888' }}>No messages found.</div>
        : (
          <div style={{ display: 'grid', gap: 16 }}>
            {messages.map(m => (
              <div key={m._id} className="glass-card" style={{ padding: '20px 24px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <strong style={{ color: 'var(--forest)', fontSize: 16, display: 'block' }}>{m.name}</strong>
                    <a href={`mailto:${m.email}`} style={{ fontSize: 13, color: 'var(--sage)', textDecoration: 'none' }}>{m.email}</a>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#888' }}>{new Date(m.createdAt).toLocaleString()}</span>
                    <button onClick={() => handleDelete(m._id)} style={{ padding: '6px 12px', fontSize: 12, cursor: 'pointer', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, fontWeight: 600 }}>Delete</button>
                  </div>
                </div>
                <div style={{ padding: 16, background: 'rgba(26,46,26,0.03)', borderRadius: 12, fontSize: 14, color: '#444', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {m.message}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('exams');
  const nav = useNavigate();

  const CONTENT = { exams: ExamsTab, verifications: VerificationsTab, questions: QuestionsTab, results: ResultsTab, students: StudentsTab, messages: MessagesTab };
  const TabComponent = CONTENT[tab];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <nav style={{
        background: 'var(--forest)', padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, background: 'var(--gold)', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--forest)', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit',
          }}>⚡</div>
          <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 18, color: 'var(--cream)' }}>Sadhna Kuti | Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(245,240,232,0.7)' }}>Admin: {user?.name}</span>
          <button onClick={() => { logout(); nav('/'); }} style={{
            padding: '7px 16px', background: 'rgba(245,240,232,0.15)', color: 'var(--cream)',
            border: '1px solid rgba(245,240,232,0.3)', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, transition: 'background 0.2s',
          }}>Logout</button>
        </div>
      </nav>

      {/* Mobile Tab Bar */}
      <div className="mobile-show" style={{ display: 'none', background: 'var(--forest)', padding: '5px', overflowX: 'auto', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: 'none', borderRadius: 8, marginRight: 4,
            background: tab === t.key ? 'var(--gold)' : 'transparent',
            color: tab === t.key ? 'var(--forest)' : 'var(--cream)',
            fontFamily: 'Outfit', fontWeight: 600, fontSize: 13, cursor: 'pointer'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="mobile-stack" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar */}
        <aside className="mobile-hide" style={{
          width: 220, background: 'rgba(26,46,26,0.04)', borderRight: '1px solid rgba(122,155,122,0.2)',
          padding: '24px 12px', flexShrink: 0
        }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', marginBottom: 4, border: 'none', borderRadius: 11, cursor: 'pointer',
              fontFamily: 'Outfit', fontWeight: 600, fontSize: 14, textAlign: 'left',
              background: tab === t.key ? 'var(--forest)' : 'transparent',
              color: tab === t.key ? 'var(--cream)' : 'var(--forest)',
              transition: 'all 0.2s',
            }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
          <TabComponent />
        </main>
      </div>
    </div>
  );
}
