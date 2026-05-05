import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://ylwqubaxjsgfyrmkridc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3F1YmF4anNnZnlybWtyaWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDA2NzYsImV4cCI6MjA5MzUxNjY3Nn0.ENaQkWOjsuj9BDGEnn1MGOXheYddoiUM-3owF2dJ8qg";

const sb = async (path, options = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: options.prefer || "return=representation",
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Error en Supabase");
  }
  return res.status === 204 ? [] : res.json();
};

const BANK_INFO = {
  banco: "BBVA México",
  titular: "Limón Persa SAPI de CV",
  clabe: "012345678901234567",
  cuenta: "1234567890",
};

const PRODUCTS = [
  { id: 1, name: "Básico",    price: 200,  daily: 8,   color: "#a3e635", icon: "🌱" },
  { id: 2, name: "Estándar",  price: 800,  daily: 33,  color: "#facc15", icon: "🌿" },
  { id: 3, name: "Premium",   price: 2500, daily: 120, color: "#34d399", icon: "🍋" },
  { id: 4, name: "Elite",     price: 8000, daily: 408, color: "#fb923c", icon: "⭐" },
];

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const hashPassword = async (pw) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
};

const fmt = (n) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0a0f0a; --bg2: #111811; --card: #141f14; --card2: #1a2a1a;
      --border: #243024; --lime: #bef264; --lime2: #a3e635; --lime3: #4d7c0f;
      --text: #e8f5e8; --muted: #6b8f6b; --danger: #f87171; --gold: #fbbf24;
    }
    body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
    h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }
    input, button { font-family: 'DM Sans', sans-serif; }
    button { cursor: pointer; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--lime3); border-radius: 4px; }
    .screen { max-width: 430px; margin: 0 auto; min-height: 100vh; position: relative; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
    .btn-primary { background: var(--lime); color: #0a0f0a; border: none; border-radius: 12px; padding: 14px 24px; font-weight: 700; font-size: 15px; width: 100%; transition: all .2s; }
    .btn-primary:hover { background: var(--lime2); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(190,242,100,.2); }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; }
    .btn-ghost { background: transparent; color: var(--lime); border: 1px solid var(--lime3); border-radius: 12px; padding: 12px 20px; font-size: 14px; width: 100%; transition: all .2s; }
    .btn-ghost:hover { background: rgba(190,242,100,.08); }
    .input-field { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; color: var(--text); font-size: 15px; width: 100%; outline: none; transition: border-color .2s; }
    .input-field:focus { border-color: var(--lime3); }
    .input-field::placeholder { color: var(--muted); }
    .label { font-size: 12px; color: var(--muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: .8px; }
    .gap { display: flex; flex-direction: column; gap: 16px; }
    .error { color: var(--danger); font-size: 13px; text-align: center; }
    .success { color: var(--lime); font-size: 13px; text-align: center; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: .5px; }
    .badge-pending { background: rgba(251,191,36,.15); color: var(--gold); }
    .badge-confirmed, .badge-paid { background: rgba(190,242,100,.15); color: var(--lime); }
    .badge-rejected { background: rgba(248,113,113,.15); color: var(--danger); }
    @keyframes fadeUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-up { animation: fadeUp .4s ease both; }
    .spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color: var(--lime); border-radius:50%; animation: spin .8s linear infinite; margin: 0 auto; }
  `}</style>
);

const Timer24 = ({ lastClaimed, onClaim, loading }) => {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const calc = () => {
      const diff = 86400 - Math.floor((Date.now() - new Date(lastClaimed).getTime()) / 1000);
      setSecs(Math.max(0, diff));
    };
    calc();
    const iv = setInterval(calc, 1000);
    return () => clearInterval(iv);
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
        <circle cx="40" cy="40" r="34" fill="none" stroke={ready ? "var(--lime)" : "var(--lime3)"}
          strokeWidth="6" strokeDasharray={`${2 * Math.PI * 34}`}
          strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: "stroke-dashoffset 1s linear" }} />
        <text x="40" y="45" textAnchor="middle" fontSize="11" fill={ready ? "var(--lime)" : "var(--text)"}
          fontFamily="Syne, sans-serif" fontWeight="700">
          {ready ? "LISTO" : `${h}:${m}:${s}`}
        </text>
      </svg>
      <button className="btn-primary" onClick={onClaim} disabled={!ready || loading}
        style={{ fontSize: 13, padding: "10px 20px", marginTop: 4 }}>
        {loading ? "..." : ready ? "💰 Cobrar rendimiento" : "Esperando..."}
      </button>
    </div>
  );
};

const Splash = ({ onLogin, onRegister }) => (
  <div className="screen" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", minHeight: "100vh" }}>
    <div style={{ marginBottom: 40, textAlign: "center" }} className="fade-up">
      <div style={{ fontSize: 72, marginBottom: 8 }}>🍋</div>
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
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!phone || !pw || !pw2 || !code) return setErr("Completa todos los campos");
    if (pw !== pw2) return setErr("Las contraseñas no coinciden");
    if (pw.length < 6) return setErr("Mínimo 6 caracteres");
    setLoading(true);
    try {
      const refs = await sb(`users?referral_code=eq.${code.toUpperCase()}&select=id`);
      if (!refs.length) { setLoading(false); return setErr("Código de invitación inválido"); }
      const referredBy = refs[0].id;
      const existing = await sb(`users?phone=eq.${phone}&select=id`);
      if (existing.length) { setLoading(false); return setErr("Este teléfono ya está registrado"); }
      const hash = await hashPassword(pw);
      const myCode = genCode();
      await sb("users", { method: "POST", body: JSON.stringify({ phone, password_hash: hash, referral_code: myCode, referred_by: referredBy, balance: 0 }) });
      onSuccess("¡Cuenta creada! Ya puedes iniciar sesión.");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="screen" style={{ padding: "24px", overflowY: "auto", maxHeight: "100vh" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, marginBottom: 24 }}>←</button>
      <div className="fade-up">
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Crear cuenta</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Solo con invitación de un miembro</p>
        <div className="gap">
          <div><div className="label">Número de teléfono</div><input className="input-field" placeholder="10 dígitos" value={phone} onChange={e => setPhone(e.target.value)} type="tel" /></div>
          <div><div className="label">Contraseña</div><input className="input-field" placeholder="Mínimo 6 caracteres" value={pw} onChange={e => setPw(e.target.value)} type="password" /></div>
          <div><div className="label">Confirmar contraseña</div><input className="input-field" placeholder="Repite tu contraseña" value={pw2} onChange={e => setPw2(e.target.value)} type="password" /></div>
          <div><div className="label">Código de invitación</div><input className="input-field" placeholder="Ej: AB12CD" value={code} onChange={e => setCode(e.target.value)} style={{ textTransform: "uppercase" }} /></div>
          {err && <p className="error">{err}</p>}
          <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "..." : "Crear cuenta"}</button>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onBack, onSuccess, flash }) => {
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    if (!phone || !pw) return setErr("Completa todos los campos");
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
    <div className="screen" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh" }}>
      {flash && <div style={{ background: "var(--lime3)", color: "#fff", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13 }}>{flash}</div>}
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 24, marginBottom: 24, alignSelf: "flex-start" }}>←</button>
      <div className="fade-up">
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Iniciar sesión</h2>
        <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 28 }}>Bienvenido de regreso 🍋</p>
        <div className="gap">
          <div><div className="label">Número de teléfono</div><input className="input-field" placeholder="10 dígitos" value={phone} onChange={e => setPhone(e.target.value)} type="tel" /></div>
          <div><div className="label">Contraseña</div><input className="input-field" placeholder="Tu contraseña" value={pw} onChange={e => setPw(e.target.value)} type="password" /></div>
          {err && <p className="error">{err}</p>}
          <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
};

const Home = ({ user, onRefresh }) => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);

  const load = useCallback(async () => {
    const data = await sb(`purchases?user_id=eq.${user.id}&is_active=eq.true&select=*,products(*)`).catch(() => []);
    setPurchases(data);
    setLoading(false);
  }, [user.id]);

  useEffect(() => { load(); }, [load]);

  const claim = async (purchase) => {
    setClaiming(purchase.id);
    try {
      const now = new Date().toISOString();
      await sb("yield_claims", { method: "POST", body: JSON.stringify({ user_id: user.id, purchase_id: purchase.id, amount: purchase.products.daily_return }) });
      await sb(`purchases?id=eq.${purchase.id}`, { method: "PATCH", body: JSON.stringify({ last_claimed_at: now }), prefer: "return=minimal" });
      await sb(`users?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ balance: user.balance + purchase.products.daily_return }), prefer: "return=minimal" });
      onRefresh();
      load();
    } catch (e) { alert("Error: " + e.message); }
    setClaiming(null);
  };

  return (
    <div style={{ padding: "0 0 100px" }}>
      <div style={{ padding: "32px 20px 20px", background: "linear-gradient(180deg, #0f1f0f 0%, var(--bg) 100%)" }}>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Hola 👋</p>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{user.phone}</h2>
        <div className="card" style={{ marginTop: 20, background: "linear-gradient(135deg, var(--lime3), #166534)", border: "none" }}>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 12, marginBottom: 4 }}>Saldo disponible</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: "#fff" }}>{fmt(user.balance)}</h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginTop: 6 }}>Código de referido: <b style={{ color: "#fff" }}>{user.referral_code}</b></p>
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: "var(--muted)" }}>Mis inversiones activas</h3>
        {loading && <div className="spinner" />}
        {!loading && purchases.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p>
            <p>Aún no tienes inversiones.<br />¡Compra tu primer paquete!</p>
          </div>
        )}
        <div className="gap">
          {purchases.map(p => (
            <div key={p.id} className="card fade-up">
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
  const [buying, setBuying] = useState(null);
  const [msg, setMsg] = useState("");

  const buy = async (product) => {
    if (user.balance < product.price) return setMsg("Saldo insuficiente. Realiza un depósito primero.");
    setBuying(product.id); setMsg("");
    try {
      await sb("purchases", { method: "POST", body: JSON.stringify({ user_id: user.id, product_id: product.id }) });
      await sb(`users?id=eq.${user.id}`, { method: "PATCH", body: JSON.stringify({ balance: user.balance - product.price }), prefer: "return=minimal" });
      setMsg(`✅ ¡Compraste el paquete ${product.name}!`);
      onRefresh();
    } catch (e) { setMsg("Error: " + e.message); }
    setBuying(null);
  };

  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Paquetes</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>Invierte y gana rendimiento diario</p>
      {msg && <p className={msg.startsWith("✅") ? "success" : "error"} style={{ marginBottom: 16 }}>{msg}</p>}
      <div className="gap">
        {PRODUCTS.map((p, i) => (
          <div key={p.id} className="card fade-up" style={{ animationDelay: `${i * .08}s`, borderColor: p.color + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: p.color }}>{p.name}</h3>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{fmt(p.price)}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>inversión</div>
              </div>
            </div>
            <div style={{ background: "var(--bg)", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Rendimiento diario</span>
              <span style={{ color: p.color, fontWeight: 700, fontSize: 15 }}>+{fmt(p.daily)}</span>
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

const Deposit = ({ user }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    sb(`deposits?user_id=eq.${user.id}&order=created_at.desc&limit=5`).then(setHistory).catch(() => {});
  }, [user.id, msg]);

  const submit = async () => {
    if (!amount || isNaN(amount) || Number(amount) < 100) return setMsg("Mínimo $100 MXN");
    setLoading(true); setMsg("");
    try {
      await sb("deposits", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: Number(amount) }) });
      setMsg("✅ Solicitud enviada. Envía tu comprobante y en 1-24h se acreditará.");
      setAmount("");
    } catch (e) { setMsg("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Depósito</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>Transfiere a esta cuenta y registra tu depósito</p>
      <div className="card" style={{ marginBottom: 20, borderColor: "var(--lime3)" }}>
        <p style={{ color: "var(--lime)", fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Cuenta de depósito</p>
        {[["Banco", BANK_INFO.banco], ["Titular", BANK_INFO.titular], ["CLABE", BANK_INFO.clabe], ["Cuenta", BANK_INFO.cuenta]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{k}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{v}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="label">Monto a depositar (MXN)</div>
        <input className="input-field" type="number" placeholder="Ej: 200" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginBottom: 14 }} />
        {msg && <p className={msg.startsWith("✅") ? "success" : "error"} style={{ marginBottom: 12 }}>{msg}</p>}
        <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "Enviando..." : "Registrar depósito"}</button>
      </div>
      {history.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>Últimos depósitos</h4>
          <div className="gap">
            {history.map(d => (
              <div key={d.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{fmt(d.amount)}</p>
                  <p style={{ color: "var(--muted)", fontSize: 11 }}>{new Date(d.created_at).toLocaleDateString("es-MX")}</p>
                </div>
                <span className={`badge badge-${d.status}`}>{d.status === "pending" ? "Pendiente" : d.status === "confirmed" ? "Confirmado" : "Rechazado"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Withdraw = ({ user }) => {
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [clabe, setClabe] = useState("");
  const [holder, setHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    sb(`withdrawals?user_id=eq.${user.id}&order=created_at.desc&limit=5`).then(setHistory).catch(() => {});
  }, [user.id, msg]);

  const submit = async () => {
    if (!amount || Number(amount) < 50) return setMsg("Mínimo $50 MXN");
    if (Number(amount) > user.balance) return setMsg("Saldo insuficiente");
    if (!bank || !clabe || !holder) return setMsg("Completa todos los campos bancarios");
    setLoading(true); setMsg("");
    try {
      await sb("withdrawals", { method: "POST", body: JSON.stringify({ user_id: user.id, amount: Number(amount), bank_name: bank, clabe, account_holder: holder }) });
      setMsg("✅ Solicitud enviada. El pago se procesa en 24-48h hábiles.");
      setAmount(""); setBank(""); setClabe(""); setHolder("");
    } catch (e) { setMsg("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 20px 100px" }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Retiro</h2>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 6 }}>Saldo disponible: <b style={{ color: "var(--lime)" }}>{fmt(user.balance)}</b></p>
      <div className="card" style={{ marginTop: 20, marginBottom: 16 }}>
        <div className="gap">
          <div><div className="label">Monto a retirar (MXN)</div><input className="input-field" type="number" placeholder="Mínimo $50" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          <div><div className="label">Banco</div><input className="input-field" placeholder="Ej: BBVA, HSBC, Banamex..." value={bank} onChange={e => setBank(e.target.value)} /></div>
          <div><div className="label">CLABE interbancaria (18 dígitos)</div><input className="input-field" placeholder="012345678901234567" value={clabe} onChange={e => setClabe(e.target.value)} type="tel" maxLength={18} /></div>
          <div><div className="label">Titular de la cuenta</div><input className="input-field" placeholder="Nombre completo" value={holder} onChange={e => setHolder(e.target.value)} /></div>
          {msg && <p className={msg.startsWith("✅") ? "success" : "error"}>{msg}</p>}
          <button className="btn-primary" onClick={submit} disabled={loading}>{loading ? "Enviando..." : "Solicitar retiro"}</button>
        </div>
      </div>
      {history.length > 0 && (
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--muted)" }}>Últimos retiros</h4>
          <div className="gap">
            {history.map(w => (
              <div key={w.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{fmt(w.amount)}</p>
                  <p style={{ color: "var(--muted)", fontSize: 11 }}>{w.bank_name} · {new Date(w.created_at).toLocaleDateString("es-MX")}</p>
                </div>
                <span className={`badge badge-${w.status}`}>{w.status === "pending" ? "Pendiente" : w.status === "paid" ? "Pagado" : "Rechazado"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const NavBar = ({ tab, setTab }) => {
  const items = [
    { id: "home", icon: "🏠", label: "Inicio" },
    { id: "shop", icon: "📦", label: "Paquetes" },
    { id: "deposit", icon: "💳", label: "Depósito" },
    { id: "withdraw", icon: "💸", label: "Retiro" },
  ];
  return (
    <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "var(--card2)", borderTop: "1px solid var(--border)", display: "flex", zIndex: 100 }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)} style={{ flex: 1, background: "none", border: "none", padding: "12px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === it.id ? "var(--lime)" : "var(--muted)", transition: "color .2s" }}>
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span style={{ fontSize: 10, fontFamily: "Syne, sans-serif", fontWeight: 600, letterSpacing: .3 }}>{it.label}</span>
        </button>
      ))}
    </div>
  );
};

export default function App() {
  const [view, setView] = useState("splash");
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [flashMsg, setFlashMsg] = useState("");

  const refreshUser = useCallback(async () => {
    if (!user) return;
    const data = await sb(`users?id=eq.${user.id}&select=*`).catch(() => []);
    if (data.length) setUser(data[0]);
  }, [user]);

  const logout = () => { setUser(null); setView("splash"); setTab("home"); };

  if (view === "splash") return (<><G /><Splash onLogin={() => setView("login")} onRegister={() => setView("register")} /></>);
  if (view === "register") return (<><G /><Register onBack={() => setView("splash")} onSuccess={(m) => { setFlashMsg(m); setView("login"); }} /></>);
  if (view === "login") return (<><G /><Login flash={flashMsg} onBack={() => { setFlashMsg(""); setView("splash"); }} onSuccess={(u) => { setUser(u); setView("app"); setFlashMsg(""); }} /></>);

  return (
    <>
      <G />
      <div className="screen" style={{ overflowY: "auto", height: "100vh" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--bg)", zIndex: 50 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--lime)", fontFamily: "Syne, sans-serif" }}>🍋 Limón Persa</span>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", color: "var(--muted)", fontSize: 12 }}>Salir</button>
        </div>
        {tab === "home"     && <Home     user={user} onRefresh={refreshUser} />}
        {tab === "shop"     && <Shop     user={user} onRefresh={refreshUser} />}
        {tab === "deposit"  && <Deposit  user={user} />}
        {tab === "withdraw" && <Withdraw user={user} />}
        <NavBar tab={tab} setTab={setTab} />
      </div>
    </>
  );
}
