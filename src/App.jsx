import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://ylwqubaxjsgfyrmkridc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3F1YmF4anNnZnlybWtyaWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA2NzYsImV4cCI6MjA5MzUxNjY3Nn0.ENaQkWOjsuj9BDGEnn1MGOXheYddoiUM-3owF2dJ8qg";

const sb = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json", Prefer: options.prefer || "return=representation", ...options.headers },
    ...options,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Error"); }
  return res.status === 204 ? [] : res.json();
};

// ─── SESIÓN PERSISTENTE ───────────────────────────────────────
const SESSION_KEY = "limon_persa_session";
const INACTIVITY_LIMIT = 3 * 60 * 60 * 1000; // 3 horas en ms

const saveSession = (user) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, lastActivity: Date.now() }));
};

const loadSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, lastActivity } = JSON.parse(raw);
    if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
};

const clearSession = () => localStorage.removeItem(SESSION_KEY);

const updateActivity = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const session = JSON.parse(raw);
    session.lastActivity = Date.now();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
};
// ─────────────────────────────────────────────────────────────

const BANK_INFO = { banco: "BBVA México", titular: "Limón Persa SAPI de CV", clabe: "012345678901234567", cuenta: "1234567890" };
const PRODUCTS = [
  { id: 1, name: "Básico",   price: 200,  daily: 8,   color: "#a3e635", icon: "🌱" },
  { id: 2, name: "Estándar", price: 800,  daily: 33,  color: "#facc15", icon: "🌿" },
  { id: 3, name: "Premium",  price: 2500, daily: 120, color: "#34d399", icon: "🍋" },
  { id: 4, name: "Elite",    price: 8000, daily: 408, color: "#fb923c", icon: "⭐" },
];

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};
const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0a0f0a;--card:#141f14;--card2:#1a2a1a;--border:#243024;--lime:#bef264;--lime2:#a3e635;--lime3:#4d7c0f;--text:#e8f5e8;--muted:#6b8f6b;--danger:#f87171;--gold:#fbbf24}
    body{background:var(--bg);color:var(--text);font-family:'DM Sans',sans-serif;min-height:100vh}
    h1,h2,h3,h4{font-family:'Syne',sans-serif}
    input,button{font-family:'DM Sans',sans-serif}
    button{cursor:pointer}
    ::-webkit-scrollbar{width:4px}
    ::-webkit-scrollbar-thumb{background:var(--lime3);border-radius:4px}
    .screen{max-width:430px;margin:0 auto;min-height:100vh}
    .card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:20px}
    .btn-primary{background:var(--lime);color:#0a0f0a;border:none;border-radius:12px;padding:14px 24px;font-weight:700;font-size:15px;width:100%;transition:all .2s;font-family:'Syne',sans-serif}
    .btn-primary:hover{background:var(--lime2);transform:translateY(-1px)}
    .btn-primary:disabled{opacity:.5;cursor:not-allowed;transform:none}
    .btn-ghost{background:transparent;color:var(--lime);border:1px solid var(--lime3);border-radius:12px;padding:12px 20px;font-size:14px;width:100%;transition:all .2s;font-family:'Syne',sans-serif}
    .btn-ghost:hover{background:rgba(190,242,100,.08)}
    .input-field{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:14px 16px;color:var(--text);font-size:15px;width:100%;outline:none;transition:border-color .2s}
    .input-field:focus{border-color:var(--lime3)}
    .input-field::placeholder{color:var(--muted)}
    .label{font-size:12px;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.8px}
    .gap{display:flex;flex-direction:column;gap:16px}
    .error{color:var(--danger);font-size:13px;text-align:center}
    .success{color:var(--lime);font-size:13px;text-align:center}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600}
    .badge-pending{background:rgba(251,191,36,.15);color:var(--gold)}
    .badge-confirmed,.badge-paid{background:rgba(190,242,100,.15);color:var(--lime)}
    .badge-rejected{background:rgba(248,113,113,.15);color:var(--danger)}
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes spinAnim{to{transform:rotate(360deg)}}
    @keyframes prize-pop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    .fade-up{animation:fadeUp .4s ease both}
  `}</style>
);

const Timer24 = ({ lastClaimed, onClaim, loading }) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const calc = () => { const d = 86400 - Math.floor((Date.now() - new Date(lastClaimed).getTime()) / 1000); setSecs(Math.max(0, d)); };
    calc(); const iv = setInterval(calc, 1000); return () => clearInterval(iv);
  }, [lastClaimed]);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  const ready = secs === 0;
  const pct = ((86400 - secs) / 86400) * 100;
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 80 80" width="80" height="80" style={{ margin: "0 auto 8px", display: "block" }}>
        <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="40" cy="40" r="34" fill="none" stroke={ready ? "var(--lime)" : "var(--lime3)"} strokeWidth="6"
          strokeDasharray={`${2 * Math.PI * 34}`} strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
          strokeLinecap="round" transform="rotate(-90 40 40)" style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x="40" y="45" textAnchor="middle" fontSize="11" fill={ready ? "var(--lime)" : "var(--text)"} fontFamily="Syne" fontWeight="700">
          {ready ? "LISTO" : `${h}:${m}:${s}`}
        </text>
      </svg>
      <button className="btn-primary" onClick={onClaim} disabled={!ready || loading} style={{ fontSize: 13, padding: "10px 20px", marginTop: 4 }}>
        {loading ? "..." : ready ? "💰 Cobrar rendimiento" : "Esperando..."}
      </button>
    </div>
  );
};

const Wheel = ({ prizes, onSpin, spins }) => {
  const canvasRef = useRef(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const rotRef = useRef(0);

  const draw = useCallback((rot) => {
    const canvas = canvasRef.current;
    if (!canvas || !prizes.length) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 8;
    const n = prizes.length;
    const arc = (2 * Math.PI) / n;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    prizes.forEach((p, i) => {
      const start = rot + i * arc;
      const end = start + arc;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath(); ctx.fillStyle = p.color; ctx.fill();
      ctx.strokeStyle = "#0a0f0a"; ctx.lineWidth = 2; ctx.stroke();
      const mid = start + arc / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(mid) * r * 0.65, cy + Math.sin(mid) * r * 0.65);
      ctx.rotate(mid + Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillStyle = "#000";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(p.label, 0, 4); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
    ctx.fillStyle = "#0a0f0a"; ctx.fill();
    ctx.strokeStyle = "#bef264"; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "13px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🍋", cx, cy); ctx.textBaseline = "alphabetic";
  }, [prizes]);

  useEffect(() => { draw(rotRef.current); }, [draw]);

  const spinWheel = () => {
    if (spinning || spins < 1 || !prizes.length) return;
    setSpinning(true); setResult(null);
    const rand = Math.random() * 100;
    let cum = 0, selected = prizes[prizes.length - 1];
    for (const p of prizes) { cum += Number(p.probability); if (rand < cum) { selected = p; break; } }
    const n = prizes.length;
    const arc = (2 * Math.PI) / n;
    const idx = prizes.findIndex(p => p.id === selected.id);
    const targetRot = (-Math.PI / 2 - (idx * arc + arc / 2));
    const fullSpins = (6 + Math.floor(Math.random() * 4)) * 2 * Math.PI;
    const currentRot = rotRef.current;
    let delta = targetRot - (currentRot % (2 * Math.PI));
    if (delta > 0) delta -= 2 * Math.PI;
    const totalRot = delta - fullSpins;
    const duration = 5000;
    const startTime = performance.now();
    const startRot = currentRot;
    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const cur = startRot + totalRot * ease;
      rotRef.current = cur; draw(cur);
      if (t < 1) requestAnimationFrame(animate);
      else { setSpinning(false); setResult(selected); onSpin(selected); }
    };
    requestAnimationFrame(animate);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <div style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "26px solid #bef264", zIndex: 10, filter: "drop-shadow(0 2px 4px rgba(0,0,0,.5))" }} />
        <canvas ref={canvasRef} width={280} height={280} style={{ borderRadius: "50%", boxShadow: "0 0 40px rgba(190,242,100,.15)", display: "block" }} />
      </div>
      <div style={{ marginTop: 20 }}>
        {spins > 0
          ? <button className="btn-primary" onClick={spinWheel} disabled={spinning} style={{ maxWidth: 220, margin: "0 auto", display: "block" }}>
              {spinning ? "Girando..." : `🎰 Girar (${spins} giro${spins !== 1 ? "s" : ""})`}
            </button>
          : <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px", color: "var(--muted)", fontSize: 14, maxWidth: 220, margin: "0 auto" }}>😔 Sin giros disponibles</div>
        }
      </div>
      {result && (
        <div style={{ marginTop: 20, background: "linear-gradient(135deg,var(--lime3),#166534)", borderRadius: 16, padding: 20, animation: "prize-pop .5s ease both" }}>
          <p style={{ fontSize: 36 }}>🎉</p>
          <p style={{ fontWeight: 800, fontSize: 22, color: "#fff", fontFamily: "Syne" }}>¡Ganaste {result.label}!</p>
          {result.is_cash ? <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginTop: 4 }}>Se acreditó a tu saldo</p>
            : <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginTop: 4 }}>El equipo te contactará pronto 📱</p>}
        </div>
      )}
    </div>
  );
};

const Splash = ({ onLogin, onRegister }) => (
  <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "100vh" }}>
    <div style={{ marginBottom: 40, textAlign: "center" }} className="fade-up">
      <div style={{ fontSize: 72 }}>🍋</div>
      <h1 style={{ fontSize: 36, fontWeight: 800, color: "var(--lime)", letterSpacing: -1 }}>Limón Persa</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8 }}>Invierte. Gana. Crece cada día.</p>
    </div>
    <div className="gap fade-up" style={{ width: "100%", animationDelay: ".1s" }}>
      <button className="btn-primary" onClick={onLogin}>Iniciar sesión</button>
      <button className="btn-ghost" onClick={onRegister}>Crear cuenta</button>
    </div>
    <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 32, textAlign: "center" }}>Solo con código de invitación</p>
  </div>
);

const Register = ({ onBack, onSuccess }) => {
  const urlRef = new URLSearchParams(window.location.search).get("ref") || "";
  const [f, setF] = useState({ phone: "", pw: "", pw2: "", code: urlRef });
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const submit = async () => {
    setErr("");
    if (!f.phone || !f.pw || !f.pw2 || !f.code) return setErr("Completa todos los campos");
    if (f.pw !== f.pw2) return setErr("Las contraseñas no coinciden");
    if (f.pw.length < 6) return setErr("Mínimo 6 caracteres");
    setLoading(true);
    try {
      const refs = await sb(`users?referral_code=eq.${f.code.toUpperCase()}&select=id`);
      if (!refs.length) { setLoading(false); return setErr("Código de invitación inválido"); }
      const existing = await sb(`users?phone=eq.${f.phone}&select=id`);
      if (existing.length) { setLoading(false); return setErr("Teléfono ya registrado"); }
      const hash = await hashPassword(f.pw);
      await sb("users", { method: "POST", body: JSON.stringify({ phone: f.phone, password_hash: hash, referral_code: genCode(), referred_by: refs[0].id, balance: 0, spins: 0 }) });
      onSuccess("¡Cuenta creada!");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div className="screen" style={{ padding: 24, overflowY: "auto", maxHeight: "100vh" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, marginBottom: 24 }}>←</button>
      <div className="fade-up">
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Crear cuenta</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Solo con invitación</p>
        <div className="gap">
          <div><div className="label">Teléfono</div><input className="input-field" placeholder="10 dígitos" value={f.phone} onChange={set("phone")} type="tel" /></div>
          <div><div className="label">Contraseña</div><input className="input-field" placeholder="Mínimo 6 caracteres" value={f.pw} onChange={set("pw")} type="password" /></div>
          <div><div className="label">Confirmar contraseña</div><input className="input-field" placeholder="Repite tu contraseña" value={f.pw2} onChange={set("pw2")} type="password" /></div>
          <div><div className="label">Código de invitación</div><input className="input-field" placeholder="Ej: AB12CD" value={f.code} onChange={set("code")} style={{ textTransform: "uppercase" }} /></div>
          {err && <p className="error">{err}</p>}
          <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "..." : "Crear cuenta"}</button>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onBack, onSuccess, flash }) => {
  const [phone, setPhone] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setErr(""); if (!phone || !pw) return setErr("Completa todos los campos");
    setLoading(true);
    try {
      const hash = await hashPassword(pw);
      const users = await sb(`users?phone=eq.${phone}&password_hash=eq.${hash}&select=*`);
      if (!users.length) { setLoading(false); return setErr("Teléfono o contraseña incorrectos"); }
      onSuccess(users[0]);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div className="screen" style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      {flash && <div style={{ background: "var(--lime3)", color: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13 }}>{flash}</div>}
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, marginBottom: 24, alignSelf: "flex-start" }}>←</button>
      <div className="fade-up">
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Iniciar sesión</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Bienvenido de regreso 🍋</p>
        <div className="gap">
          <div><div className="label">Teléfono</div><input className="input-field" placeholder="10 dígitos" value={phone} onChange={e => setPhone(e.target.value)} type="tel" /></div>
          <div><div className="label">Contraseña</div><input className="input-field" placeholder="Tu contraseña" value={pw} onChange={e => setPw(e.target.value)} type="password" /></div>
          {err && <p className="error">{err}</p>}
          <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
};

const Home = ({ user, onRefresh }) => {
  const [purchases, setPurchases] = useState([]); const [loading, setLoading] = useState(true); const [claiming, setClaiming] = useState(null);
  const load = useCallback(async () => {
    try {
      const d = await sb(`purchases?user_id=eq.${user.id}&is_active=eq.true&select=*,products(*)`);
      setPurchases((d || []).filter(p => p.products));
    } catch(e) { setPurchases([]); }
    setLoading(false);
  }, [user.id]);
  useEffect(() => { load(); }, [load]);
  const claim = async (p) => {
    setClaiming(p.id);
    try {
      const now = new Date().toISOString();
      await sb("yield_claims", { method: "POST", body: JSON.stringify({ user_id: user.id, purchase_id: p.id, amount: p.products.daily_return }) });
      await sb(`purchases?id=eq.${p.id}`, { method: "PATCH", body: JSON.stringify({ last_claimed_at: now }), prefer: "return=minimal" });
      await sb(`users?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ balance: user.balance + p.products.daily_return }), prefer: "return=minimal" });
      onRefresh(); load();
    } catch (e) { alert("Error: " + e.message); }
    setClaiming(null);
  };
  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{ padding: "32px 20px 20px", background: "linear-gradient(180deg,#0f1f0f 0%,var(--bg) 100%)" }}>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Hola 👋</p>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{user.phone}</h2>
        <div className="card" style={{ marginTop: 20, background: "linear-gradient(135deg,var(--lime3),#166534)", border: "none" }}>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 4 }}>Saldo disponible</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{fmt(user.balance)}</h1>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>Código: <b style={{ color: "#fff" }}>{user.referral_code}</b></p>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 11 }}>🎰 <b style={{ color: "#fff" }}>{user.spins || 0}</b> giros</p>
          </div>
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--muted)" }}>Mis inversiones activas</h3>
        {loading && <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--lime)", borderRadius: "50%", animation: "spinAnim .8s linear infinite", margin: "0 auto" }} />}
        {!loading && purchases.length === 0 && <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}><p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p><p>¡Compra tu primer paquete!</p></div>}
        <div className="gap">
          {purchases.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 22 }}>{PRODUCTS.find(x => x.id === p.product_id)?.icon}</span>
                  <h4 style={{ fontSize: 16, fontWeight: 700 }}>{p.products.name}</h4>
                  <p style={{ color: "var(--muted)", fontSize: 12 }}>+{fmt(p.products.daily_return)} / día</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ color: "var(--lime)", fontWeight: 700 }}>{fmt(p.products.price)}</p>
                  <p style={{ color: "var(--muted)", fontSize: 11 }}>invertido</p>
                </div>
              </div>
              <Timer24 lastClaimed={p.last_claimed_at} onClaim={() => claim(p)} loading={claiming === p.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Shop = ({ user, onRefresh }) => {
  const [buying, setBuying] = useState(null); const [msg, setMsg] = useState("");
  const buy = async (product) => {
    if (!user || !user.id) return setMsg("Error: vuelve a iniciar sesión.");
    if (user.balance < product.price) return setMsg("Saldo insuficiente. Haz un depósito primero.");
    setBuying(product.id); setMsg("");
    try {
      await sb("purchases", { method: "POST", body: JSON.stringify({ user_id: user.id, product_id: product.id, is_active: true, last_claimed_at: new Date().toISOString() }) });
      const newBalance = Number(user.balance) - Number(product.price);
      await sb(`users?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ balance: newBalance }), prefer: "return=minimal" });
      if (user.referred_by) {
        try {
          const ref = await sb(`users?id=eq.${user.referred_by}&select=id,balance`);
          if (ref && ref.length > 0) {
            await sb(`users?id=eq.${user.referred_by}`, { method: "PATCH", body: JSON.stringify({ balance: Number(ref[0].balance) + Number(product.price) * 0.10 }), prefer: "return=minimal" });
          }
        } catch (_) {}
      }
      setMsg(`✅ ¡Compraste el paquete ${product.name}!`);
      onRefresh();
    } catch (e) { setMsg("Error al comprar: " + e.message); }
    setBuying(null);
  };
  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Paquetes</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Invierte y gana rendimiento diario</p>
      {msg && <p className={msg.startsWith("✅") ? "success" : "error"} style={{ marginBottom: 16 }}>{msg}</p>}
      <div className="gap">
        {PRODUCTS.map(p => (
          <div key={p.id} className="card" style={{ borderColor: p.color + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div><span style={{ fontSize: 28 }}>{p.icon}</span><h3 style={{ fontSize: 20, fontWeight: 800, color: p.color }}>{p.name}</h3></div>
              <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(p.price)}</div><div style={{ color: "var(--muted)", fontSize: 12 }}>inversión</div></div>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Rendimiento diario</span>
              <span style={{ color: p.color, fontWeight: 700 }}>+{fmt(p.daily)}</span>
            </div>
            <button className="btn-primary" onClick={() => buy(p)} disabled={!!buying} style={{ background: p.color, fontSize: 14 }}>
              {buying === p.id ? "Procesando..." : "Comprar paquete"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── QR Generator usando solo Canvas (sin librería externa) ──
const QRCode = ({ value, size = 180 }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    script.onload = () => {
      const container = document.getElementById("qr-container");
      if (!container) return;
      container.innerHTML = "";
      new window.QRCode(container, {
        text: value,
        width: size,
        height: size,
        colorDark: "#0a0f0a",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.M,
      });
    };
    if (window.QRCode) {
      const container = document.getElementById("qr-container");
      if (container) {
        container.innerHTML = "";
        new window.QRCode(container, {
          text: value, width: size, height: size,
          colorDark: "#0a0f0a", colorLight: "#ffffff",
          correctLevel: window.QRCode.CorrectLevel.M,
        });
      }
    } else {
      document.head.appendChild(script);
    }
    return () => { try { document.head.removeChild(script); } catch {} };
  }, [value, size]);
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 12, display: "inline-block", boxShadow: "0 0 30px rgba(190,242,100,.2)" }}>
      <div id="qr-container" />
    </div>
  );
};

const Referrals = ({ user }) => {
  const [refs, setRefs] = useState([]); const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  useEffect(() => { sb(`users?referred_by=eq.${user.id}&select=phone,created_at`).then(d => { setRefs(d || []); setLoading(false); }).catch(() => setLoading(false)); }, [user.id]);

  const refLink = `${window.location.origin}${window.location.pathname}?ref=${user.referral_code}`;

  const copyText = async (text, key) => {
    try { await navigator.clipboard.writeText(text); } catch { const el = document.createElement("textarea"); el.value = text; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopied(key); setTimeout(() => setCopied(""), 2200);
  };

  const share = async () => {
    const text = `🍋 Únete a Limón Persa y genera rendimientos diarios.\n\nUsa mi código: *${user.referral_code}*\nEntra aquí: ${refLink}`;
    if (navigator.share) { try { await navigator.share({ title: "Limón Persa", text }); return; } catch {} }
    copyText(text, "share");
  };

  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Mis Referidos</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Ganas 10% de cada compra que hagan</p>

      {/* Tarjeta código */}
      <div className="card" style={{ marginBottom: 12, background: "linear-gradient(135deg,var(--lime3),#166534)", border: "none", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>Tu código de referido</p>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: 4 }}>{user.referral_code}</h2>
        <p style={{ color: "rgba(255,255,255,.6)", fontSize: 12, marginTop: 4 }}>{refs.length} persona{refs.length !== 1 ? "s" : ""} registrada{refs.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Botones copiar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => copyText(user.referral_code, "code")} className="btn-ghost" style={{ flex: 1, fontSize: 13, padding: "11px 0" }}>
          {copied === "code" ? "✅ Copiado" : "📋 Copiar código"}
        </button>
        <button onClick={() => copyText(refLink, "link")} className="btn-ghost" style={{ flex: 1, fontSize: 13, padding: "11px 0" }}>
          {copied === "link" ? "✅ Copiado" : "🔗 Copiar link"}
        </button>
      </div>

      {/* Botón compartir */}
      <button onClick={share} className="btn-primary" style={{ marginBottom: 20 }}>
        {copied === "share" ? "✅ Texto copiado" : "📤 Compartir invitación"}
      </button>

      {/* QR Code */}
      <div className="card" style={{ marginBottom: 20, textAlign: "center", padding: "24px 20px" }}>
        <p style={{ color: "var(--muted)", fontSize: 11, marginBottom: 16, textTransform: "uppercase", letterSpacing: .8 }}>Escanea para unirte</p>
        <QRCode value={refLink} size={180} />
        <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 14, wordBreak: "break-all", fontFamily: "monospace" }}>{refLink}</p>
      </div>

      {loading && <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--lime)", borderRadius: "50%", animation: "spinAnim .8s linear infinite", margin: "0 auto" }} />}
      {!loading && refs.length === 0 && <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}><p style={{ fontSize: 32, marginBottom: 8 }}>👥</p><p>¡Comparte tu código!</p></div>}
      <div className="gap">
        {refs.map((r, i) => (
          <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px" }}>
            <div><p style={{ fontWeight: 600, fontSize: 14 }}>{r.phone}</p><p style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(r.created_at).toLocaleDateString("es-MX")}</p></div>
            <div style={{ textAlign: "right" }}><p style={{ color: "var(--lime)", fontWeight: 700, fontSize: 13 }}>+10%</p><p style={{ color: "var(--muted)", fontSize: 11 }}>por compra</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WheelScreen = ({ user, onRefresh }) => {
  const [prizes, setPrizes] = useState([]); const [loading, setLoading] = useState(true); const [history, setHistory] = useState([]);
  const loadData = useCallback(async () => {
    const [p, h] = await Promise.all([
      sb("wheel_prizes?order=id").catch(() => []),
      sb(`spin_history?user_id=eq.${user.id}&order=spun_at.desc&limit=10`).catch(() => [])
    ]);
    setPrizes(p || []); setHistory(h || []); setLoading(false);
  }, [user.id]);
  useEffect(() => { loadData(); }, [loadData]);
  const handleSpin = async (prize) => {
    try {
      await sb("spin_history", { method: "POST", body: JSON.stringify({ user_id: user.id, prize_id: prize.id, prize_label: prize.label, prize_amount: prize.amount }) });
      await sb(`users?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ spins: Math.max(0, (user.spins || 0) - 1), balance: prize.is_cash ? user.balance + Number(prize.amount) : user.balance }), prefer: "return=minimal" });
      await onRefresh(); loadData();
    } catch (e) { alert("Error: " + e.message); }
  };
  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Ruleta de Premios 🎰</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Giros disponibles: <b style={{ color: "var(--lime)" }}>{user.spins || 0}</b></p>
      {loading
        ? <div style={{ width: 24, height: 24, border: "3px solid var(--border)", borderTopColor: "var(--lime)", borderRadius: "50%", animation: "spinAnim .8s linear infinite", margin: "0 auto" }} />
        : <Wheel prizes={prizes} onSpin={handleSpin} spins={user.spins || 0} />}
      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>Mis últimos giros</h4>
          <div className="gap">
            {history.map(h => (
              <div key={h.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                <p style={{ fontWeight: 600, color: "var(--lime)" }}>{h.prize_label}</p>
                <p style={{ color: "var(--muted)", fontSize: 12 }}>{new Date(h.spun_at).toLocaleDateString("es-MX")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── WALLET: Depósito + Retiro en una sola pantalla ──────────
const WITHDRAW_AMOUNTS = [50, 100, 300, 1500, 6000, 15000, 35000, 70000];

const Wallet = ({ user }) => {
  const [mode, setMode] = useState("deposit"); // "deposit" | "withdraw"

  // ── Depósito state ──
  const [depAmount, setDepAmount] = useState("");
  const [depLoading, setDepLoading] = useState(false);
  const [depMsg, setDepMsg] = useState("");
  const [depHistory, setDepHistory] = useState([]);

  // ── Retiro state ──
  const [f, setF] = useState({ amount: "", bank: "", clabe: "", holder: "" });
  const setField = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const [wLoading, setWLoading] = useState(false);
  const [wMsg, setWMsg] = useState("");
  const [wHistory, setWHistory] = useState([]);
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    sb(`deposits?user_id=eq.${user.id}&order=created_at.desc&limit=5`).then(d => setDepHistory(d || [])).catch(() => {});
    sb(`withdrawals?user_id=eq.${user.id}&order=created_at.desc&limit=20`).then(d => {
      setWHistory(d || []);
      const seen = new Set(); const unique = [];
      (d || []).forEach(w => { if (!seen.has(w.clabe)) { seen.add(w.clabe); unique.push({ bank: w.bank_name, clabe: w.clabe, holder: w.account_holder }); } });
      setSaved(unique);
    }).catch(() => {});
  }, [user.id]);

  const submitDeposit = async () => {
    if (!depAmount || Number(depAmount) < 100) return setDepMsg("Mínimo $100 MXN");
    setDepLoading(true); setDepMsg("");
    try {
      await sb("deposits", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: Number(depAmount) }) });
      setDepMsg("✅ Solicitud enviada. En 1-24h se acreditará."); setDepAmount("");
      const d = await sb(`deposits?user_id=eq.${user.id}&order=created_at.desc&limit=5`).catch(() => []);
      setDepHistory(d || []);
    } catch (e) { setDepMsg("Error: " + e.message); }
    setDepLoading(false);
  };

  const isWithdrawOpen = () => {
    const now = new Date(); const day = now.getDay(); const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 11 && hour < 17;
  };
  const getNextOpenTime = () => {
    const now = new Date(); const day = now.getDay(); const hour = now.getHours();
    if (day === 0 || day === 6) return "El lunes a las 11:00 AM";
    if (day >= 1 && day <= 5 && hour < 11) return "Hoy a las 11:00 AM";
    if (day >= 1 && day <= 5 && hour >= 17) return day === 5 ? "El lunes a las 11:00 AM" : "Mañana a las 11:00 AM";
    return "El lunes a las 11:00 AM";
  };

  const submitWithdraw = async () => {
    if (!isWithdrawOpen()) return setWMsg(`⏰ Retiros Lun-Vie 11am-5pm. Próxima apertura: ${getNextOpenTime()}.`);
    if (!f.amount) return setWMsg("Selecciona un monto");
    if (Number(f.amount) > user.balance) return setWMsg("Saldo insuficiente");
    if (!f.bank || !f.clabe || !f.holder) return setWMsg("Completa todos los campos");
    if (f.clabe.length !== 18) return setWMsg("CLABE debe tener 18 dígitos");
    setWLoading(true); setWMsg("");
    try {
      await sb("withdrawals", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: Number(f.amount), bank_name: f.bank, clabe: f.clabe, account_holder: f.holder }) });
      setWMsg("✅ Solicitud enviada. Se procesa en 24-48h hábiles.");
      setF({ amount: "", bank: "", clabe: "", holder: "" });
      const d = await sb(`withdrawals?user_id=eq.${user.id}&order=created_at.desc&limit=20`).catch(() => []);
      setWHistory(d || []);
    } catch (e) { setWMsg("Error: " + e.message); }
    setWLoading(false);
  };

  const open = isWithdrawOpen();

  return (
    <div style={{ padding: "28px 20px 100px" }}>
      {/* Header */}
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>💰 Wallet</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Saldo: <b style={{ color: "var(--lime)" }}>{fmt(user.balance)}</b>
      </p>

      {/* Toggle depósito / retiro */}
      <div style={{ display: "flex", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, padding: 4, marginBottom: 24, gap: 4 }}>
        {[{ id: "deposit", icon: "💳", label: "Depósito" }, { id: "withdraw", icon: "💸", label: "Retiro" }].map(btn => (
          <button key={btn.id} onClick={() => setMode(btn.id)} style={{
            flex: 1, padding: "12px 0", border: "none", borderRadius: 10, fontFamily: "Syne", fontWeight: 700, fontSize: 14,
            background: mode === btn.id ? "var(--lime)" : "transparent",
            color: mode === btn.id ? "#0a0f0a" : "var(--muted)",
            transition: "all .2s", cursor: "pointer"
          }}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* ── DEPÓSITO ── */}
      {mode === "deposit" && (
        <div className="fade-up">
          <div className="card" style={{ marginBottom: 16, borderColor: "var(--lime3)" }}>
            <p style={{ color: "var(--lime)", fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Cuenta de depósito</p>
            {[["Banco", BANK_INFO.banco], ["Titular", BANK_INFO.titular], ["CLABE", BANK_INFO.clabe], ["Cuenta", BANK_INFO.cuenta]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{k}</span>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="label">Monto (MXN)</div>
            <input className="input-field" type="number" placeholder="Mínimo $100" value={depAmount} onChange={e => setDepAmount(e.target.value)} style={{ marginBottom: 14 }} />
            {depMsg && <p className={depMsg.startsWith("✅") ? "success" : "error"} style={{ marginBottom: 12 }}>{depMsg}</p>}
            <button className="btn-primary" onClick={submitDeposit} disabled={depLoading}>{depLoading ? "..." : "Registrar depósito"}</button>
          </div>
          {depHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>Historial de depósitos</h4>
              <div className="gap">
                {depHistory.map(d => (
                  <div key={d.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><p style={{ fontWeight: 600 }}>{fmt(d.amount)}</p><p style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(d.created_at).toLocaleDateString("es-MX")}</p></div>
                    <span className={`badge badge-${d.status}`}>{d.status === "pending" ? "Pendiente" : d.status === "confirmed" ? "Confirmado" : "Rechazado"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── RETIRO ── */}
      {mode === "withdraw" && (
        <div className="fade-up">
          {/* Aviso horario */}
          <div style={{ background: open ? "rgba(190,242,100,.08)" : "rgba(251,191,36,.08)", border: `1px solid ${open ? "var(--lime3)" : "rgba(251,191,36,.3)"}`, borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: open ? "var(--lime)" : "var(--gold)", fontWeight: 600 }}>
              {open ? "✅ Retiros abiertos ahora" : "🕐 Retiros cerrados"}
            </p>
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              Horario: Lun-Vie de 11:00 AM a 5:00 PM
              {!open && ` · Próxima apertura: ${getNextOpenTime()}`}
            </p>
          </div>

          {/* Montos fijos */}
          <div style={{ marginBottom: 20 }}>
            <div className="label" style={{ marginBottom: 10 }}>Selecciona el monto</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {WITHDRAW_AMOUNTS.map(amt => (
                <button key={amt} onClick={() => setF(p => ({ ...p, amount: String(amt) }))}
                  style={{
                    padding: "10px 4px", border: `1.5px solid ${f.amount === String(amt) ? "var(--lime)" : "var(--border)"}`,
                    borderRadius: 10, background: f.amount === String(amt) ? "rgba(190,242,100,.12)" : "var(--card)",
                    color: f.amount === String(amt) ? "var(--lime)" : "var(--text)",
                    fontWeight: 700, fontSize: 12, fontFamily: "Syne", cursor: "pointer", transition: "all .15s",
                    opacity: amt > user.balance ? 0.35 : 1,
                  }}
                  disabled={amt > user.balance}
                >
                  {fmt(amt).replace("MX$", "$").replace(".00", "")}
                </button>
              ))}
            </div>
            {f.amount && (
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
                Monto seleccionado: <b style={{ color: "var(--lime)" }}>{fmt(Number(f.amount))}</b>
              </p>
            )}
          </div>

          {/* Cuentas guardadas */}
          {saved.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: "var(--muted)", fontSize: 11, marginBottom: 8, textTransform: "uppercase", letterSpacing: .8 }}>Cuentas anteriores</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {saved.map((acc, i) => (
                  <button key={i} onClick={() => setF(p => ({ ...p, bank: acc.bank, clabe: acc.clabe, holder: acc.holder }))}
                    style={{ background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", textAlign: "left", cursor: "pointer" }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{acc.bank} — {acc.holder}</p>
                    <p style={{ color: "var(--muted)", fontSize: 11, fontFamily: "monospace" }}>{acc.clabe}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Formulario datos bancarios */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="gap">
              <div><div className="label">Banco</div><input className="input-field" placeholder="BBVA, HSBC, Banamex..." value={f.bank} onChange={setField("bank")} /></div>
              <div><div className="label">CLABE (18 dígitos)</div><input className="input-field" placeholder="012345678901234567" value={f.clabe} onChange={setField("clabe")} type="tel" maxLength={18} /></div>
              <div><div className="label">Titular</div><input className="input-field" placeholder="Nombre completo" value={f.holder} onChange={setField("holder")} /></div>
              {wMsg && <p className={wMsg.startsWith("✅") ? "success" : "error"}>{wMsg}</p>}
              <button className="btn-primary" onClick={submitWithdraw} disabled={wLoading || !open} style={{ opacity: open ? 1 : 0.5 }}>
                {wLoading ? "Enviando..." : open ? "💸 Solicitar retiro" : "⏰ Fuera de horario"}
              </button>
            </div>
          </div>

          {/* Historial retiros */}
          {wHistory.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>Historial de retiros</h4>
              <div className="gap">
                {wHistory.map(w => (
                  <div key={w.id} className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, color: "var(--danger)", fontSize: 16 }}>{fmt(w.amount)}</p>
                      <span className={`badge badge-${w.status}`}>{w.status === "pending" ? "⏳ Pendiente" : w.status === "paid" ? "✅ Pagado" : "❌ Rechazado"}</span>
                    </div>
                    <p style={{ color: "var(--muted)", fontSize: 12 }}>{w.bank_name} · {w.account_holder}</p>
                    <p style={{ color: "var(--muted)", fontSize: 11, fontFamily: "monospace" }}>{w.clabe}</p>
                    <p style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>{new Date(w.created_at).toLocaleDateString("es-MX")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SupportButton = ({ user }) => {
  const [visible, setVisible] = useState(true);
  const phone = "525522222222"; // número sin + ni espacios
  const openWhatsApp = () => {
    const name = user?.phone || "un usuario";
    const msg = encodeURIComponent(`Hola, soy ${name} en Limón Persa y necesito ayuda. 🍋`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };
  return (
    <>
      {/* Botón flotante */}
      <button onClick={openWhatsApp} style={{
        position: "fixed", bottom: 80, right: 16, zIndex: 200,
        width: 52, height: 52, borderRadius: "50%", border: "none",
        background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "transform .2s",
        animation: "fadeUp .4s ease both",
      }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
        title="Soporte por WhatsApp"
      >
        {/* Ícono WhatsApp SVG */}
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
          <path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.73 1.77 6.72L2 30l7.5-1.73A13.93 13.93 0 0016 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5c-2.18 0-4.24-.58-6.02-1.6l-.43-.25-4.45 1.03 1.06-4.32-.28-.45A11.44 11.44 0 014.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.27-8.57c-.34-.17-2.02-.99-2.33-1.1-.31-.12-.54-.17-.77.17-.23.34-.88 1.1-1.08 1.33-.2.23-.4.26-.74.09-.34-.17-1.44-.53-2.74-1.69-1.01-.9-1.7-2.01-1.9-2.35-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.11-.23.06-.43-.03-.6-.09-.17-.77-1.86-1.06-2.55-.28-.67-.56-.58-.77-.59h-.66c-.23 0-.6.09-.91.43-.31.34-1.2 1.17-1.2 2.85s1.23 3.31 1.4 3.54c.17.23 2.42 3.7 5.86 5.19.82.35 1.46.56 1.95.72.82.26 1.57.22 2.16.13.66-.1 2.02-.83 2.31-1.62.28-.8.28-1.48.2-1.62-.09-.14-.31-.23-.65-.4z"/>
        </svg>
      </button>
      {/* Pulso verde */}
      <style>{`
        @keyframes waPulse { 0%,100%{box-shadow:0 4px 20px rgba(37,211,102,.5)} 50%{box-shadow:0 4px 32px rgba(37,211,102,.9)} }
        button[title="Soporte por WhatsApp"]{ animation: waPulse 2s ease-in-out infinite; }
      `}</style>
    </>
  );
};

const NavBar = ({ tab, setTab }) => {
  const items = [
    { id: "home",   icon: "🏠", label: "Inicio" },
    { id: "shop",   icon: "📦", label: "Paquetes" },
    { id: "refs",   icon: "👥", label: "Referidos" },
    { id: "wheel",  icon: "🎰", label: "Ruleta" },
    { id: "wallet", icon: "💰", label: "Wallet" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(--card2)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100 }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: tab === it.id ? "var(--lime)" : "var(--muted)", transition: "color .2s" }}>
          <span style={{ fontSize: 16 }}>{it.icon}</span>
          <span style={{ fontSize: 8, fontFamily: "Syne", fontWeight: 600 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState("splash");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [flash, setFlash] = useState("");

  // ─── CARGAR SESIÓN AL INICIAR ────────────────────────────────
  useEffect(() => {
    const savedUser = loadSession();
    if (savedUser) {
      setUser(savedUser);
      setView("app");
    }
  }, []);

  // ─── DETECTAR ACTIVIDAD Y ACTUALIZAR TIMESTAMP ──────────────
  useEffect(() => {
    if (!user) return;
    const events = ["click", "keydown", "touchstart", "scroll", "mousemove"];
    const handler = () => updateActivity();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));

    // Verificar cada minuto si la sesión expiró
    const interval = setInterval(() => {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      try {
        const { lastActivity } = JSON.parse(raw);
        if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
          logout();
        }
      } catch {}
    }, 60 * 1000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearInterval(interval);
    };
  }, [user]);
  // ─────────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const d = await sb(`users?id=eq.${user.id}&select=*`);
      if (d && d.length) {
        setUser(d[0]);
        saveSession(d[0]); // ← también actualiza la sesión guardada
      }
    } catch(e) { console.error(e); }
  }, [user]);

  const logout = () => {
    clearSession(); // ← limpiar localStorage al salir
    setUser(null);
    setView("splash");
    setTab("home");
  };

  const handleLoginSuccess = (u) => {
    saveSession(u); // ← guardar sesión al iniciar sesión
    setUser(u);
    setView("app");
    setFlash("");
  };

  if (view === "splash") return <><G /><Splash onLogin={() => setView("login")} onRegister={() => setView("register")} /></>;
  if (view === "register") return <><G /><Register onBack={() => setView("splash")} onSuccess={m => { setFlash(m); setView("login"); }} /></>;
  if (view === "login") return <><G /><Login flash={flash} onBack={() => { setFlash(""); setView("splash"); }} onSuccess={handleLoginSuccess} /></>;

  return (
    <>
      <G />
      <div className="screen" style={{ overflowY: "auto", height: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 50 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--lime)", fontFamily: "Syne" }}>🍋 Limón Persa</span>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", color: "var(--muted)", fontSize: 12 }}>Salir</button>
        </div>
        {tab === "home"   && <Home        user={user} onRefresh={refreshUser} />}
        {tab === "shop"   && <Shop        user={user} onRefresh={refreshUser} />}
        {tab === "refs"   && <Referrals   user={user} />}
        {tab === "wheel"  && <WheelScreen user={user} onRefresh={refreshUser} />}
        {tab === "wallet" && <Wallet      user={user} />}
        <SupportButton user={user} />
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </>
  );
}
