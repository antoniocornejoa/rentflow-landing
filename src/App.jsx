import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

const CityScene = () => {
  const mountRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth, h = mountRef.current.clientHeight;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080e1a, 0.02);
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 500);
    camera.position.set(0, 14, 26); camera.lookAt(0, 2, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x1a2744, 0.5));
    const dl = new THREE.DirectionalLight(0x0d9488, 1.4); dl.position.set(10, 20, 10); scene.add(dl);
    const p1 = new THREE.PointLight(0x0d9488, 2.5, 50); p1.position.set(-8, 10, 5); scene.add(p1);
    const p2 = new THREE.PointLight(0x6366f1, 2, 40); p2.position.set(8, 8, -5); scene.add(p2);
    const gnd = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x080e1a, roughness: 0.95 }));
    gnd.rotation.x = -Math.PI / 2; scene.add(gnd);
    const gr = new THREE.GridHelper(60, 40, 0x0d9488, 0x0f1d30); gr.material.opacity = 0.12; gr.material.transparent = true; scene.add(gr);
    const mats = [
      new THREE.MeshStandardMaterial({ color: 0x0d9488, roughness: 0.3, metalness: 0.7, emissive: 0x0d9488, emissiveIntensity: 0.05 }),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.4, metalness: 0.6 }),
      new THREE.MeshStandardMaterial({ color: 0x6366f1, roughness: 0.3, metalness: 0.7, emissive: 0x6366f1, emissiveIntensity: 0.04 }),
      new THREE.MeshStandardMaterial({ color: 0x134e4a, roughness: 0.5, metalness: 0.5 }),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8, emissive: 0x0f766e, emissiveIntensity: 0.06 }),
    ];
    const wMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0xfbbf24, emissiveIntensity: 0.9, roughness: 0.1 });
    const blds = [];
    for (let i = 0; i < 50; i++) {
      const bw = 0.8 + Math.random() * 2, bh = 2 + Math.random() * 13, bd = 0.8 + Math.random() * 2;
      const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mats[Math.floor(Math.random() * mats.length)]);
      m.position.set((Math.random() - 0.5) * 38, bh / 2, (Math.random() - 0.5) * 38);
      scene.add(m); blds.push({ m, by: bh / 2, sp: 0.3 + Math.random() * 0.6, ph: Math.random() * 6.28 });
      if (bh > 5) for (let f = 0; f < Math.floor(bh / 1.3); f++) if (Math.random() > 0.45) {
        const wm = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.14, 0.25, bd + 0.04), wMat.clone());
        wm.material.emissiveIntensity = 0.3 + Math.random() * 0.7;
        wm.position.set(m.position.x, f * 1.3 + 0.8, m.position.z); scene.add(wm);
      }
    }
    const pG = new THREE.BufferGeometry(), pA = new Float32Array(250 * 3);
    for (let i = 0; i < 750; i += 3) { pA[i] = (Math.random() - 0.5) * 50; pA[i + 1] = Math.random() * 25; pA[i + 2] = (Math.random() - 0.5) * 50; }
    pG.setAttribute("position", new THREE.BufferAttribute(pA, 3));
    const pts = new THREE.Points(pG, new THREE.PointsMaterial({ color: 0x0d9488, size: 0.07, transparent: true, opacity: 0.5 }));
    scene.add(pts);
    const onM = e => { mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1; mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1; };
    window.addEventListener("mousemove", onM);
    let fr;
    const anim = () => { fr = requestAnimationFrame(anim); const t = Date.now() * 0.001;
      camera.position.x += (mouseRef.current.x * 3.5 - camera.position.x) * 0.02;
      camera.position.y += (14 + mouseRef.current.y * 1.5 - camera.position.y) * 0.02;
      camera.lookAt(0, 2, 0); blds.forEach(b => { b.m.position.y = b.by + Math.sin(t * b.sp + b.ph) * 0.12; });
      pts.rotation.y = t * 0.015; p1.position.x = Math.sin(t * 0.4) * 10; p2.position.z = Math.cos(t * 0.3) * 10;
      renderer.render(scene, camera); }; anim();
    const onR = () => { if (!mountRef.current) return; const nw = mountRef.current.clientWidth, nh = mountRef.current.clientHeight; camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh); };
    window.addEventListener("resize", onR);
    return () => { cancelAnimationFrame(fr); window.removeEventListener("mousemove", onM); window.removeEventListener("resize", onR); if (mountRef.current?.contains(renderer.domElement)) mountRef.current.removeChild(renderer.domElement); renderer.dispose(); };
  }, []);
  return <div ref={mountRef} className="absolute inset-0" />;
};

const useInView = (th = 0.12) => { const ref = useRef(null); const [v, setV] = useState(false); useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: th }); if (ref.current) o.observe(ref.current); return () => o.disconnect(); }, []); return [ref, v]; };
const Reveal = ({ children, delay = 0, dir = "up", className = "" }) => { const [ref, v] = useInView(); const t = { up: "translateY(50px)", down: "translateY(-50px)", left: "translateX(50px)", right: "translateX(-50px)", scale: "scale(0.9)" }; return <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : t[dir], transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s` }}>{children}</div>; };

export default function Landing() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [hp, setHp] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [af, setAf] = useState(0);
  useEffect(() => { const fn = () => setScrollY(window.scrollY); window.addEventListener("scroll", fn, { passive: true }); return () => window.removeEventListener("scroll", fn); }, []);
  useEffect(() => { const i = setInterval(() => setAf(f => (f + 1) % 6), 4000); return () => clearInterval(i); }, []);

  const feats = [
    { icon: "⊞", title: "Dashboard en Tiempo Real", desc: "KPIs de ocupación, ingresos, morosidad y rentabilidad actualizados al instante." },
    { icon: "◈", title: "Análisis de Inversión", desc: "Plusvalía en UF, Cap Rate, ROI, flujo de caja con crédito hipotecario. Único en Chile." },
    { icon: "⟐", title: "Contratos Inteligentes", desc: "Reajuste IPC/UF automático, alertas de vencimiento, generación de documentos." },
    { icon: "△", title: "Cobranza Automática", desc: "Detección de morosidad, scoring de arrendatarios, recordatorios inteligentes." },
    { icon: "◎", title: "Mantención Predictiva", desc: "Tickets, proveedores, costos estimados y calendario de mantenciones preventivas." },
    { icon: "❖", title: "IA Integrada", desc: "OCR de documentos, pricing sugerido, predicción de flujo de caja, copilot conversacional." },
  ];
  const plans = [
    { name: "Starter", price: "1.5", clp: "57.375", props: "5", users: "2", features: ["Dashboard completo", "Propiedades y contratos", "Finanzas básicas", "Calendario y alertas"], accent: "#64748b" },
    { name: "Professional", price: "4.5", clp: "172.125", props: "25", users: "5", features: ["Todo de Starter", "Módulo de inversión", "Reportería avanzada", "Documentos y mantenciones", "Cobranza inteligente", "Copilot IA"], popular: true, accent: "#0d9488" },
    { name: "Business", price: "9", clp: "344.250", props: "100", users: "15", features: ["Todo de Professional", "Multi-propietario", "API de integración", "Módulo legal y comercial", "Soporte prioritario", "Reportes white-label"], accent: "#6366f1" },
  ];
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="overflow-x-hidden bg-white" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 20px rgba(13,148,136,0.3)} 50%{box-shadow:0 0 40px rgba(13,148,136,0.5)} }
        @keyframes grad { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .grad-text { background:linear-gradient(135deg,#0d9488,#6366f1,#0d9488); background-size:200% auto; -webkit-background-clip:text; -webkit-text-fill-color:transparent; animation:grad 4s ease infinite; }
        .glow-line { height:1px; background:linear-gradient(90deg,transparent,#0d9488,#6366f1,transparent); }
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500" style={{ background: scrollY > 80 ? "rgba(255,255,255,0.95)" : "transparent", backdropFilter: scrollY > 80 ? "blur(16px)" : "none", boxShadow: scrollY > 80 ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-md">R</div>
            <span className={`text-lg font-extrabold tracking-tight transition-colors ${scrollY > 80 ? "text-slate-800" : "text-white"}`}>Rent<span className="text-teal-500">Flow</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Producto", "Features", "Planes", "Contacto"].map(i => (<a key={i} href={`#${i.toLowerCase()}`} className={`text-sm font-medium transition-colors ${scrollY > 80 ? "text-slate-600 hover:text-teal-600" : "text-white/80 hover:text-white"}`}>{i}</a>))}
            <button onClick={() => scrollTo("waitlist")} className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all">Acceso Anticipado</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className={`md:hidden p-2 ${scrollY > 80 ? "text-slate-700" : "text-white"}`}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={menuOpen ? "M18 6L6 18M6 6l12 12" : "M4 8h16M4 16h16"} /></svg></button>
        </div>
        {menuOpen && <div className="md:hidden px-6 pb-4 space-y-2 bg-white shadow-lg">{["Producto", "Features", "Planes", "Contacto"].map(i => (<a key={i} href={`#${i.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-700 hover:text-teal-600 py-2 font-medium">{i}</a>))}</div>}
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center" style={{ background: "#080e1a" }}>
        <CityScene />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,14,26,0.55), rgba(8,14,26,0.35) 50%, rgba(8,14,26,0.95))" }} />
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <Reveal><div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-900/40 mb-8"><span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" /><span className="text-xs font-semibold text-teal-300 tracking-wide uppercase">Acceso Anticipado — Chile 2026</span></div></Reveal>
          <Reveal delay={0.15}><h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6"><span className="text-white">Gestión</span><br /><span className="text-white">Inmobiliaria</span><br /><span className="grad-text">Inteligente</span></h1></Reveal>
          <Reveal delay={0.3}><p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">La plataforma más completa de Chile para administrar propiedades, analizar inversiones y tomar decisiones con inteligencia artificial.</p></Reveal>
          <Reveal delay={0.45}><div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => scrollTo("waitlist")} className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-base font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-105" style={{ animation: "glow-pulse 3s ease-in-out infinite" }}>Quiero Acceso Anticipado <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span></button>
            <button onClick={() => scrollTo("producto")} className="px-8 py-4 rounded-2xl border-2 border-white/25 text-white text-base font-medium hover:bg-white/10 transition-all">Ver la Plataforma</button>
          </div></Reveal>
          <Reveal delay={0.6}><div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6">{[{ v: "15+", l: "Módulos integrados" }, { v: "100%", l: "Hecho para Chile" }, { v: "UF/IPC", l: "Reajuste automático" }, { v: "IA", l: "Inteligencia nativa" }].map((s, i) => (<div key={i} className="text-center"><div className="text-3xl sm:text-4xl font-black grad-text">{s.v}</div><div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{s.l}</div></div>))}</div></Reveal>
        </div>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"><div className="w-6 h-10 rounded-full border-2 border-white/25 flex items-start justify-center p-1.5"><div className="w-1.5 h-3 rounded-full bg-teal-400 animate-bounce" /></div></div>
      </section>

      {/* PRODUCT — WHITE BG, DARK TEXT */}
      <section id="producto" className="py-24 sm:py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <Reveal><div className="text-center mb-16"><span className="text-xs uppercase tracking-[0.25em] text-teal-600 font-bold">Plataforma</span><h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 leading-tight">Todo lo que necesitas.<br /><span className="text-slate-300">Nada que te sobre.</span></h2></div></Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-3">{feats.map((f, i) => (
              <Reveal key={i} delay={i * 0.06}><button onClick={() => setAf(i)} className={`w-full text-left p-5 rounded-2xl transition-all duration-300 border-2 ${af === i ? "bg-teal-50 border-teal-500 shadow-md" : "bg-slate-50 border-transparent hover:bg-slate-100"}`}>
                <div className="flex items-start gap-4">
                  <span className={`text-2xl mt-0.5 ${af === i ? "text-teal-600" : "text-slate-400"}`}>{f.icon}</span>
                  <div><h3 className={`font-bold text-base ${af === i ? "text-teal-700" : "text-slate-800"}`}>{f.title}</h3><p className={`text-sm mt-1 text-slate-600 transition-all duration-400 overflow-hidden ${af === i ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}`}>{f.desc}</p></div>
                </div>
              </button></Reveal>
            ))}</div>
            <Reveal dir="left">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200" style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)" }}>
                <div className="p-6 min-h-[400px] flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-6"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-amber-400" /><div className="w-3 h-3 rounded-full bg-green-400" /><span className="ml-3 text-xs text-slate-400 font-mono">{feats[af].title}</span></div>
                  <div className="grid grid-cols-2 gap-3">{[{ l: "Propiedades", v: "10" }, { l: "Arrendadas", v: "7" }, { l: "Ingresos", v: "$9.15M" }, { l: "Cap Rate", v: "5.8%" }].map((k, i) => (
                    <div key={i} className={`p-3 rounded-xl border transition-all duration-500 ${af === i ? "bg-teal-900/30 border-teal-500/40" : "bg-slate-800/50 border-slate-700"}`}><div className="text-xs text-slate-400">{k.l}</div><div className="text-xl font-black text-white mt-1">{k.v}</div></div>
                  ))}</div>
                  <div className="h-28 flex items-end gap-1 pt-4">{[40, 55, 45, 65, 50, 70, 60, 80, 65, 85, 75, 90].map((h, i) => (<div key={i} className="flex-1 rounded-t transition-all duration-500" style={{ height: `${h}%`, background: `linear-gradient(to top, rgba(13,148,136,${0.4 + i * 0.04}), rgba(99,102,241,${0.2 + i * 0.03}))`, transitionDelay: `${i * 40}ms` }} />))}</div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CHILE */}
      <section className="py-20 px-6" style={{ background: "linear-gradient(135deg, #f0fdfa, #ecfdf5, #f0f9ff)" }}>
        <div className="max-w-5xl mx-auto text-center">
          <Reveal><span className="text-xs uppercase tracking-[0.25em] text-amber-600 font-bold">Hecho para Chile</span><h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3 mb-12">No adaptado. <span className="grad-text">Diseñado desde cero.</span></h2></Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[{ icon: "◆", t: "Valores en UF y CLP", d: "Reajuste IPC/UF nativo" }, { icon: "◇", t: "RUT Validado", d: "Formato y dígito verificador" }, { icon: "◈", t: "SII Integrado", d: "DJ 1835, contribuciones" }, { icon: "○", t: "Comunas de Chile", d: "Catálogo completo 16 regiones" }].map((item, i) => (
            <Reveal key={i} delay={i * 0.1} dir="scale"><div className="bg-white rounded-2xl p-6 text-center shadow-md border border-slate-100 hover:shadow-xl hover:border-teal-200 transition-all h-full"><div className="text-3xl mb-3 text-teal-600">{item.icon}</div><h3 className="font-bold text-sm text-slate-900">{item.t}</h3><p className="text-xs text-slate-500 mt-1">{item.d}</p></div></Reveal>
          ))}</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="planes" className="py-24 sm:py-32 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <Reveal><div className="text-center mb-14"><span className="text-xs uppercase tracking-[0.25em] text-indigo-600 font-bold">Planes</span><h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-3">Pricing <span className="text-slate-300">simple.</span></h2><p className="text-slate-500 mt-3 text-lg">En UF para que tu precio se ajuste automáticamente. Sin sorpresas.</p></div></Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{plans.map((plan, i) => (
            <Reveal key={i} delay={i * 0.1} dir="scale">
              <div onMouseEnter={() => setHp(i)} className={`relative rounded-3xl transition-all duration-500 ${hp === i ? "scale-[1.02] shadow-2xl" : "shadow-lg"}`} style={{ border: `2px solid ${hp === i ? plan.accent : "#e2e8f0"}` }}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold shadow-md">Más Popular</div>}
                <div className="bg-white rounded-3xl p-7 h-full">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1"><span className="text-5xl font-black text-slate-900">{plan.price}</span><span className="text-slate-500 text-sm">UF/mes</span></div>
                  <p className="text-xs text-slate-400 mt-1">${plan.clp} CLP/mes aprox.</p>
                  <div className="mt-3 flex gap-3 text-sm text-slate-500"><span>{plan.props} propiedades</span><span>•</span><span>{plan.users} usuarios</span></div>
                  <div className="my-5 h-px bg-slate-100" />
                  <ul className="space-y-2.5">{plan.features.map((f, fi) => (<li key={fi} className="flex items-center gap-2.5 text-sm text-slate-700"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke={plan.accent} strokeWidth="1.5" /><path d="M5 8l2 2 4-4" stroke={plan.accent} strokeWidth="1.5" /></svg>{f}</li>))}</ul>
                  <button onClick={() => scrollTo("waitlist")} className={`w-full mt-7 py-3.5 rounded-xl font-bold text-sm transition-all ${plan.popular ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md hover:shadow-lg" : "border-2 border-slate-200 text-slate-700 hover:border-slate-400"}`}>{plan.popular ? "Comenzar Ahora" : "Elegir Plan"}</button>
                </div>
              </div>
            </Reveal>
          ))}</div>
          <Reveal delay={0.3}><p className="text-center text-slate-400 text-sm mt-8">¿Más de 100 propiedades? <a href="#contacto" className="text-teal-600 hover:underline font-medium">Conversemos sobre Enterprise.</a></p></Reveal>
        </div>
      </section>

      {/* WAITLIST — DARK */}
      <section id="waitlist" className="py-24 sm:py-32 px-6" style={{ background: "linear-gradient(135deg, #0f172a, #134e4a)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <Reveal><span className="text-xs uppercase tracking-[0.25em] text-teal-300 font-bold">Acceso Anticipado</span><h2 className="text-4xl sm:text-5xl font-black text-white mt-3 mb-5">Sé de los primeros<br /><span className="grad-text">en transformar tu gestión.</span></h2><p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto">Los primeros 50 administradores y propietarios. Primer mes gratis + onboarding personalizado.</p></Reveal>
          <Reveal delay={0.15}>
            {submitted ? (
              <div className="p-8 rounded-3xl border border-teal-400/30 bg-teal-900/30"><div className="text-5xl mb-4">✓</div><h3 className="text-2xl font-bold text-teal-200">¡Estás en la lista!</h3><p className="text-slate-300 mt-2">Te contactaremos pronto con acceso anticipado.</p></div>
            ) : (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/15">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" className="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-base focus:border-teal-400 focus:outline-none transition-all" onKeyDown={e => e.key === "Enter" && email.includes("@") && setSubmitted(true)} />
                  <button onClick={() => email.includes("@") && setSubmitted(true)} className="px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-base font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 whitespace-nowrap">Reservar mi Lugar</button>
                </div>
                <p className="text-xs text-slate-400 mt-3">Sin compromiso. Sin tarjeta de crédito. Solo acceso prioritario.</p>
              </div>
            )}
          </Reveal>
          <Reveal delay={0.3}><div className="flex flex-wrap justify-center gap-5 mt-10 text-sm text-slate-300">{["14 días gratis", "Sin tarjeta de crédito", "Soporte personalizado", "Migración incluida"].map((t, i) => (<span key={i} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-400" />{t}</span>))}</div></Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contacto" className="bg-slate-900 py-14 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div><div className="flex items-center gap-2.5 mb-4"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-black text-base">R</div><span className="text-lg font-extrabold text-white">Rent<span className="text-teal-400">Flow</span></span></div><p className="text-sm text-slate-400 max-w-xs">Gestión inmobiliaria inteligente para administradores y propietarios en Chile.</p></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">{[{ t: "Producto", i: ["Features", "Planes", "Roadmap", "API"] }, { t: "Empresa", i: ["Nosotros", "Blog", "Prensa", "Contacto"] }, { t: "Legal", i: ["Términos", "Privacidad", "SLA"] }].map(c => (<div key={c.t}><h4 className="font-bold text-white mb-3">{c.t}</h4>{c.i.map(x => <p key={x} className="text-slate-400 hover:text-teal-400 cursor-pointer transition-colors py-1">{x}</p>)}</div>))}</div>
          </div>
          <div className="glow-line mt-10 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500"><span>© 2026 RentFlow.cl. Todos los derechos reservados.</span><span>Diseñado y desarrollado en Chile 🇨🇱</span></div>
        </div>
      </footer>
    </div>
  );
}
