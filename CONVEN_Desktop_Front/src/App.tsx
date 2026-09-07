import React, { useState, useEffect } from 'react';
import { Building2, Users, FileText, Settings, CreditCard, AlertCircle, CheckCircle2, TrendingUp, Download, Plus, Search, Activity, DollarSign, Wrench, Home, ClipboardCheck, Droplets, Zap, Shield, Camera, BarChart2, Edit2, Trash2, LogOut, UserPlus, Key, Eye, EyeOff, UserCheck, User, Mail, Phone } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// ─── AUTH HELPERS ───────────────────────────────────────────
const TOKEN_KEY = 'conven_token';
const USER_KEY  = 'conven_user';

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function getUser(): any | null {
  const u = localStorage.getItem(USER_KEY);
  return u ? JSON.parse(u) : null;
}
function saveSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let licenseBlocked = false;
let globalSetLicenseBlocked: ((val: boolean) => void) | null = null;

const DEMO_USER = { id: 1, username: 'admin', nombre: 'Luis Uzcategui', rol: 'SUPERADMIN', condominioId: 'res-avila' };
if (typeof window !== 'undefined') {
  if (window.location.hostname.includes('github.io') || !localStorage.getItem(TOKEN_KEY)) {
    if (!localStorage.getItem(TOKEN_KEY)) {
      saveSession('demo-token-conven-gh', DEMO_USER);
    }
  }
}

export const apiFetch = async (url: string, options: any = {}) => {
  const token = localStorage.getItem('conven_token');
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  if (licenseBlocked && !url.includes('/api/licencia')) {
    return new Response(JSON.stringify({ error: 'Licencia requerida' }), { status: 402 });
  }

  // Interceptar en GitHub Pages para entrega inmediata 24/7 sin backend
  const isGh = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
  if (isGh) {
    let mockData: any = {};
    if (url.includes('/api/licencia')) {
      mockData = { activado: true, status: 'ACTIVO', tipo: 'EMPRESARIAL' };
    } else if (url.includes('/api/dashboard')) {
      mockData = {
        fondoReserva: { saldoUSD: 14850.00, porcentaje: 10 },
        deudaActiva: { montoUSD: 1280.00, residentesEnMora: 4 },
        gastoMensual: { montoUSD: 3450.00 },
        saldoBancos: { totalVES: 125925.00, totalUSD: 3450.00 },
        totalApartamentos: 64,
        solventes: 60,
        morosos: 4,
        tasaBcv: 36.50,
        logs: [
          { id: 1, tipo: 'INFO', mensaje: 'Emisión de recibos de condominio Período Septiembre 2026', fecha: '2026-09-05T10:30:00Z' },
          { id: 2, tipo: 'INFO', mensaje: 'Pago confirmado Apartamento 1-A (Carlos Mendoza) $85.00', fecha: '2026-09-06T14:15:00Z' },
          { id: 3, tipo: 'ALERTA', mensaje: 'Notificación de mora automática enviada al Apto 2-B', fecha: '2026-09-07T08:00:00Z' },
          { id: 4, tipo: 'INFO', mensaje: 'Mantenimiento preventivo de bombas concluido satisfactoriamente', fecha: '2026-09-07T11:45:00Z' }
        ]
      };
    } else if (url.includes('/api/tesoreria') && url.includes('fondo')) {
      mockData = { saldoUSD: 14850.00, porcentaje: 10 };
    } else if (url.includes('/api/tesoreria')) {
      mockData = [
        { id: 1, nombre: 'Banesco Banco Universal', tipo: 'NACIONAL', saldoUSD: 2100.00, saldoVES: 76650.00 },
        { id: 2, nombre: 'Mercantil Banco', tipo: 'NACIONAL', saldoUSD: 1350.00, saldoVES: 49275.00 }
      ];
    } else if (url.includes('/api/gastos')) {
      mockData = [
        { id: 1, descripcion: 'Mantenimiento de Ascensores Otis (2 Equipos)', montoUSD: 450.00, montoVES: 16425.00, categoria: 'Mantenimiento', fecha: '2026-09-01', estado: 'PAGADO' },
        { id: 2, descripcion: 'Servicio de Vigilancia y Seguridad 24/7', montoUSD: 1200.00, montoVES: 43800.00, categoria: 'Seguridad', fecha: '2026-09-02', estado: 'PAGADO' },
        { id: 3, descripcion: 'Mantenimiento de Bombas de Agua y Tanque', montoUSD: 380.00, montoVES: 13870.00, categoria: 'Mantenimiento', fecha: '2026-09-03', estado: 'PAGADO' },
        { id: 4, descripcion: 'Consumo Eléctrico Áreas Comunes (Corpoelec)', montoUSD: 290.00, montoVES: 10585.00, categoria: 'Servicios', fecha: '2026-09-04', estado: 'PENDIENTE' },
        { id: 5, descripcion: 'Hidrocapital - Facturación de Agua Edificio', montoUSD: 160.00, montoVES: 5840.00, categoria: 'Servicios', fecha: '2026-09-05', estado: 'PAGADO' }
      ];
    } else if (url.includes('/api/residentes')) {
      mockData = [
        { id: 1, apartamento: '1-A', propietario: 'Carlos Mendoza', alicuota: 1.56, saldoUSD: 0.00, estado: 'SOLVENTE', telefono: '0414-2345678', email: 'cmendoza@gmail.com' },
        { id: 2, apartamento: '1-B', propietario: 'Elena Rivas', alicuota: 1.56, saldoUSD: 85.00, estado: 'PENDIENTE', telefono: '0424-3456789', email: 'erivas@gmail.com' },
        { id: 3, apartamento: '2-A', propietario: 'Roberto Gómez', alicuota: 1.56, saldoUSD: 0.00, estado: 'SOLVENTE', telefono: '0412-4567890', email: 'rgomez@gmail.com' },
        { id: 4, apartamento: '2-B', propietario: 'María Fernández', alicuota: 1.56, saldoUSD: 170.00, estado: 'MOROSO', telefono: '0416-5678901', email: 'mfernandez@gmail.com' },
        { id: 5, apartamento: '3-A', propietario: 'Javier Castillo', alicuota: 1.56, saldoUSD: 0.00, estado: 'SOLVENTE', telefono: '0414-6789012', email: 'jcastillo@gmail.com' },
        { id: 6, apartamento: 'PH-1', propietario: 'Inés Benítez', alicuota: 3.12, saldoUSD: 0.00, estado: 'SOLVENTE', telefono: '0424-7890123', email: 'ibenitez@gmail.com' }
      ];
    } else if (url.includes('/api/config')) {
      mockData = {
        id: 'res-avila',
        nombre: 'Residencias Parque El Ávila',
        rif: 'J-40982314-5',
        direccion: 'Av. Principal Los Palos Grandes, Caracas',
        tasaBcv: 36.50,
        totalAlicuotas: 100,
        fondoReservaPorcentaje: 10
      };
    } else if (url.includes('/api/usuarios')) {
      mockData = [
        { id: 1, username: 'admin', nombre: 'Luis Uzcategui', rol: 'SUPERADMIN', email: 'tecnicouzcategui@gmail.com' }
      ];
    } else if (url.includes('/api/facturacion')) {
      mockData = { success: true, generado: true, totalRecibos: 64 };
    } else {
      mockData = { success: true, message: 'Operación realizada en modo demo' };
    }
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (res.status === 402) {
      if (!licenseBlocked && globalSetLicenseBlocked) {
        licenseBlocked = true;
        globalSetLicenseBlocked(true);
      }
      return res;
    }
    if (res.status === 401 && !url.includes('/api/auth')) {
      clearSession();
      window.location.reload();
    }
    if (res.ok) return res;
  } catch (err) {}

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const fmtVE = (n: number) => {
  if (n === null || n === undefined || isNaN(n)) return '0,00';
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function App() {
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [tasaBcv, setTasaBcv]               = useState('36.50');
  const [authed, setAuthed]                 = useState<boolean>(!!getToken());
  const [currentUser, setCurrentUser]       = useState<any>(getUser());
  const [activeCondominio, setActiveCondominio] = useState(currentUser?.condominioId || 'default');
  const [isLicenseBlocked, setIsLicenseBlocked] = useState<boolean>(false);

  useEffect(() => {
    globalSetLicenseBlocked = setIsLicenseBlocked;
    apiFetch('/api/licencia/status').then(r => r.json()).then(d => {
      if (d && d.activado === false) {
        licenseBlocked = true;
        setIsLicenseBlocked(true);
      }
    }).catch(console.error);
  }, []);

  const handleLogin = (token: string, user: any) => {
    saveSession(token, user);
    setCurrentUser(user);
    if(user.condominioId) setActiveCondominio(user.condominioId);
    setAuthed(true);
  };

  const handleLogout = () => {
    clearSession();
    setAuthed(false);
    setCurrentUser(null);
  };

  useEffect(() => {
    if (authed) {
      fetch('https://ve.dolarapi.com/v1/dolares/oficial')
        .then(r => r.json())
        .then(data => {
          if (data && data.promedio) {
            setTasaBcv(data.promedio.toFixed(2));
          }
        })
        .catch(e => console.error('Error fetching BCV rate:', e));
    }
  }, [authed]);

  if (isLicenseBlocked) {
    return <LicenseScreen onActivated={() => {
      licenseBlocked = false;
      setIsLicenseBlocked(false);
      window.location.reload();
    }} />;
  }

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-[#080C17] text-agent-text overflow-hidden font-sans relative">
      {/* Decorative blurred background blobs removed by user request */}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tasaBcv={tasaBcv} setTasaBcv={setTasaBcv} currentUser={currentUser} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Header activeTab={activeTab} currentUser={currentUser} onLogout={handleLogout} />
        
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && <DashboardPanel activeCondominio={activeCondominio} />}
            {activeTab === 'facturacion' && <FacturacionPanel tasaBcv={tasaBcv} />}
            {activeTab === 'residentes' && <ResidentesPanel />}
            {activeTab === 'comando' && <ComandoPanel currentUser={currentUser} />}
            {activeTab === 'arquitectura' && <ArquitecturaPanel activeCondominio={activeCondominio} />}
            {activeTab === 'apartamentos' && <ApartamentosPanel />}
            {activeTab === 'finanzas' && <FinanzasPanel />}
            {activeTab === 'cobranza' && <CobranzaPanel activeCondominio={activeCondominio} />}
            {activeTab === 'inspecciones' && <InspeccionesPanel />}
            {activeTab === 'reportes' && <ReportesPanel activeCondominio={activeCondominio} />}
            {activeTab === 'auditoria' && <AuditoriaForensePanel />}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Componentes Compartidos ---

function Sidebar({ activeTab, setActiveTab, tasaBcv, setTasaBcv, currentUser }: any) {
  return (
    <aside className="w-56 glass-panel border-r border-agent-border text-agent-text flex flex-col z-10 shrink-0">
      <div className="p-6 flex items-center gap-3 border-b border-agent-border">
        <div className="w-10 h-10 rounded-lg bg-agent-accent/20 border border-agent-accent/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Building2 className="w-6 h-6 text-agent-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider text-white">CONVEN</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        <NavItem icon={<Activity />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<CreditCard />} label="Facturación LPH" active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')} />

        <NavItem icon={<Settings />} label="Configuración" active={activeTab === 'comando'} onClick={() => setActiveTab('comando')} />
        <NavItem icon={<Building2 />} label="Estructura & Alícuotas" active={activeTab === 'arquitectura'} onClick={() => setActiveTab('arquitectura')} />
        <NavItem icon={<Home />} label="Apartamentos" active={activeTab === 'apartamentos'} onClick={() => setActiveTab('apartamentos')} />
        <NavItem icon={<DollarSign />} label="Finanzas y Bancos" active={activeTab === 'finanzas'} onClick={() => setActiveTab('finanzas')} />
        <NavItem icon={<AlertCircle />} label="Gestión de Cobranzas" active={activeTab === 'cobranza'} onClick={() => setActiveTab('cobranza')} />
        <NavItem icon={<ClipboardCheck />} label="Inspecciones" active={activeTab === 'inspecciones'} onClick={() => setActiveTab('inspecciones')} />
        <NavItem icon={<FileText />} label="Reportes" active={activeTab === 'reportes'} onClick={() => setActiveTab('reportes')} />
        {currentUser?.rol === 'SUPERADMIN' && (
          <NavItem icon={<Shield />} label="Auditoría Forense" active={activeTab === 'auditoria'} onClick={() => setActiveTab('auditoria')} />
        )}
      </nav>

      <div className="p-4 border-t border-agent-border glass-panel">
        <div className="bg-black/30 p-3 rounded-lg border border-agent-border mt-4 flex items-center justify-between shadow-inner">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tasa Oficial BCV</span>
            <div className="flex items-center gap-1 mt-1">
              <input type="number" step="0.01" value={tasaBcv} onChange={e => setTasaBcv(e.target.value)} className="bg-transparent border-b border-agent-cyan/30 hover:border-agent-cyan/80 focus:border-agent-cyan focus:outline-none text-agent-cyan font-bold text-lg drop-shadow-[0_0_8px_rgba(6,182,212,0.4)] w-16 text-right transition-colors" />
              <span className="text-base font-normal text-slate-200">VES/USD</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Header({ activeTab, currentUser, onLogout }: { activeTab: string; currentUser: any; onLogout: () => void }) {
  const titles: any = {
    dashboard: 'Panel de Control Principal',
    facturacion: 'Facturación Bimonetaria y Alícuotas',
    residentes: 'Gestión de Propietarios e Inquilinos',
    comando: 'Configuración Residencial',
    arquitectura: 'Estructura Arquitectónica y Motor de Alícuotas',
    familias: 'Gestión de Núcleos Familiares',
    finanzas: 'Gestión de Finanzas y Bancos',
    cobranza: 'Control de Deudas y Cobranzas',
    inspecciones: 'Inspecciones y Mantenimientos',
    reportes: 'Informes Financieros y de Gestión',
    auditoria: 'Bóveda Criptográfica WORM'
  };

  return (
    <header className="glass-panel border-b border-agent-border px-6 py-4 flex justify-between items-center z-10 shrink-0">
      <h2 className="text-xl font-semibold text-white">{titles[activeTab]}</h2>
      <div className="flex items-center gap-3">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold text-white">{currentUser?.username || 'Usuario'}</span>
          <span className="text-xs text-agent-cyan">{currentUser?.rol === 'SUPERADMIN' ? '★ Super Admin' : 'Operador'}</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-agent-accent/20 border border-agent-accent/50 flex items-center justify-center text-agent-accent font-bold text-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]">
          {(currentUser?.username || 'U')[0].toUpperCase()}
        </div>
        <button onClick={onLogout} title="Cerrar Sesión"
          className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm ${
        active 
          ? 'bg-agent-accent/10 text-agent-accent font-bold border border-agent-accent/30 shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]' 
          : 'text-slate-300 font-medium hover:bg-agent-border/50 hover:text-white'
      }`}
    >
      <span className="shrink-0">{React.cloneElement(icon, { className: 'w-5 h-5' })}</span>
      <span className="truncate">{label}</span>
    </button>
  );
}

function StatCard({ title, amount, subtext, color, icon }: any) {
  // Using inline styles for dynamic glow colors based on the theme prop
  const glowColor = color === 'cyan' ? 'rgba(6,182,212,0.3)' : color === 'accent' ? 'rgba(59,130,246,0.3)' : color === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
  const textColorClass = color === 'cyan' ? 'text-agent-cyan' : color === 'accent' ? 'text-agent-accent' : color === 'success' ? 'text-agent-success' : 'text-agent-danger';
  const borderColorClass = color === 'cyan' ? 'border-agent-cyan/30' : color === 'accent' ? 'border-agent-accent/30' : color === 'success' ? 'border-agent-success/30' : 'border-agent-danger/30';

  return (
    <div className={`p-6 rounded-xl border glass-panel transition-transform hover:-translate-y-1 duration-300 cursor-default flex flex-col ${borderColorClass}`} style={{ boxShadow: `0 0 20px ${glowColor} inset` }}>
      <div className="flex justify-between items-start">
        <h3 className="text-base font-bold uppercase tracking-wider text-slate-200">{title}</h3>
        <div className={`p-2 rounded-lg bg-black/40 ${textColorClass}`}>
          {icon}
        </div>
      </div>
      <p className={`text-3xl font-extrabold mt-4 ${textColorClass} drop-shadow-md`}>{amount}</p>
      <p className="text-base mt-2 font-medium text-slate-200">{subtext}</p>
    </div>
  );
}

// --- Componentes ---

function DashboardPanel({ activeCondominio }: { activeCondominio: string }) {
  const [data, setData] = React.useState<any>(null);
  
  React.useEffect(() => {
    if(!activeCondominio) return;
    apiFetch(`/api/dashboard/${activeCondominio}`)
      .then(r => r.json())
      .then(d => setData(d)).catch(err => setData({ error: err.message }));
  }, [activeCondominio]);

  if(!data) return <div className="text-white p-6">Cargando métricas financieras...</div>;
  if(data.error) return <div className="text-red-500 p-6 flex flex-col items-center justify-center h-64"><h3 className="text-xl font-bold mb-2">Error cargando dashboard</h3><p>{data.error}</p></div>;
  if(data.error) return <div className="text-red-500 p-6 flex flex-col items-center justify-center h-64"><h3 className="text-xl font-bold mb-2">Error cargando dashboard</h3><p>{data.error}</p></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Fondo de Reserva" amount={`$ ${fmtVE(data.fondoReserva.saldoUSD)}`} subtext={`${data.fondoReserva.porcentaje}% del presupuesto`} color="cyan" icon={<DollarSign className="w-5 h-5"/>} />
        <StatCard title="Deuda Activa" amount={`$ ${fmtVE(data.deudaActiva.montoUSD)}`} subtext={`${data.deudaActiva.residentesEnMora} residentes en mora`} color={data.deudaActiva.montoUSD > 0 ? "danger" : "success"} icon={<AlertCircle className="w-5 h-5"/>} />
        <StatCard title="Gasto Mensual" amount={`$ ${fmtVE(data.gastoMensual.montoUSD)}`} subtext="Mes actual" color="accent" icon={<TrendingUp className="w-5 h-5"/>} />
        <StatCard title="Saldo Bancos" amount={`Bs. ${fmtVE(data.saldoBancos.totalVES)} / $ ${fmtVE(data.saldoBancos.totalUSD)}`} subtext="Total Cuentas" color="success" icon={<Activity className="w-5 h-5"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl shadow-lg border border-agent-border p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-agent-accent" /> Flujo de Caja Financiero
            </h3>
            <select className="bg-agent-bg border border-agent-border text-agent-text text-base rounded-lg px-3 py-1.5 outline-none focus:border-agent-accent transition-colors">
              <option>Expresado en USD</option>
              <option>Expresado en VES</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 mt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
              <div className="border-t border-agent-accent/50 w-full"></div>
              <div className="border-t border-agent-accent/50 w-full"></div>
              <div className="border-t border-agent-accent/50 w-full"></div>
              <div className="border-t border-agent-accent/50 w-full"></div>
            </div>
            {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN'].map((m, i) => (
              <div key={m} className="flex flex-col items-center gap-3 w-full group">
                <div className="w-full bg-gradient-to-t from-agent-accent/20 to-agent-accent/80 rounded-t-sm transition-all duration-300 group-hover:to-agent-accent" style={{height: `${30 + Math.random() * 60}%`}}></div>
                <span className="text-sm font-sans font-semibold tracking-wide text-slate-200">{m}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-xl shadow-lg border border-agent-border p-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-agent-cyan" /> Log del Sistema
          </h3>
          <div className="space-y-5">
            {(data.logs || []).map((log: any) => (
              <div key={log.id} className="flex gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full ${log.tipo === 'ALERTA' ? 'bg-agent-danger animate-pulse' : 'bg-agent-success'}`}></div>
                <div>
                  <p className={`text-base font-sans font-semibold tracking-wide ${log.tipo === 'ALERTA' ? 'text-agent-danger' : 'text-slate-200'}`}>{log.mensaje}</p>
                  <p className="text-sm font-sans font-semibold tracking-wide text-slate-200 mt-1">{new Date(log.fecha).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!data.logs || data.logs.length === 0) && <p className="text-slate-400 font-sans font-semibold tracking-wide">Sin actividad reciente</p>}
          </div>
          <button className="w-full mt-6 py-2 border border-agent-border rounded-lg text-agent-text hover:text-white hover:border-agent-cyan transition-colors font-sans font-semibold tracking-wide text-sm">Ver Logs Completos</button>
        </div>
      </div>
    </div>
  );
}

function FacturacionPanel({ tasaBcv }: any) {
  const [calculoRealizado, setCalculoRealizado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [gastos, setGastos] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: '', categoria: 'SERVICIOS', monto: '', moneda: 'USD', facturaRef: '' });
  const [editingGasto, setEditingGasto] = useState<any>(null);

  const fetchGastos = async () => {
    try {
      const response = await apiFetch('/api/gastos');
      const data = await response.json();
      const pendientes = data.filter((g: any) => !g.mesCierre);
      setGastos(pendientes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchGastos(); }, []);

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoGasto)
      });
      setShowForm(false);
      setNuevoGasto({ concepto: '', categoria: 'SERVICIOS', monto: '', moneda: 'USD', facturaRef: '' });
      fetchGastos();
    } catch (e) { alert('Error al guardar'); }
  };

  const handleUpdateGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGasto) return;
    try {
      await apiFetch(`/api/gastos/${editingGasto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGasto)
      });
      setEditingGasto(null);
      fetchGastos();
    } catch (e) { alert('Error al actualizar'); }
  };

  const handleDeleteGasto = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await apiFetch(`/api/gastos/${id}`, { method: 'DELETE' });
      fetchGastos();
    } catch (e) { alert('Error al eliminar'); }
  };

  const procesarCalculo = async (save = false) => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/facturacion/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), tasaBCV: tasaBcv, save })
      });
      const data = await response.json();
      if (data.error) alert(data.error);
      else {
        setCalculoRealizado(data);
        if (save) { alert('Avisos Generados.'); fetchGastos(); }
      }
    } catch (e) { } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-agent-cyan" /> Motor Contable Bimonetario
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Registro de facturas y cálculo de alícuotas automáticas</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowForm(!showForm)} className="glass-panel hover:border-agent-cyan text-agent-text hover:text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2 font-sans font-semibold text-base">
            <Plus className="w-4 h-4 text-agent-cyan" /> NUEVO REGISTRO
          </button>
          <button onClick={() => procesarCalculo(false)} disabled={loading || gastos.length === 0} className="bg-agent-accent/10 border border-agent-accent/50 text-agent-accent hover:bg-agent-accent hover:text-white px-6 py-2.5 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-2 disabled:opacity-30 disabled:hover:bg-agent-accent/10 disabled:hover:text-agent-accent">
            <TrendingUp className="w-4 h-4" /> {loading ? 'COMPUTANDO...' : 'SIMULAR ALICUOTAS'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleAddGasto} className="glass-panel !border-agent-cyan/30 p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col gap-4 font-sans font-semibold tracking-wide">
          <h4 className="font-bold text-agent-cyan border-b border-agent-border pb-2 text-base">INGRESO DE FACTURA</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="text-base text-slate-200 block mb-1">CONCEPTO</label>
              <input required type="text" value={nuevoGasto.concepto} onChange={e => setNuevoGasto({...nuevoGasto, concepto: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" placeholder="Ej. Corpoelec" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">CATEGORIA</label>
              <select value={nuevoGasto.categoria} onChange={e => setNuevoGasto({...nuevoGasto, categoria: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                <option value="SERVICIOS">SERVICIOS</option>
                <option value="NOMINA">NOMINA</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
              </select>
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">MONTO</label>
              <input required type="number" step="0.01" value={nuevoGasto.monto} onChange={e => setNuevoGasto({...nuevoGasto, monto: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">MONEDA</label>
              <select value={nuevoGasto.moneda} onChange={e => setNuevoGasto({...nuevoGasto, moneda: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                <option value="USD">USD</option>
                <option value="VES">VES</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-200 hover:text-white transition-colors">CANCELAR</button>
            <button type="submit" className="px-5 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]">GUARDAR</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl shadow-lg flex flex-col h-[500px]">
          <div className="p-5 border-b border-agent-border bg-black/40 shrink-0">
            <h4 className="font-semibold text-white font-sans font-semibold tracking-wide flex items-center gap-2"><FileText className="w-4 h-4 text-agent-cyan"/> MATRIZ DE GASTOS ({gastos.length})</h4>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse font-sans font-semibold text-base">
              <thead>
                <tr className="border-b border-agent-border text-base text-slate-200 uppercase bg-agent-bg/80 sticky top-0 backdrop-blur-md">
                  <th className="p-4 font-normal">Descripción</th>
                  <th className="p-4 font-normal">CATEGORIA</th>
                  <th className="p-4 font-normal text-right">USD</th>
                  <th className="p-4 font-normal text-right">VES</th>
                  <th className="p-4 font-normal text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-agent-border/50">
                {gastos.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-200">Sistema a la espera de entradas contables.</td></tr>
                ) : gastos.map((g, i) => (
                  editingGasto?.id === g.id ? (
                    <tr key={i} className="bg-agent-cyan/5">
                      <td colSpan={5} className="p-3">
                        <form onSubmit={handleUpdateGasto} className="flex flex-wrap gap-2 items-end">
                          <input required value={editingGasto.concepto} onChange={e => setEditingGasto({...editingGasto, concepto: e.target.value})} className="bg-agent-bg border border-agent-cyan text-white p-2 rounded text-sm flex-1 min-w-[120px]" placeholder="Concepto" />
                          <select value={editingGasto.categoria} onChange={e => setEditingGasto({...editingGasto, categoria: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm">
                            <option value="SERVICIOS">SERVICIOS</option>
                            <option value="NOMINA">NOMINA</option>
                            <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                          </select>
                          <input required type="number" step="0.01" value={editingGasto.monto} onChange={e => setEditingGasto({...editingGasto, monto: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-28" placeholder="Monto" />
                          <select value={editingGasto.moneda} onChange={e => setEditingGasto({...editingGasto, moneda: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm">
                            <option value="USD">USD</option>
                            <option value="VES">VES</option>
                          </select>
                          <button type="submit" className="px-3 py-2 bg-agent-cyan text-black font-bold rounded text-sm hover:bg-cyan-400 transition-colors">GUARDAR</button>
                          <button type="button" onClick={() => setEditingGasto(null)} className="px-3 py-2 text-slate-300 hover:text-white text-sm transition-colors">CANCELAR</button>
                        </form>
                      </td>
                    </tr>
                  ) : (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-white">{g.concepto}</td>
                    <td className="p-4"><span className="text-xs border border-agent-border px-2 py-1 rounded text-slate-200">{g.categoria}</span></td>
                    <td className="p-4 text-right text-agent-cyan font-bold">{g.moneda === 'USD' ? `$ ${g.monto.toFixed(2)}` : <span className="text-agent-cyan/50 font-normal">$ {(g.monto / (tasaBcv || 1)).toFixed(2)}</span>}</td>
                    <td className="p-4 text-right text-agent-success font-bold">{g.moneda === 'VES' ? `Bs. ${g.monto.toFixed(2)}` : <span className="text-agent-success/50 font-normal">Bs. {(g.monto * (tasaBcv || 1)).toFixed(2)}</span>}</td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center transition-opacity">
                        <button onClick={() => setEditingGasto({...g, monto: g.monto.toString()})} className="px-3 py-1 bg-agent-accent/20 border border-agent-accent/50 text-agent-accent rounded text-xs font-bold hover:bg-agent-accent hover:text-white transition-all">EDITAR</button>
                        <button onClick={() => handleDeleteGasto(g.id)} className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition-all">ELIMINAR</button>
                      </div>
                    </td>
                  </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
          {calculoRealizado && (
            <div className="bg-agent-accent/10 border-t border-agent-accent/30 font-bold text-white shrink-0 p-4 flex justify-between items-center font-sans font-semibold tracking-wide">
              <span className="text-agent-accent text-base">TOTALIZACION ALFANUMERICA</span>
              <div className="text-right flex gap-6">
                <span className="text-agent-cyan drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">$ {Number(calculoRealizado.gastoTotalUSD).toFixed(2)}</span>
                <span className="text-agent-success drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">Bs. {Number(calculoRealizado.gastoTotalVES).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-agent-bg border border-agent-accent/30 rounded-xl shadow-[inset_0_0_30px_rgba(59,130,246,0.05)] p-6 flex flex-col relative overflow-hidden h-[500px]">
          <h4 className="font-semibold text-lg text-agent-accent mb-4 relative z-10 font-sans font-semibold tracking-wide tracking-widest">ALGORITMO LPH</h4>
          
          {calculoRealizado ? (
            <div className="space-y-4 flex-1 relative z-10 flex flex-col min-h-0">
              <p className="text-base text-agent-success mb-2 border-b border-agent-border pb-2 shrink-0 font-sans font-semibold tracking-wide">► OPERACION EXITOSA</p>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {calculoRealizado.distribucion.map((d: any, i: number) => (
                  <div key={i} className="glass-panel rounded-lg p-3 hover:border-agent-cyan/50 transition-colors">
                    <p className="font-bold text-white mb-1 font-sans font-semibold text-base">{d.propiedadId}</p>
                    <div className="flex justify-between text-base font-sans font-semibold tracking-wide mb-1">
                      <span className="text-slate-200">USD:</span>
                      <span className="font-bold text-agent-cyan">${d.cuotaUSD}</span>
                    </div>
                    <div className="flex justify-between text-base font-sans font-semibold tracking-wide">
                      <span className="text-slate-200">VES:</span>
                      <span className="font-bold text-agent-success">Bs. {d.cuotaVES}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => procesarCalculo(true)} className="w-full mt-4 bg-gradient-to-r from-agent-accent to-agent-cyan text-black py-3 rounded text-base font-bold transition-all hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] shrink-0 font-sans font-semibold tracking-wide">
                EJECUTAR CIERRE
              </button>
            </div>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 opacity-50">
               <Settings className="w-16 h-16 mb-6 text-agent-accent animate-spin-slow opacity-30" />
               <p className="text-base font-sans font-semibold tracking-wide text-slate-200 uppercase tracking-wider">Esperando parámetros<br/>para iniciar simulación.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResidentesPanel() {
  const [residentes, setResidentes] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: '', propiedadId: '', esPropietario: 'PROPIETARIO' });

  const fetchDatos = async () => {
    try {
      const res = await apiFetch('/api/residentes');
      const data = await res.json();
      if (!data.error) setResidentes(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/residentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
      const data = await res.json();
      if (res.status === 400 && data.error === 'GarabatoDetectado') {
        alert('⚠️ FILTRO ACTIVADO: ' + data.message);
        return;
      }
      setShowForm(false);
      setNuevo({ nombre: '', propiedadId: '', esPropietario: 'PROPIETARIO' });
      fetchDatos();
    } catch (e) { alert('Error conectando al servidor'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-agent-cyan" /> Directorio de Residentes
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Censo poblacional y de propiedades</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-agent-accent/10 border border-agent-accent/50 text-agent-accent hover:bg-agent-accent hover:text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Residente
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel !border-agent-cyan/30 p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col gap-4 font-sans font-semibold tracking-wide">
          <h4 className="font-bold text-agent-cyan border-b border-agent-border pb-2 text-base">REGISTRO DE RESIDENTE</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-base text-slate-200 block mb-1">NOMBRE COMPLETO</label>
              <input required type="text" value={nuevo.nombre} onChange={e => setNuevo({...nuevo, nombre: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">APTO / INMUEBLE</label>
              <input required type="text" value={nuevo.propiedadId} onChange={e => setNuevo({...nuevo, propiedadId: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">CONDICION</label>
              <select value={nuevo.esPropietario} onChange={e => setNuevo({...nuevo, esPropietario: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                <option value="PROPIETARIO">PROPIETARIO</option>
                <option value="INQUILINO">INQUILINO</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-200 hover:text-white transition-colors">CANCELAR</button>
            <button type="submit" className="px-5 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]">GUARDAR</button>
          </div>
        </form>
      )}

      <div className="glass-panel rounded-xl shadow-lg">
        <table className="w-full text-left border-collapse font-sans font-semibold text-base">
          <thead>
            <tr className="border-b border-agent-border text-base text-slate-200 uppercase bg-black/40">
              <th className="p-4 font-normal">Apto/Inmueble</th>
              <th className="p-4 font-normal">Nombre Completo</th>
              <th className="p-4 font-normal">Condición</th>
              <th className="p-4 font-normal text-right">Estatus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-agent-border/50">
            {residentes.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-200">No hay residentes registrados.</td></tr>
            ) : residentes.map((r, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors">
                <td className="p-4 text-agent-cyan font-bold">{r.apt}</td>
                <td className="p-4 text-white">{r.nombre}</td>
                <td className="p-4"><span className="text-xs border border-agent-border px-2 py-1 rounded text-slate-200">{r.rol}</span></td>
                <td className="p-4 text-right">
                  <span className={`text-xs px-2 py-1 rounded font-bold ${r.estado === 'ACTIVO' ? 'text-agent-success bg-agent-success/10 border-agent-success/30' : 'text-agent-danger bg-agent-danger/10 border-agent-danger/30'} border`}>{r.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ComandoPanel({ currentUser }: { currentUser?: any }) {
  const [config, setConfig] = React.useState<any>(null);
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState({ nombre: '', rif: '', direccion: '', administrador: '', telefono: '', email: '' });
  const [saved, setSaved] = React.useState(false);
  const [stats, setStats] = React.useState<any>(null);

  // Users Management State
  const [usuarios, setUsuarios] = React.useState<any[]>([]);
  const [showUserForm, setShowUserForm] = React.useState(false);
  const [userForm, setUserForm] = React.useState({ username: '', email: '', password: '', rol: 'CONDOMINIO' });

  // Change Password State
  const [pwdForm, setPwdForm] = React.useState({ actual: '', nueva: '' });
  const [pwdMsg, setPwdMsg] = React.useState('');

  const fetchUsers = () => {
    if (currentUser?.rol !== 'SUPERADMIN') return;
    apiFetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(Array.isArray(d) ? d : [])).catch(console.error);
  };

  React.useEffect(() => {
    apiFetch('/api/config').then(r => r.json()).then(data => {
      setConfig(data);
      setForm({
        nombre: data.nombre || '',
        rif: data.rif || '',
        direccion: data.direccion || '',
        administrador: data.administrador || '',
        telefono: data.telefono || '',
        email: data.email || ''
      });
    }).catch(console.error);
    apiFetch('/api/dashboard').then(r => r.json()).then(d => { if(!d.error) setStats(d) }).catch(console.error);
    fetchUsers();
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      await apiFetch(`/api/config/${config.id}`, {
        method: 'PUT',
        body: JSON.stringify(form)
      });
      setConfig({ ...config, ...form });
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Error al guardar'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/usuarios', {
        method: 'POST',
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error creando usuario');
      setShowUserForm(false);
      setUserForm({ username: '', email: '', password: '', rol: 'CONDOMINIO' });
      fetchUsers();
    } catch (e: any) { alert(e.message); }
  };

  const handleToggleUser = async (id: string, activo: boolean) => {
    try {
      await apiFetch(`/api/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !activo })
      });
      fetchUsers();
    } catch (e) { alert('Error actualizando usuario'); }
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/auth/cambiar-password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual: pwdForm.actual, passwordNueva: pwdForm.nueva })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPwdMsg('Contraseña actualizada');
      setPwdForm({ actual: '', nueva: '' });
      setTimeout(() => setPwdMsg(''), 3000);
    } catch (e: any) { alert(e.message); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-agent-cyan" /> Configuración Residencial
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Datos del condominio, administrador y estadísticas generales</p>
        </div>
        {saved && (
          <span className="text-agent-success font-bold flex items-center gap-2 text-base"><CheckCircle2 className="w-5 h-5"/> Cambios guardados</span>
        )}
      </div>

      {/* Stats rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Apartamentos', value: stats.totalPropiedades ?? '-', color: 'text-agent-cyan' },
            { label: 'Familias Registradas', value: stats.totalFamilias ?? '-', color: 'text-agent-accent' },
            { label: 'En Mora', value: stats.totalMora ?? '-', color: 'text-agent-danger' },
            { label: 'Gastos del Mes', value: stats.gastoMensual ? `$ ${Number(stats.gastoMensual).toFixed(2)}` : '$ 0.00', color: 'text-agent-success' }
          ].map((s, i) => (
            <div key={i} className="glass-panel p-4 rounded-xl text-center">
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Datos del Condominio */}
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-bold text-white text-base flex items-center gap-2"><Building2 className="w-5 h-5 text-agent-cyan"/>  Datos del Condominio</h4>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-agent-accent/10 border border-agent-accent/40 text-agent-accent rounded-lg hover:bg-agent-accent hover:text-white transition-all text-sm font-bold">
              <Edit2 className="w-4 h-4"/> Editar
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Nombre del Condominio</label>
              <input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} required
                className="w-full bg-agent-bg border border-agent-cyan text-white p-2.5 rounded focus:outline-none transition-colors text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">RIF</label>
              <input value={form.rif} readOnly
                title="El RIF no es editable"
                className="w-full bg-agent-bg border border-agent-border text-slate-400 p-2.5 rounded cursor-not-allowed text-sm opacity-70" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Dirección</label>
              <input value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})}
                placeholder="Av. Principal, Torre X, Municipio..."
                className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Nombre del Administrador</label>
              <input value={form.administrador} onChange={e => setForm({...form, administrador: e.target.value})}
                className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Teléfono de Contacto</label>
              <input value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})}
                placeholder="0412-0000000"
                className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors text-sm" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">Correo Electrónico</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                placeholder="admin@condominio.com"
                className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors text-sm" />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="px-5 py-2 text-slate-300 hover:text-white transition-colors">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]">Guardar Cambios</button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Nombre del Condominio', value: config?.nombre || '-' },
              { label: 'RIF', value: config?.rif || '-' },
              { label: 'Dirección', value: form.direccion || 'No especificada', full: true },
              { label: 'Administrador', value: form.administrador || 'No especificado' },
              { label: 'Teléfono', value: form.telefono || 'No especificado' },
              { label: 'Correo', value: form.email || 'No especificado' },
            ].map((item, i) => (
              <div key={i} className={`bg-black/20 rounded-lg p-4 border border-white/5 ${item.full ? 'md:col-span-2' : ''}`}>
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-white font-semibold text-base">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info del sistema */}
      <div className="glass-panel p-6 rounded-xl">
        <h4 className="font-bold text-white text-base flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-agent-success"/> Información del Sistema</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Versión del Sistema', value: 'CONVEN v1.2.0' },
            { label: 'Motor Contable', value: 'Bimonetario LPH' },
            { label: 'Base de Datos', value: 'PostgreSQL (Activa)' },
          ].map((item, i) => (
            <div key={i} className="bg-black/20 rounded-lg p-4 border border-white/5 text-center">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-agent-success font-bold text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cambiar Contraseña (Para todos los usuarios) */}
        <div className="glass-panel p-6 rounded-xl">
          <h4 className="font-bold text-white text-base flex items-center gap-2 mb-4"><Key className="w-5 h-5 text-agent-cyan"/> Cambiar Contraseña</h4>
          {pwdMsg && <div className="mb-4 text-agent-success text-sm font-bold bg-agent-success/10 p-2 rounded">{pwdMsg}</div>}
          <form onSubmit={handleChangePwd} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Contraseña Actual</label>
              <input type="password" required value={pwdForm.actual} onChange={e => setPwdForm({...pwdForm, actual: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded text-sm focus:border-agent-cyan focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Nueva Contraseña</label>
              <input type="password" required minLength={6} value={pwdForm.nueva} onChange={e => setPwdForm({...pwdForm, nueva: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded text-sm focus:border-agent-cyan focus:outline-none" />
            </div>
            <button type="submit" className="w-full py-2.5 bg-agent-cyan/10 border border-agent-cyan/30 text-agent-cyan rounded font-bold hover:bg-agent-cyan hover:text-black transition-colors">
              Actualizar Contraseña
            </button>
          </form>
        </div>

        {/* Gestión de Usuarios (Solo SUPERADMIN) */}
        {currentUser?.rol === 'SUPERADMIN' && (
          <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-white text-base flex items-center gap-2"><UserCheck className="w-5 h-5 text-agent-accent"/> Gestión de Accesos</h4>
              <button onClick={() => setShowUserForm(!showUserForm)} className="text-agent-accent hover:text-white bg-agent-accent/10 px-3 py-1.5 rounded text-sm flex items-center gap-2 border border-agent-accent/30"><UserPlus className="w-4 h-4"/> Nuevo</button>
            </div>

            {showUserForm && (
              <form onSubmit={handleCreateUser} className="mb-6 bg-black/30 p-4 rounded-lg border border-white/5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Usuario</label>
                    <input required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2 text-sm rounded focus:border-agent-cyan focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Rol</label>
                    <select value={userForm.rol} onChange={e => setUserForm({...userForm, rol: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2 text-sm rounded focus:border-agent-cyan focus:outline-none">
                      <option value="CONDOMINIO">Condominio</option>
                      <option value="SUPERADMIN">Super Admin</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Email</label>
                    <input type="email" required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2 text-sm rounded focus:border-agent-cyan focus:outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-400 block mb-1">Contraseña Inicial</label>
                    <input type="password" required minLength={6} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2 text-sm rounded focus:border-agent-cyan focus:outline-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowUserForm(false)} className="text-slate-400 text-sm hover:text-white">Cancelar</button>
                  <button type="submit" className="bg-agent-accent text-white px-4 py-1.5 rounded text-sm font-bold hover:brightness-110">Crear</button>
                </div>
              </form>
            )}

            <div className="space-y-2 overflow-y-auto max-h-[300px] custom-scrollbar flex-1">
              {usuarios.map(u => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border ${u.activo ? 'border-white/10 bg-black/20' : 'border-red-500/20 bg-red-500/5'} transition-colors`}>
                  <div>
                    <p className="text-white font-bold text-sm flex items-center gap-2">
                      {u.username} 
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.rol === 'SUPERADMIN' ? 'bg-agent-accent/20 text-agent-accent' : 'bg-agent-cyan/20 text-agent-cyan'}`}>{u.rol}</span>
                      {!u.activo && <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">INACTIVO</span>}
                    </p>
                    <p className="text-slate-400 text-xs">{u.email}</p>
                  </div>
                  <button 
                    onClick={() => handleToggleUser(u.id, u.activo)} 
                    disabled={u.username === 'admin'}
                    className={`px-3 py-1 rounded text-xs font-bold border disabled:opacity-30 ${u.activo ? 'border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white' : 'border-agent-success/30 text-agent-success hover:bg-agent-success hover:text-white'}`}>
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MÓDULO ARQUITECTÓNICO Y MOTOR DE ALÍCUOTAS / PARTES IGUALES ──────────
function ArquitecturaPanel({ activeCondominio }: { activeCondominio: string }) {
  const [loading, setLoading] = useState(false);
  const [modoCobro, setModoCobro] = useState<'ALICUOTAS' | 'PARTES_IGUALES' | 'TARIFA_M2' | 'CUOTA_FIJA'>('ALICUOTAS');
  const [condoData, setCondoData] = useState<any>(null);
  const [propiedades, setPropiedades] = useState<any[]>([]);
  const [showGenerador, setShowGenerador] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  
  // Modal de Fusión
  const [showFusionModal, setShowFusionModal] = useState(false);
  const [fusionData, setFusionData] = useState({ idA: '', idB: '', nuevoNumero: '' });

  // Generador masivo state
  const [genData, setGenData] = useState({
    nombresTorres: 'Torre A, Torre B',
    numPisos: 6,
    aptosPorPiso: 4,
    m2Apto: 75,
    precioM2Apto: 2.0,
    cuotaFijaApto: 0,
    tienePB: true,
    numLocalesPB: 2,
    m2LocalPB: 120,
    precioM2LocalPB: 5.0,
    cuotaFijaLocalPB: 0,
    tieneMezzanina: false,
    numLocalesMez: 2,
    m2Mez: 60,
    precioM2Mez: 3.0,
    cuotaFijaMez: 0,
    modoAsimetrico: false,
    configPorPiso: [] as { piso: number; cant: number; m2: number; precioM2: number; cuotaFija: number }[],
    borrarExisten: false
  });

  // Manual Add state
  const [nuevaUnidad, setNuevaUnidad] = useState({
    numero: '',
    tipo: 'APARTAMENTO',
    torre: 'Torre A',
    piso: '1',
    m2: 70,
    precioM2: 2.0,
    cuotaFija: 0,
    alicuota: 0
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const resConfig = await apiFetch('/api/config');
      if (resConfig.ok) {
        const cData = await resConfig.json();
        setCondoData(cData);
        setModoCobro(cData.modoCobro || 'ALICUOTAS');
      }
      const resProps = await apiFetch('/api/propiedades');
      if (resProps.ok) {
        const pData = await resProps.json();
        setPropiedades(pData || []);
      }
    } catch (e) {
      console.error('Error al cargar datos arquitectónicos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCondominio]);

  const handleSaveModoCobro = async (nuevoModo: 'ALICUOTAS' | 'PARTES_IGUALES' | 'TARIFA_M2' | 'CUOTA_FIJA') => {
    if (!condoData?.id) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/config/${condoData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...condoData, modoCobro: nuevoModo })
      });
      if (res.ok) {
        setModoCobro(nuevoModo);
        alert(`¡Configuración actualizada! Ahora el sistema calculará la facturación mensual por: ${nuevoModo === 'ALICUOTAS' ? 'Alícuotas Proporcionales (%)' : 'División Equitativa en Partes Iguales'}.`);
      } else {
        alert('Error al guardar configuración.');
      }
    } catch (e) {
      alert('Error de conexión al cambiar método de cobro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarEstructura = async (e: React.FormEvent) => {
    e.preventDefault();
    if (genData.borrarExisten && !confirm('⚠️ ¿Estás completamente seguro de borrar las propiedades actuales para reconstruir el edificio desde cero? Solo funcionará si las actuales no tienen recibos pagados.')) {
      return;
    }
    try {
      setLoading(true);
      const torresArray = genData.nombresTorres.split(',').map(s => s.trim()).filter(Boolean);
      const res = await apiFetch('/api/propiedades/generar-estructura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          torres: torresArray.length ? torresArray : ['Torre Única'],
          numPisos: Number(genData.numPisos),
          aptosPorPiso: Number(genData.aptosPorPiso),
          m2Apto: Number(genData.m2Apto),
          precioM2Apto: Number(genData.precioM2Apto),
          cuotaFijaApto: Number(genData.cuotaFijaApto),
          tienePB: Boolean(genData.tienePB),
          numLocalesPB: Number(genData.numLocalesPB),
          m2LocalPB: Number(genData.m2LocalPB),
          precioM2LocalPB: Number(genData.precioM2LocalPB),
          cuotaFijaLocalPB: Number(genData.cuotaFijaLocalPB),
          tieneMezzanina: Boolean(genData.tieneMezzanina),
          numLocalesMez: Number(genData.numLocalesMez),
          m2Mez: Number(genData.m2Mez),
          precioM2Mez: Number(genData.precioM2Mez),
          cuotaFijaMez: Number(genData.cuotaFijaMez),
          configPorPiso: genData.modoAsimetrico ? genData.configPorPiso : undefined,
          borrarExistant: genData.borrarExisten
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.mensaje);
        setShowGenerador(false);
        fetchData();
      } else {
        alert('Error al crear estructura: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error de comunicación al generar estructura.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalcularAlicuotas = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/propiedades/recalcular-alicuotas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`¡Cálculo matemático exitoso!\nTotal del inmueble: ${data.totalM2} m².\nLas alícuotas de todas las unidades han sido ajustadas proporcionalmente para sumar exactamente 100.00%.`);
        setPropiedades(data.propiedades || []);
      } else {
        alert('Error: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error al recalcular las alícuotas en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUnidadManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaUnidad.numero.trim()) return alert('El número de identificación del inmueble es requerido.');
    try {
      setLoading(true);
      const res = await apiFetch('/api/propiedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaUnidad)
      });
      if (res.ok) {
        setShowManualAdd(false);
        setNuevaUnidad({ numero: '', tipo: 'APARTAMENTO', torre: 'Torre A', piso: '1', m2: 70, precioM2: 2.0, cuotaFija: 0, alicuota: 0 });
        fetchData();
      } else {
        alert('Error al guardar la nueva unidad.');
      }
    } catch (e) {
      alert('Error conectando con la API.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ numero: p.numero, tipo: p.tipo, torre: p.torre || '', piso: p.piso || '', m2: p.m2 || 0, precioM2: p.precioM2 || 0, cuotaFija: p.cuotaFija || 0, alicuota: p.alicuota || 0 });
  };

  const handleUpdateUnidad = async (id: string) => {
    try {
      const res = await apiFetch(`/api/propiedades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        fetchData();
      } else {
        alert('Error al modificar datos de la unidad.');
      }
    } catch (e) {
      alert('Error al conectar con la base de datos.');
    }
  };

  const handleDeleteUnidad = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad? (No se podrá eliminar si tiene cobros o avisos registrados)')) return;
    try {
      const res = await apiFetch(`/api/propiedades/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (e) {
      alert('Error al intentar eliminar unidad.');
    }
  };

  const handleFusionar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fusionData.idA || !fusionData.idB) return alert('Debes seleccionar dos inmuebles para fusionar.');
    if (fusionData.idA === fusionData.idB) return alert('No puedes fusionar un inmueble consigo mismo.');
    if (!confirm('⚠️ ¿Estás seguro de fusionar estos inmuebles? Se sumarán sus metros cuadrados y alícuotas. Esta acción es irreversible.')) return;
    
    try {
      setLoading(true);
      const res = await apiFetch('/api/propiedades/fusionar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fusionData)
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Fusión exitosa.');
        setShowFusionModal(false);
        setFusionData({ idA: '', idB: '', nuevoNumero: '' });
        fetchData();
      } else {
        alert('Error: ' + (data.error || 'Desconocido'));
      }
    } catch (e) {
      alert('Error al conectar con la API para fusionar.');
    } finally {
      setLoading(false);
    }
  };

  const totalM2 = propiedades.reduce((sum, p) => sum + (Number(p.m2) || 0), 0);
  const totalAlicuotas = propiedades.reduce((sum, p) => sum + (Number(p.alicuota) || 0), 0);
  const alicuotasOk = Math.abs(totalAlicuotas - 100) <= 0.05;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Cabecera Principal */}
      <div className="flex justify-between items-end bg-gradient-to-r from-agent-dark to-slate-900/80 p-6 rounded-2xl border border-agent-cyan/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div>
          <span className="text-xs font-black tracking-widest text-agent-cyan uppercase px-2 py-1 bg-agent-cyan/10 rounded border border-agent-cyan/20">
            Módulo Comercial & Inversiones
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-agent-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" /> 
            Configurador de Arquitectura y Motor Financiero
          </h2>
          <p className="text-slate-300 font-medium text-base mt-1 max-w-3xl">
            Diseñe la estructura física del edificio (Torres, Locales Comerciales en PB, Mezzanina, Apartamentos) y programe el método oficial de división de gastos comunes.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerador(!showGenerador)}
            className="px-4 py-2 bg-gradient-to-r from-agent-cyan to-blue-600 text-white font-bold rounded-lg hover:shadow-[0_0_15px_rgba(6,182,212,0.6)] transition-all flex items-center gap-2 text-sm shadow-md"
          >
            <Wrench className="w-4 h-4" /> {showGenerador ? 'Cerrar Constructor' : '⚡ Constructor de Edificio'}
          </button>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="px-4 py-2 bg-slate-800/80 border border-slate-600 text-slate-200 font-semibold rounded-lg hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Unidad Manual
          </button>
        </div>
      </div>

      {/* Selector de Método de Cobro Oficial */}
      <div className="glass-panel p-6 rounded-2xl border border-agent-border space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-agent-accent" /> Método Oficial de División de Gastos Comunes
        </h3>
        <p className="text-sm text-slate-300">
          Seleccione cómo calculará el motor del sistema los Avisos de Cobro mensuales para los propietarios y comercios:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
          {/* Tarjeta Alícuotas */}
          <div 
            onClick={() => handleSaveModoCobro('ALICUOTAS')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
              modoCobro === 'ALICUOTAS' 
                ? 'border-agent-cyan bg-agent-cyan/10 shadow-[0_0_25px_rgba(6,182,212,0.25)]' 
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 opacity-75'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-agent-cyan/20 text-agent-cyan text-xs font-extrabold rounded-full">
                  PROPORCIONAL
                </span>
                {modoCobro === 'ALICUOTAS' && <CheckCircle2 className="w-6 h-6 text-agent-cyan drop-shadow" />}
              </div>
              <h4 className="text-xl font-bold text-white">Por Alícuotas (%)</h4>
              <p className="text-slate-300 text-xs mt-2 font-normal leading-relaxed">
                Cada inmueble abona en proporción a su porcentaje del área total.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-agent-cyan font-semibold flex items-center gap-2">
              <span>Gasto × (Alícuota % / 100)</span>
            </div>
          </div>

          {/* Tarjeta Partes Iguales */}
          <div 
            onClick={() => handleSaveModoCobro('PARTES_IGUALES')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
              modoCobro === 'PARTES_IGUALES' 
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_25px_rgba(16,185,129,0.25)]' 
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 opacity-75'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-extrabold rounded-full">
                  EQUITATIVO
                </span>
                {modoCobro === 'PARTES_IGUALES' && <CheckCircle2 className="w-6 h-6 text-emerald-400 drop-shadow" />}
              </div>
              <h4 className="text-xl font-bold text-white">Partes Iguales</h4>
              <p className="text-slate-300 text-xs mt-2 font-normal leading-relaxed">
                El gasto mensual se divide por igual entre todas las unidades.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-emerald-400 font-semibold flex items-center gap-2">
              <span>Gasto ÷ Total Unidades</span>
            </div>
          </div>
          
          {/* Tarjeta Tarifa M2 */}
          <div 
            onClick={() => handleSaveModoCobro('TARIFA_M2')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
              modoCobro === 'TARIFA_M2' 
                ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_25px_rgba(168,85,247,0.25)]' 
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 opacity-75'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-extrabold rounded-full">
                  COMERCIAL / MALLS
                </span>
                {modoCobro === 'TARIFA_M2' && <CheckCircle2 className="w-6 h-6 text-purple-400 drop-shadow" />}
              </div>
              <h4 className="text-xl font-bold text-white">Precio por m²</h4>
              <p className="text-slate-300 text-xs mt-2 font-normal leading-relaxed">
                La unidad abona una cuota basada en un precio comercial por metro cuadrado.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-purple-400 font-semibold flex items-center gap-2">
              <span>Metros m² × Precio/m²</span>
            </div>
          </div>
          
          {/* Tarjeta Cuota Fija */}
          <div 
            onClick={() => handleSaveModoCobro('CUOTA_FIJA')}
            className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
              modoCobro === 'CUOTA_FIJA' 
                ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_25px_rgba(236,72,153,0.25)]' 
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 opacity-75'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 bg-pink-500/20 text-pink-400 text-xs font-extrabold rounded-full">
                  TARIFA PERSONALIZADA
                </span>
                {modoCobro === 'CUOTA_FIJA' && <CheckCircle2 className="w-6 h-6 text-pink-400 drop-shadow" />}
              </div>
              <h4 className="text-xl font-bold text-white">Cuota Fija</h4>
              <p className="text-slate-300 text-xs mt-2 font-normal leading-relaxed">
                La unidad abona exclusivamente una tarifa fija independiente establecida en contrato.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-700/50 text-xs text-pink-400 font-semibold flex items-center gap-2">
              <span>Tarifa Fija Individual</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Formulario del Constructor Automatizado */}
      {showGenerador && (
        <form onSubmit={handleGenerarEstructura} className="glass-panel p-6 rounded-2xl border-2 border-agent-cyan/60 space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-agent-dark">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Wrench className="w-6 h-6 text-agent-cyan" /> Constructor Automatizado del Edificio / Torres
              </h3>
              <p className="text-xs text-slate-300 mt-1">Configure la distribución física y nuestro algoritmo creará las unidades y calculará las alícuotas automáticamente al instante.</p>
            </div>
            <button type="button" onClick={() => setShowGenerador(false)} className="text-slate-400 hover:text-white font-bold px-2 py-1 bg-slate-800 rounded">X</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-3 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
              <label className="text-sm font-bold text-agent-cyan uppercase tracking-wider">🏢 Torres o Edificios del Condominio (Separados por coma)</label>
              <input 
                type="text" 
                value={genData.nombresTorres} 
                onChange={e => setGenData({ ...genData, nombresTorres: e.target.value })}
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white font-semibold focus:border-agent-cyan" 
                placeholder="Ej: Torre A, Torre B, Torre C (Dejar 'Torre Única' si es un solo edificio)"
              />
              <p className="text-xs text-slate-400">Si escribe 2 torres (Ej: Torre A, Torre B), la configuración inferior se multiplicará en cada torre.</p>
            </div>

            <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-amber-400 text-sm uppercase flex items-center gap-2">🛒 Locales Comerciales (Planta Baja)</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-200">
                <input type="checkbox" checked={genData.tienePB} onChange={e => setGenData({ ...genData, tienePB: e.target.checked })} className="w-4 h-4 text-agent-cyan rounded" />
                El edificio dispone de Locales en PB
              </label>
              {genData.tienePB && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Cant. Locales por Torre</label>
                    <input type="number" min="1" value={genData.numLocalesPB} onChange={e => setGenData({ ...genData, numLocalesPB: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">m² Promedio</label>
                    <input type="number" step="0.1" value={genData.m2LocalPB} onChange={e => setGenData({ ...genData, m2LocalPB: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Precio m² ($)</label>
                    <input type="number" step="0.1" value={genData.precioM2LocalPB} onChange={e => setGenData({ ...genData, precioM2LocalPB: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-agent-accent font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Cuota Fija ($)</label>
                    <input type="number" step="0.1" value={genData.cuotaFijaLocalPB} onChange={e => setGenData({ ...genData, cuotaFijaLocalPB: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-agent-success font-bold mt-1" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-slate-700">
              <h4 className="font-bold text-purple-400 text-sm uppercase flex items-center gap-2">🛋️ Nivel Mezzanina / Oficinas</h4>
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-200">
                <input type="checkbox" checked={genData.tieneMezzanina} onChange={e => setGenData({ ...genData, tieneMezzanina: e.target.checked })} className="w-4 h-4 text-purple-400 rounded" />
                Dispone de Nivel Mezzanina
              </label>
              {genData.tieneMezzanina && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Cant. Oficinas</label>
                    <input type="number" min="1" value={genData.numLocalesMez} onChange={e => setGenData({ ...genData, numLocalesMez: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">m² Promedio</label>
                    <input type="number" step="0.1" value={genData.m2Mez} onChange={e => setGenData({ ...genData, m2Mez: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Precio m² ($)</label>
                    <input type="number" step="0.1" value={genData.precioM2Mez} onChange={e => setGenData({ ...genData, precioM2Mez: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-agent-accent font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Cuota Fija ($)</label>
                    <input type="number" step="0.1" value={genData.cuotaFijaMez} onChange={e => setGenData({ ...genData, cuotaFijaMez: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-agent-success font-bold mt-1" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h4 className="font-bold text-blue-400 text-sm uppercase flex items-center gap-2">🏢 Pisos Residenciales</h4>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-pink-400 bg-pink-500/10 px-2 py-1 rounded border border-pink-500/30">
                  <input type="checkbox" checked={genData.modoAsimetrico} onChange={e => {
                    const asim = e.target.checked;
                    setGenData({ 
                      ...genData, 
                      modoAsimetrico: asim,
                      configPorPiso: asim ? Array.from({length: genData.numPisos}, (_, i) => ({ piso: i+1, cant: genData.aptosPorPiso, m2: genData.m2Apto, precioM2: genData.precioM2Apto, cuotaFija: genData.cuotaFijaApto })) : []
                    });
                  }} className="w-3 h-3 text-pink-400 rounded" />
                  📐 Modo Asimétrico (Pisos Variados)
                </label>
              </div>

              {!genData.modoAsimetrico ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Cant. Pisos</label>
                    <input type="number" min="1" max="60" value={genData.numPisos} onChange={e => setGenData({ ...genData, numPisos: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Aptos / Piso</label>
                    <input type="number" min="1" max="20" value={genData.aptosPorPiso} onChange={e => setGenData({ ...genData, aptosPorPiso: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">m² Promedio</label>
                    <input type="number" step="0.1" value={genData.m2Apto} onChange={e => setGenData({ ...genData, m2Apto: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold">Precio m² ($)</label>
                    <input type="number" step="0.1" value={genData.precioM2Apto} onChange={e => setGenData({ ...genData, precioM2Apto: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-agent-accent font-bold mt-1" />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setGenData({...genData, numPisos: genData.numPisos+1, configPorPiso: [...genData.configPorPiso, { piso: genData.numPisos+1, cant: 1, m2: 100, precioM2: 2.0, cuotaFija: 0 }]})} className="px-3 py-1 bg-slate-700 text-xs text-white rounded hover:bg-slate-600">+ Añadir Piso</button>
                    <button type="button" onClick={() => { const cfg = [...genData.configPorPiso]; cfg.pop(); setGenData({...genData, numPisos: Math.max(1, genData.numPisos-1), configPorPiso: cfg}); }} className="px-3 py-1 bg-red-900/40 text-xs text-red-300 rounded hover:bg-red-900">- Quitar Piso</button>
                  </div>
                  {genData.configPorPiso.map((cfg, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-slate-800/80 p-2 rounded border border-slate-700/50">
                      <span className="text-xs font-bold text-agent-cyan w-16">Piso {cfg.piso}</span>
                      <input type="number" title="Aptos" value={cfg.cant} onChange={e => { const newCfg = [...genData.configPorPiso]; newCfg[idx].cant = Number(e.target.value); setGenData({...genData, configPorPiso: newCfg}); }} className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs text-center" /> <span className="text-xs text-slate-400">apt</span>
                      <input type="number" title="m²" value={cfg.m2} onChange={e => { const newCfg = [...genData.configPorPiso]; newCfg[idx].m2 = Number(e.target.value); setGenData({...genData, configPorPiso: newCfg}); }} className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs text-center" /> <span className="text-xs text-slate-400">m²</span>
                      <input type="number" title="Precio m² ($)" value={cfg.precioM2} onChange={e => { const newCfg = [...genData.configPorPiso]; newCfg[idx].precioM2 = Number(e.target.value); setGenData({...genData, configPorPiso: newCfg}); }} className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-agent-accent text-xs text-center" /> <span className="text-xs text-slate-400">$/m²</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-red-200 font-bold">
              <input type="checkbox" checked={genData.borrarExisten} onChange={e => setGenData({ ...genData, borrarExisten: e.target.checked })} className="w-4 h-4 text-red-500 rounded" />
              ⚠️ Reiniciar / Borrar unidades existentes antes de generar esta nueva estructura arquitectónica
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" onClick={() => setShowGenerador(false)} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-lg hover:bg-slate-700">Cancelar</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-agent-cyan to-blue-600 text-white font-black rounded-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.7)] transition-all">
              {loading ? 'GENERANDO ESTRUCTURA...' : '⚡ GENERAR ESTRUCTURA Y CALCULAR ALÍCUOTAS M²'}
            </button>
          </div>
        </form>
      )}

      {/* Formulario de Agregar Unidad Manual */}
      {showManualAdd && (
        <form onSubmit={handleAddUnidadManual} className="glass-panel p-6 rounded-2xl border border-emerald-500/50 space-y-4 animate-in fade-in duration-300 bg-slate-900/90">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" /> Agregar Unidad / Inmueble Manualmente
            </h3>
            <button type="button" onClick={() => setShowManualAdd(false)} className="text-slate-400 hover:text-white font-bold">X</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400">Identificación / Número</label>
              <input type="text" value={nuevaUnidad.numero} onChange={e => setNuevaUnidad({ ...nuevaUnidad, numero: e.target.value })} placeholder="Ej: Apto 101 / Local PB-3" className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" required />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Tipo de Unidad</label>
              <select value={nuevaUnidad.tipo} onChange={e => setNuevaUnidad({ ...nuevaUnidad, tipo: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1">
                <option value="APARTAMENTO">Apartamento</option>
                <option value="LOCAL">Local Comercial</option>
                <option value="MEZZANINA">Mezzanina</option>
                <option value="OFICINA">Oficina / Otro</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Torre / Sector</label>
              <input type="text" value={nuevaUnidad.torre} onChange={e => setNuevaUnidad({ ...nuevaUnidad, torre: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Piso / Nivel</label>
              <input type="text" value={nuevaUnidad.piso} onChange={e => setNuevaUnidad({ ...nuevaUnidad, piso: e.target.value })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Metros Cuadrados (m²)</label>
              <input type="number" step="0.01" value={nuevaUnidad.m2} onChange={e => setNuevaUnidad({ ...nuevaUnidad, m2: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400">Alícuota % (Opcional)</label>
              <input type="number" step="0.0001" value={nuevaUnidad.alicuota} onChange={e => setNuevaUnidad({ ...nuevaUnidad, alicuota: Number(e.target.value) })} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowManualAdd(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded">Cancelar</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors">Guardar Inmueble</button>
          </div>
        </form>
      )}

      {/* Catastro e Inventario de Inmuebles */}
      <div className="glass-panel p-6 rounded-2xl border border-agent-border space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/80 pb-5">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Home className="w-6 h-6 text-agent-cyan" /> Catastro Técnico & Tabla de Alícuotas ({propiedades.length} Unidades)
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-600 text-slate-200 font-bold">
                Metraje Total: <strong className="text-agent-cyan font-black text-base">{totalM2.toFixed(2)} m²</strong>
              </span>
              <span className={`px-3 py-1 rounded-lg border font-bold flex items-center gap-2 ${alicuotasOk ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/10 border-amber-500/40 text-amber-400'}`}>
                Suma Alícuotas: <strong className="text-base font-black">{totalAlicuotas.toFixed(4)}%</strong>
                {alicuotasOk ? ' ✓ Correcto (100%)' : ' ⚠️ Debería sumar 100%'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFusionModal(true)}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-xl border border-slate-600 transition-all flex items-center gap-2 text-sm shadow-md"
            >
              🔗 FUSIONAR UNIDADES
            </button>
            <button
              onClick={handleRecalcularAlicuotas}
              disabled={loading || propiedades.length === 0}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              ⚡ RECALCULAR ALÍCUOTAS (100%)
            </button>
          </div>
        </div>

        {/* Modal de Fusión */}
        {showFusionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleFusionar} className="glass-panel p-6 rounded-2xl border-2 border-agent-cyan/60 space-y-6 w-full max-w-lg bg-gradient-to-b from-slate-900 to-agent-dark relative">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  🔗 Fusión de Inmuebles
                </h3>
                <button type="button" onClick={() => setShowFusionModal(false)} className="text-slate-400 hover:text-white font-bold bg-slate-800 px-2 rounded">X</button>
              </div>
              <p className="text-sm text-slate-300">
                Selecciona dos unidades existentes. La <strong>Unidad B</strong> se absorberá en la <strong>Unidad A</strong>, sumando metros cuadrados y alícuotas.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-agent-cyan">Unidad Principal (A) - La que conservará sus datos (Piso, Tipo)</label>
                  <select required value={fusionData.idA} onChange={e => setFusionData({...fusionData, idA: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1">
                    <option value="">Seleccione Inmueble A...</option>
                    {propiedades.map(p => <option key={p.id} value={p.id}>{p.torre ? `${p.torre} - ` : ''}Piso {p.piso} - {p.numero} ({p.tipo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-purple-400">Unidad Secundaria (B) - La que desaparecerá</label>
                  <select required value={fusionData.idB} onChange={e => setFusionData({...fusionData, idB: e.target.value})} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white font-bold mt-1">
                    <option value="">Seleccione Inmueble B...</option>
                    {propiedades.map(p => <option key={p.id} value={p.id}>{p.torre ? `${p.torre} - ` : ''}Piso {p.piso} - {p.numero} ({p.tipo})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400">Nuevo Número / ID (Opcional)</label>
                  <input type="text" placeholder="Ej: Apto 101-102 (Se mantiene el de la Unidad A si está vacío)" value={fusionData.nuevoNumero} onChange={e => setFusionData({...fusionData, nuevoNumero: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button type="button" onClick={() => setShowFusionModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded hover:from-cyan-500 hover:to-blue-500 transition-colors">Confirmar Fusión</button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla Detallada */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-agent-cyan uppercase text-[10px] border-b border-slate-700 tracking-wider">
                <th className="p-3 font-bold">Torre / Piso</th>
                <th className="p-3 font-bold">Inmueble</th>
                <th className="p-3 font-bold">Tipo</th>
                <th className="p-3 font-bold text-right">Tamaño (m²)</th>
                <th className="p-3 font-bold text-right">Alícuota (%)</th>
                <th className="p-3 font-bold text-right">Precio/m²</th>
                <th className="p-3 font-bold text-right">Cuota Fija</th>
                <th className="p-3 font-bold text-right">Proyección</th>
                <th className="p-3 font-bold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-semibold">
              {propiedades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 font-normal">
                    No hay unidades construidas o registradas en este condominio. ¡Utilice el <strong>Constructor de Edificio</strong> arriba para crear la estructura al instante!
                  </td>
                </tr>
              ) : (
                propiedades.map((p) => {
                  const isEditing = editingId === p.id;
                  
                  // Proyección del modo de cobro
                  let proyeccion = 0;
                  if (modoCobro === 'TARIFA_M2') proyeccion = Number(p.m2 || 0) * Number(p.precioM2 || 0);
                  if (modoCobro === 'CUOTA_FIJA') proyeccion = Number(p.cuotaFija || 0);
                  // alicuotas/partes iguales no se calculan aqui sin un gasto

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors text-xs">
                      <td className="p-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <input type="text" value={editForm.torre} onChange={e => setEditForm({ ...editForm, torre: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white" placeholder="Torre" />
                            <input type="text" value={editForm.piso} onChange={e => setEditForm({ ...editForm, piso: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white" placeholder="Piso" />
                          </div>
                        ) : (
                          <span><span className="text-slate-400">{p.torre || 'N/A'}</span><br/>Piso {p.piso || 'N/A'}</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-white text-sm">
                        {isEditing ? (
                          <input type="text" value={editForm.numero} onChange={e => setEditForm({ ...editForm, numero: e.target.value })} className="w-full bg-slate-900 border border-slate-600 rounded p-1 text-white font-bold" />
                        ) : (p.numero)}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <select value={editForm.tipo} onChange={e => setEditForm({ ...editForm, tipo: e.target.value })} className="bg-slate-900 border border-slate-600 rounded p-1 text-white text-xs">
                            <option value="APARTAMENTO">APARTAMENTO</option>
                            <option value="LOCAL">LOCAL</option>
                            <option value="MEZZANINA">MEZZANINA</option>
                            <option value="OFICINA">OFICINA</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                            p.tipo === 'LOCAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            p.tipo === 'MEZZANINA' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            p.tipo === 'OFICINA' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-slate-700 text-slate-200'
                          }`}>
                            {p.tipo || 'APTO'}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right text-agent-cyan font-bold text-sm">
                        {isEditing ? (
                          <input type="number" step="0.01" value={editForm.m2} onChange={e => setEditForm({ ...editForm, m2: Number(e.target.value) })} className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-right text-agent-cyan font-bold" />
                        ) : (`${Number(p.m2 || 0).toFixed(2)} m²`)}
                      </td>
                      <td className="p-3 text-right text-emerald-400 font-bold text-sm">
                        {isEditing ? (
                          <input type="number" step="0.0001" value={editForm.alicuota} onChange={e => setEditForm({ ...editForm, alicuota: Number(e.target.value) })} className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-right text-emerald-400 font-bold" />
                        ) : (`${Number(p.alicuota || 0).toFixed(4)}%`)}
                      </td>
                      <td className="p-3 text-right text-agent-accent font-bold text-sm">
                        {isEditing ? (
                          <input type="number" step="0.01" value={editForm.precioM2} onChange={e => setEditForm({ ...editForm, precioM2: Number(e.target.value) })} className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-right text-agent-accent font-bold" />
                        ) : (`$${Number(p.precioM2 || 0).toFixed(2)}`)}
                      </td>
                      <td className="p-3 text-right text-agent-success font-bold text-sm">
                        {isEditing ? (
                          <input type="number" step="0.01" value={editForm.cuotaFija} onChange={e => setEditForm({ ...editForm, cuotaFija: Number(e.target.value) })} className="w-20 bg-slate-900 border border-slate-600 rounded p-1 text-right text-agent-success font-bold" />
                        ) : (`$${Number(p.cuotaFija || 0).toFixed(2)}`)}
                      </td>
                      <td className="p-3 text-right text-pink-400 font-bold text-sm">
                        {proyeccion > 0 ? `$${proyeccion.toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => handleUpdateUnidad(p.id)} className="px-2 py-1 bg-emerald-600 text-white font-bold text-xs rounded hover:bg-emerald-500">Guardar</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-slate-700 text-slate-300 font-bold text-xs rounded hover:bg-slate-600">Cancelar</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-agent-cyan transition-colors" title="Editar Metraje o Alícuota">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteUnidad(p.id)} className="text-slate-400 hover:text-red-400 transition-colors" title="Eliminar Inmueble">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ApartamentosPanel() {
  const [familias, setFamilias] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nueva, setNueva] = useState({ nombre: '', mascotas: 'Ninguna', condicion: 'PROPIO', menores: 0, adultos: 0, adultosMayores: 0, discapacitados: 0 });
  const [aptFields, setAptFields] = useState({ torreLetra: '', torreNum: '', piso: '', numero: '' });
  const [editingFamilia, setEditingFamilia] = useState<any>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFamilia) return;
    try {
      const res = await apiFetch(`/api/familias/${editingFamilia.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFamilia)
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setEditingFamilia(null);
        fetchDatos();
      } else {
        alert('Error al actualizar: ' + (data.error || 'Desconocido'));
      }
    } catch (e) { alert('Error conectando al servidor'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este apartamento y su familia?')) return;
    try {
      await apiFetch(`/api/familias/${id}`, { method: 'DELETE' });
      fetchDatos();
    } catch (e) { alert('Error al eliminar'); }
  };

  const fetchDatos = async () => {
    try {
      const res = await apiFetch('/api/familias');
      const data = await res.json();
      if (!data.error) {
        const getWeight = (num: string) => {
          if (!num) return 999999;
          const n = String(num).toUpperCase();
          if (n.startsWith('LOCAL')) return 1000 + (parseInt(n.replace(/[^0-9]/g, '')) || 0);
          if (n.includes('CONSER')) return 2000;
          if (n.startsWith('PB')) return 3000 + (parseInt(n.replace(/[^0-9]/g, '')) || 0);
          const parts = n.split('-');
          if (parts.length === 2) return 10000 + (parseInt(parts[0]) * 100) + (parseInt(parts[1]) || 0);
          return 999999;
        };
        data.sort((a: any, b: any) => getWeight(a.apto) - getWeight(b.apto));
        setFamilias(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDatos(); }, []);

  const buildAptCode = (f: typeof aptFields) => {
    const parts: string[] = [];
    if (f.torreLetra) parts.push(`Torre ${f.torreLetra}`);
    else if (f.torreNum) parts.push(`Torre ${f.torreNum}`);
    if (f.piso) parts.push(`P${f.piso}`);
    if (f.numero) parts.push(f.numero.toUpperCase());
    return parts.join('-');
  };
  const letras = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const nums100 = Array.from({ length: 100 }, (_, i) => i + 1);
  const pisos = Array.from({ length: 50 }, (_, i) => i + 1);
  const aptPreview = buildAptCode(aptFields);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptFields.piso || !aptFields.numero.trim()) {
      alert('El Piso/Nivel y el Número de Apartamento son obligatorios.');
      return;
    }
    const propiedadId = buildAptCode(aptFields);
    try {
      const res = await apiFetch('/api/familias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...nueva, propiedadId })
      });
      const data = await res.json();
      if (res.status === 400 && data.error === 'GarabatoDetectado') {
        alert('⚠️ FILTRO ACTIVADO: ' + data.message);
        return;
      }
      setShowForm(false);
      setNueva({ nombre: '', mascotas: 'Ninguna', condicion: 'PROPIO', menores: 0, adultos: 0, adultosMayores: 0, discapacitados: 0 });
      setAptFields({ torreLetra: '', torreNum: '', piso: '', numero: '' });
      fetchDatos();
    } catch (e) { alert('Error conectando al servidor'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Home className="w-6 h-6 text-agent-cyan" /> Gestión de Apartamentos
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Gestión de unidades y propietarios</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-agent-accent/10 border border-agent-accent/50 text-agent-accent hover:bg-agent-accent hover:text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Registrar Apartamento
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel !border-agent-cyan/30 p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col gap-5 font-sans font-semibold tracking-wide">
          <h4 className="font-bold text-agent-cyan border-b border-agent-border pb-2 text-base">NUEVO APARTAMENTO</h4>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Torre <span className="text-slate-500">(Opcional — seleccione solo uno)</span></p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-base text-slate-200 block mb-1">Torre Letra (A–Z)</label>
                <select value={aptFields.torreLetra} onChange={e => setAptFields({...aptFields, torreLetra: e.target.value, torreNum: e.target.value ? '' : aptFields.torreNum})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                  <option value="">-- Sin Torre Letra --</option>
                  {letras.map(l => <option key={l} value={l}>Torre {l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-base text-slate-200 block mb-1">Torre Número (1–100)</label>
                <select value={aptFields.torreNum} onChange={e => setAptFields({...aptFields, torreNum: e.target.value, torreLetra: e.target.value ? '' : aptFields.torreLetra})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                  <option value="">-- Sin Torre Número --</option>
                  {nums100.map(n => <option key={n} value={String(n)}>Torre {n}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs text-red-400 uppercase tracking-widest mb-2">Ubicación * Obligatorio</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-base text-slate-200 block mb-1">Piso / Nivel <span className="text-red-400">*</span></label>
                <select required value={aptFields.piso} onChange={e => setAptFields({...aptFields, piso: e.target.value})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                  <option value="">-- Seleccionar Piso --</option>
                  {pisos.map(p => <option key={p} value={String(p)}>Piso {p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-base text-slate-200 block mb-1">Número / Letra Apto <span className="text-red-400">*</span></label>
                <input required type="text" value={aptFields.numero}
                  onChange={e => setAptFields({...aptFields, numero: e.target.value})}
                  placeholder="Ej: 02, 301, 302D, PH"
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors uppercase" />
                <p className="text-xs text-slate-400 mt-1">Puede incluir letras: 302D, A, PH1</p>
              </div>
            </div>
          </div>
          {aptPreview && (
            <div className="bg-black/40 border border-agent-cyan/30 rounded-lg p-3 flex items-center gap-3">
              <span className="text-slate-400 text-sm">Identificador:</span>
              <span className="text-agent-cyan font-bold text-lg tracking-wider">{aptPreview}</span>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Propietario / Familia (Opcional)</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <label className="text-base text-slate-200 block mb-1">Nombre</label>
                <input type="text" value={nueva.nombre} onChange={e => setNueva({...nueva, nombre: e.target.value})}
                  placeholder="Ej. Familia Pérez"
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
              </div>
              <div>
                <label className="text-base text-slate-200 block mb-1">Mascotas</label>
                <select value={nueva.mascotas} onChange={e => setNueva({...nueva, mascotas: e.target.value})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                  <option value="Ninguna">Ninguna</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Perro y Gato">Perro y Gato</option>
                  <option value="Otras">Otras</option>
                </select>
              </div>
              <div>
                <label className="text-base text-slate-200 block mb-1">Condición</label>
                <select value={nueva.condicion} onChange={e => setNueva({...nueva, condicion: e.target.value})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                  <option value="PROPIO">PROPIO</option>
                  <option value="ALQUILADO">ALQUILADO</option>
                </select>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Distribución de Miembros</p>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-slate-200 block mb-1">Menores</label>
                <input type="number" min="0" value={nueva.menores} onChange={e => setNueva({...nueva, menores: parseInt(e.target.value) || 0})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
              </div>
              <div>
                <label className="text-sm text-slate-200 block mb-1">Adultos</label>
                <input type="number" min="0" value={nueva.adultos} onChange={e => setNueva({...nueva, adultos: parseInt(e.target.value) || 0})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
              </div>
              <div>
                <label className="text-sm text-slate-200 block mb-1">3ra Edad</label>
                <input type="number" min="0" value={nueva.adultosMayores} onChange={e => setNueva({...nueva, adultosMayores: parseInt(e.target.value) || 0})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
              </div>
              <div>
                <label className="text-sm text-slate-200 block mb-1">Especiales</label>
                <input type="number" min="0" value={nueva.discapacitados} onChange={e => setNueva({...nueva, discapacitados: parseInt(e.target.value) || 0})}
                  className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => { setShowForm(false); setAptFields({ torreLetra: '', torreNum: '', piso: '', numero: '' }); }} className="px-4 py-2 text-slate-200 hover:text-white transition-colors">CANCELAR</button>
            <button type="submit" className="px-5 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]">GUARDAR</button>
          </div>
        </form>
      )}

      {familias.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-slate-200 font-sans font-semibold tracking-wide">No hay familias registradas.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {familias.map((f, i) => (
            editingFamilia?.id === f.id ? (
              <div key={i} className="glass-panel !border-agent-cyan rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)] p-5">
                <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-slate-400 uppercase">Editando</span>
                    <span className="text-sm bg-black/40 text-agent-cyan font-sans font-semibold px-2 py-1 rounded border border-agent-cyan/30">{f.apto}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Nombre Familia</label>
                    <input required value={editingFamilia.nombre} onChange={e => setEditingFamilia({...editingFamilia, nombre: e.target.value})} className="bg-agent-bg border border-agent-cyan text-white p-2 rounded text-sm w-full" placeholder="Nombre Familia" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/2 space-y-1">
                      <label className="text-xs text-slate-400">Mascotas</label>
                      <select value={editingFamilia.mascotas} onChange={e => setEditingFamilia({...editingFamilia, mascotas: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full">
                        <option value="Ninguna">Sin mascotas</option>
                        <option value="Perro">Perro</option>
                        <option value="Gato">Gato</option>
                        <option value="Perro y Gato">Perro y Gato</option>
                        <option value="Otras">Otras</option>
                      </select>
                    </div>
                    <div className="w-1/2 space-y-1">
                      <label className="text-xs text-slate-400">Condición</label>
                      <select value={editingFamilia.condicion} onChange={e => setEditingFamilia({...editingFamilia, condicion: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full">
                        <option value="PROPIO">PROPIO</option>
                        <option value="ALQUILADO">ALQUILADO</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/4 space-y-1">
                      <label className="text-xs text-slate-400">Menores</label>
                      <input type="number" min="0" value={editingFamilia.menores} onChange={e => setEditingFamilia({...editingFamilia, menores: parseInt(e.target.value) || 0})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full" />
                    </div>
                    <div className="w-1/4 space-y-1">
                      <label className="text-xs text-slate-400">Adultos</label>
                      <input type="number" min="0" value={editingFamilia.adultos} onChange={e => setEditingFamilia({...editingFamilia, adultos: parseInt(e.target.value) || 0})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full" />
                    </div>
                    <div className="w-1/4 space-y-1">
                      <label className="text-xs text-slate-400">3ra Edad</label>
                      <input type="number" min="0" value={editingFamilia.adultosMayores} onChange={e => setEditingFamilia({...editingFamilia, adultosMayores: parseInt(e.target.value) || 0})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full" />
                    </div>
                    <div className="w-1/4 space-y-1">
                      <label className="text-xs text-slate-400">Especiales</label>
                      <input type="number" min="0" value={editingFamilia.discapacitados} onChange={e => setEditingFamilia({...editingFamilia, discapacitados: parseInt(e.target.value) || 0})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm w-full" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditingFamilia(null)} className="px-3 py-1.5 text-slate-300 hover:text-white text-sm transition-colors">Cancelar</button>
                    <button type="submit" className="px-3 py-1.5 bg-agent-cyan text-black font-bold rounded text-sm hover:bg-cyan-400 transition-colors">Guardar</button>
                  </div>
                </form>
              </div>
            ) : (
            <div key={i} className="group relative glass-panel rounded-xl shadow-lg p-5 hover:border-agent-cyan/50 transition-colors overflow-hidden">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-agent-panel/90 p-1 rounded backdrop-blur z-10">
                <button onClick={() => setEditingFamilia(f)} className="p-1.5 bg-agent-accent/20 text-agent-accent rounded hover:bg-agent-accent hover:text-white transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={() => handleDelete(f.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500 hover:text-white transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-white text-lg pr-12 truncate">{f.nombre || 'Sin nombre'}</h4>
                <span className="text-base bg-black/40 text-agent-cyan font-sans font-semibold tracking-wide px-2 py-1 rounded border border-agent-cyan/30">{f.apto}</span>
              </div>
              <div className="space-y-2 font-sans font-semibold text-base text-slate-200">
                <div className="flex justify-between">
                  <span>Miembros (Total):</span><span className="text-white font-bold">{(f.menores || 0) + (f.adultos || 0) + (f.adultosMayores || 0) + (f.discapacitados || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mascotas:</span><span className="text-white font-bold">{f.mascotas}</span>
                </div>
                <div className="flex justify-between">
                  <span>Condición:</span><span className="text-white font-bold">{f.condicion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Menores:</span><span className="text-white font-bold">{f.menores}</span>
                </div>
                <div className="flex justify-between">
                  <span>Adultos:</span><span className="text-white font-bold">{f.adultos}</span>
                </div>
                <div className="flex justify-between">
                  <span>3ra Edad:</span><span className="text-white font-bold">{f.adultosMayores}</span>
                </div>
                <div className="flex justify-between">
                  <span>Con Discapacidad:</span><span className="text-white font-bold">{f.discapacitados}</span>
                </div>
              </div>
            </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function InspeccionesPanel() {
  const [inspecciones, setInspecciones] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [nueva, setNueva] = useState({ inspector: '', observaciones: '', nivelGravedad: 'NORMAL', infraestructuraId: '' });
  const [editingInspeccion, setEditingInspeccion] = useState<any>(null);

  const fetchDatos = async () => {
    try {
      const res = await apiFetch('/api/inspecciones');
      const data = await res.json();
      if (!data.error) setInspecciones(data);
    } catch (e) { console.error(e); }
  };

  const handleUpdateInspeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInspeccion) return;
    try {
      await apiFetch(`/api/inspecciones/${editingInspeccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInspeccion)
      });
      setEditingInspeccion(null);
      fetchDatos();
    } catch (e) { alert('Error al actualizar'); }
  };

  const handleDeleteInspeccion = async (id: string) => {
    if (!confirm('¿Eliminar esta inspección?')) return;
    try {
      await apiFetch(`/api/inspecciones/${id}`, { method: 'DELETE' });
      fetchDatos();
    } catch (e) { alert('Error al eliminar'); }
  };

  useEffect(() => { fetchDatos(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/inspecciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nueva)
      });
      const data = await res.json();
      if (res.status === 400 && data.error === 'GarabatoDetectado') {
        alert('⚠️ FILTRO ACTIVADO: ' + data.message);
        return;
      }
      setShowForm(false);
      setNueva({ inspector: '', observaciones: '', nivelGravedad: 'NORMAL', infraestructuraId: '' });
      fetchDatos();
    } catch (e) { alert('Error conectando al servidor'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-agent-cyan" /> Bitácora de Inspecciones
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Registro de condiciones de pisos, ascensores y áreas comunes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-agent-accent/10 border border-agent-accent/50 text-agent-accent hover:bg-agent-accent hover:text-white px-4 py-2.5 rounded-lg font-medium transition-all shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Inspección
        </button>
      </div>
      
      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel !border-agent-cyan/30 p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.1)] flex flex-col gap-4 font-sans font-semibold tracking-wide">
          <h4 className="font-bold text-agent-cyan border-b border-agent-border pb-2 text-base">REGISTRO DE INSPECCION</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-base text-slate-200 block mb-1">INSPECTOR</label>
              <input required type="text" value={nueva.inspector} onChange={e => setNueva({...nueva, inspector: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">ACTIVO / AREA</label>
              <input type="text" value={nueva.infraestructuraId} onChange={e => setNueva({...nueva, infraestructuraId: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" placeholder="Dejar vacío si es general" />
            </div>
            <div>
              <label className="text-base text-slate-200 block mb-1">CONDICION RESULTANTE</label>
              <select value={nueva.nivelGravedad} onChange={e => setNueva({...nueva, nivelGravedad: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors">
                <option value="NORMAL">APROBADO (NORMAL)</option>
                <option value="ALERTA">OBSERVACION (ALERTA)</option>
                <option value="CRITICO">RECHAZADO (CRITICO)</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <label className="text-base text-slate-200 block mb-1">OBSERVACIONES TÉCNICAS</label>
              <input required type="text" value={nueva.observaciones} onChange={e => setNueva({...nueva, observaciones: e.target.value})} className="w-full bg-agent-bg border border-agent-border text-white p-2.5 rounded focus:outline-none focus:border-agent-cyan transition-colors" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-200 hover:text-white transition-colors">CANCELAR</button>
            <button type="submit" className="px-5 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shadow-[0_0_10px_rgba(6,182,212,0.4)]">GUARDAR</button>
          </div>
        </form>
      )}

      <div className="glass-panel rounded-xl shadow-lg">
        <table className="w-full text-left border-collapse font-sans font-semibold text-base">
          <thead>
            <tr className="border-b border-agent-border text-base text-slate-200 uppercase bg-black/40">
              <th className="p-4 font-normal">Fecha</th>
              <th className="p-4 font-normal">Área/Activo</th>
              <th className="p-4 font-normal">Técnico</th>
              <th className="p-4 font-normal">Observaciones</th>
              <th className="p-4 font-normal text-right">Resultado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-agent-border/50">
            {inspecciones.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-200">No hay inspecciones registradas.</td></tr>
            ) : inspecciones.map((insp: any) => (
              editingInspeccion?.id === insp.id ? (
                <tr key={insp.id} className="bg-agent-cyan/5">
                  <td colSpan={5} className="p-3">
                    <form onSubmit={handleUpdateInspeccion} className="flex flex-wrap gap-2 items-end">
                      <input value={editingInspeccion.inspector} onChange={e => setEditingInspeccion({...editingInspeccion, inspector: e.target.value})} className="bg-agent-bg border border-agent-cyan text-white p-2 rounded text-sm w-32" placeholder="Inspector" required />
                      <input value={editingInspeccion.observaciones} onChange={e => setEditingInspeccion({...editingInspeccion, observaciones: e.target.value})} className="bg-agent-bg border border-agent-cyan text-white p-2 rounded text-sm flex-1 min-w-[200px]" placeholder="Observaciones" required />
                      <select value={editingInspeccion.nivelGravedad} onChange={e => setEditingInspeccion({...editingInspeccion, nivelGravedad: e.target.value})} className="bg-agent-bg border border-agent-border text-white p-2 rounded text-sm">
                        <option value="NORMAL">APROBADO</option>
                        <option value="ALERTA">OBSERVACIÓN</option>
                        <option value="CRITICO">RECHAZADO</option>
                      </select>
                      <button type="submit" className="px-3 py-2 bg-agent-cyan text-black font-bold rounded text-sm hover:bg-cyan-400 transition-colors">GUARDAR</button>
                      <button type="button" onClick={() => setEditingInspeccion(null)} className="px-3 py-2 text-slate-300 hover:text-white text-sm transition-colors">CANCELAR</button>
                    </form>
                  </td>
                </tr>
              ) : (
              <tr key={insp.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4 text-slate-200">{new Date(insp.fecha).toLocaleDateString()}</td>
                <td className="p-4 text-white">{insp.infraestructuraId}</td>
                <td className="p-4 text-slate-200">{insp.tecnico || 'N/A'}</td>
                <td className="p-4 text-slate-200 truncate max-w-xs">{insp.observaciones}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingInspeccion({ id: insp.id, inspector: insp.tecnico, observaciones: insp.observaciones, nivelGravedad: insp.resultado === 'APROBADO' ? 'NORMAL' : insp.resultado === 'RECHAZADO' ? 'CRITICO' : 'ALERTA' })} className="px-2 py-1 bg-agent-accent/20 border border-agent-accent/50 text-agent-accent rounded text-xs font-bold hover:bg-agent-accent hover:text-white transition-all">EDITAR</button>
                      <button onClick={() => handleDeleteInspeccion(insp.id)} className="px-2 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded text-xs font-bold hover:bg-red-500 hover:text-white transition-all">ELIMINAR</button>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-bold border ${insp.resultado === 'APROBADO' ? 'text-agent-success border-agent-success/30 bg-agent-success/10' : insp.resultado === 'RECHAZADO' ? 'text-agent-danger border-agent-danger/30 bg-agent-danger/10' : 'text-agent-warning border-agent-warning/30 bg-agent-warning/10'}`}>
                      {insp.resultado}
                    </span>
                  </div>
                </td>
              </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function TesoreriaPanel({ activeCondominio }: { activeCondominio: string }) {
  const [cuentas, setCuentas] = React.useState<any[]>([]);
  const [formCuenta, setFormCuenta] = React.useState({ nombre: '', tipo: 'NACIONAL', saldoUSD: 0, saldoVES: 0 });
  const [formPago, setFormPago] = React.useState({ avisoId: '', montoPagado: 0, moneda: 'USD', referencia: '' });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if(!activeCondominio) return;
    apiFetch(`/api/tesoreria/${activeCondominio}/cuentas`).then(r=>r.json()).then(setCuentas).catch(console.error);
  }, [activeCondominio]);

  const handleAddCuenta = async (e: any) => {
    e.preventDefault();
    await apiFetch(`/api/tesoreria/${activeCondominio}/cuentas`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formCuenta)
    });
    const upd = await apiFetch(`/api/tesoreria/${activeCondominio}/cuentas`).then(r=>r.json());
    setCuentas(upd);
    setFormCuenta({ nombre: '', tipo: 'NACIONAL', saldoUSD: 0, saldoVES: 0 });
  };

  const handlePagarAviso = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await apiFetch(`/api/tesoreria/${activeCondominio}/pagos`, {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(formPago)
    });
    alert("Pago procesado con éxito.");
    setFormPago({ avisoId: '', montoPagado: 0, moneda: 'USD', referencia: '' });
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-agent-cyan"/> Cuentas Bancarias</h3>
          
          <form onSubmit={handleAddCuenta} className="grid grid-cols-2 gap-4 mb-6 bg-black/40 p-4 rounded border border-agent-border">
             <input placeholder="Nombre Banco" className="p-2.5 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-cyan outline-none font-sans font-semibold tracking-wide" value={formCuenta.nombre} onChange={e=>setFormCuenta({...formCuenta, nombre:e.target.value})} required/>
             <select className="p-2.5 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-cyan outline-none font-sans font-semibold tracking-wide" value={formCuenta.tipo} onChange={e=>setFormCuenta({...formCuenta, tipo:e.target.value})}>
               <option>NACIONAL</option><option>INTERNACIONAL</option><option>EFECTIVO</option>
             </select>
             <input placeholder="Saldo USD" type="number" step="0.01" className="p-2.5 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-cyan outline-none font-sans font-semibold tracking-wide" value={formCuenta.saldoUSD} onChange={e=>setFormCuenta({...formCuenta, saldoUSD:Number(e.target.value)})}/>
             <input placeholder="Saldo VES" type="number" step="0.01" className="p-2.5 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-cyan outline-none font-sans font-semibold tracking-wide" value={formCuenta.saldoVES} onChange={e=>setFormCuenta({...formCuenta, saldoVES:Number(e.target.value)})}/>
             <button type="submit" className="col-span-2 bg-agent-cyan/20 text-agent-cyan border border-agent-cyan font-bold p-2.5 rounded hover:bg-agent-cyan hover:text-black transition-colors font-sans font-semibold tracking-wide">AÑADIR CUENTA</button>
          </form>

          <table className="w-full text-left text-base text-slate-200">
            <thead><tr className="border-b border-agent-border font-sans font-semibold tracking-wide text-slate-200"><th className="pb-2">Banco</th><th className="pb-2">Tipo</th><th className="pb-2 text-right">Saldo USD</th><th className="pb-2 text-right">Saldo VES</th></tr></thead>
            <tbody>
              {cuentas.map(c => (
                <tr key={c.id} className="border-b border-agent-border/50 font-sans font-semibold tracking-wide text-slate-200">
                  <td className="py-3">{c.nombre}</td>
                  <td className="py-3">{c.tipo}</td>
                  <td className="py-3 text-right text-agent-success">${c.saldoUSD}</td>
                  <td className="py-3 text-right">Bs {c.saldoVES}</td>
                </tr>
              ))}
              {cuentas.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-slate-400">No hay cuentas registradas.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="glass-panel p-6 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.05)]">
           <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-agent-success"/> Registrar Pago de Residente</h3>
           <p className="text-slate-200 font-sans font-semibold tracking-wide mb-6">Ingresa el ID del aviso de cobro para registrar que un residente ha pagado y sacarlo de la mora.</p>
           
           <form onSubmit={handlePagarAviso} className="flex flex-col gap-4">
             <input placeholder="ID del Aviso (ej. clxt9...)" className="p-3 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-success outline-none font-sans font-semibold tracking-wide" value={formPago.avisoId} onChange={e=>setFormPago({...formPago, avisoId:e.target.value})} required/>
             <div className="flex gap-4">
               <input placeholder="Monto Pagado" type="number" step="0.01" className="p-3 bg-agent-bg rounded text-white flex-1 border border-agent-border focus:border-agent-success outline-none font-sans font-semibold tracking-wide" value={formPago.montoPagado} onChange={e=>setFormPago({...formPago, montoPagado:Number(e.target.value)})} required/>
               <select className="p-3 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-success outline-none font-sans font-semibold tracking-wide" value={formPago.moneda} onChange={e=>setFormPago({...formPago, moneda:e.target.value})}>
                 <option>USD</option><option>VES</option>
               </select>
             </div>
             <input placeholder="Nro de Referencia / Zelle" className="p-3 bg-agent-bg rounded text-white border border-agent-border focus:border-agent-success outline-none font-sans font-semibold tracking-wide" value={formPago.referencia} onChange={e=>setFormPago({...formPago, referencia:e.target.value})} required/>
             
             <button type="submit" disabled={loading} className="mt-4 bg-agent-success/20 text-agent-success border border-agent-success p-3 rounded font-bold hover:bg-agent-success hover:text-black transition-colors font-sans font-semibold tracking-wide">
               {loading ? 'PROCESANDO...' : 'MARCAR COMO PAGADO'}
             </button>
           </form>
        </div>

      </div>
    </div>
  );
}

function CobranzaPanel({ activeCondominio }: { activeCondominio: string }) {
  const [estadoCuentas, setEstadoCuentas] = React.useState<any[]>([]);
  const [selectedProp, setSelectedProp] = React.useState<any>(null);
  const [formPago, setFormPago] = React.useState({ montoPagado: '', moneda: 'USD', referencia: '' });
  const [displayMonto, setDisplayMonto] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [filtro, setFiltro] = React.useState<'todos' | 'aldia' | 'leve' | 'critica'>('todos');

  const fetchEstados = async () => {
    if (!activeCondominio) return;
    try {
      const res = await apiFetch(`/api/tesoreria/${activeCondominio}/estado-cuentas`);
      const data = await res.json();
      setEstadoCuentas(Array.isArray(data) ? data : []);
      if (selectedProp) {
        const upd = data.find((d: any) => d.propiedadId === selectedProp.propiedadId);
        setSelectedProp(upd || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchEstados();
  }, [activeCondominio]);

  const handlePagar = async (e: React.FormEvent, avisoId: string) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/api/tesoreria/${activeCondominio}/pagos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avisoId,
          montoPagado: Number(formPago.montoPagado),
          moneda: formPago.moneda,
          referencia: formPago.referencia
        })
      });
      alert('Pago / Abono registrado exitosamente');
      setFormPago({ montoPagado: '', moneda: 'USD', referencia: '' });
      setDisplayMonto('');
      fetchEstados();
    } catch (e) {
      alert('Error procesando pago');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (meses: number) => {
    if (meses === 0) return 'border-agent-success/50 bg-agent-success/10 text-agent-success';
    if (meses === 1) return 'border-agent-warning/50 bg-agent-warning/10 text-agent-warning';
    return 'border-agent-danger/50 bg-agent-danger/10 text-agent-danger';
  };

  const handleMontoInput = (raw: string) => {
    // Allow digits, comma and dot, strip everything else
    const clean = raw.replace(/[^0-9,.]/g, '');
    setDisplayMonto(clean);
    // Convert display to numeric: remove thousand dots, decimal comma → dot
    const numeric = clean.replace(/\./g, '').replace(',', '.');
    setFormPago(f => ({ ...f, montoPagado: numeric }));
  };

  const handleMontoBlur = () => {
    const num = parseFloat(formPago.montoPagado);
    if (!isNaN(num)) setDisplayMonto(fmtVE(num));
  };

  const cuentasFiltradas = estadoCuentas.filter(ec => {
    if (filtro === 'aldia') return ec.mesesDeuda === 0;
    if (filtro === 'leve') return ec.mesesDeuda === 1;
    if (filtro === 'critica') return ec.mesesDeuda >= 2;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-agent-cyan" /> Control de Deudas y Semáforo
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Estado de cuenta por apartamento y registro de abonos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Apartamentos */}
        <div className="glass-panel p-4 rounded-xl shadow-lg h-[650px] flex flex-col">
          <h4 className="font-bold text-white mb-3 text-base border-b border-agent-border pb-2">SEMÁFORO DE MOROSIDAD</h4>
          {/* Filter buttons */}
          <div className="flex gap-1 mb-3 flex-wrap">
            {[
              { key: 'todos', label: 'Todos', cls: 'border-slate-500/50 bg-slate-500/10 text-slate-300' },
              { key: 'aldia', label: '✅ Al Día', cls: 'border-agent-success/50 bg-agent-success/10 text-agent-success' },
              { key: 'leve', label: '⚠️ Mora Leve', cls: 'border-agent-warning/50 bg-agent-warning/10 text-agent-warning' },
              { key: 'critica', label: '🔴 Mora Crítica', cls: 'border-agent-danger/50 bg-agent-danger/10 text-agent-danger' }
            ].map(btn => (
              <button key={btn.key} onClick={() => setFiltro(btn.key as any)}
                className={`text-xs font-bold px-2 py-1 rounded border transition-all ${btn.cls} ${
                  filtro === btn.key ? 'ring-2 ring-white/30 brightness-125' : 'opacity-60 hover:opacity-100'
                }`}
              >{btn.label} ({estadoCuentas.filter(ec => btn.key === 'todos' ? true : btn.key === 'aldia' ? ec.mesesDeuda === 0 : btn.key === 'leve' ? ec.mesesDeuda === 1 : ec.mesesDeuda >= 2).length})</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {cuentasFiltradas.map((ec, i) => (
              <button 
                key={i} 
                onClick={() => setSelectedProp(ec)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${getStatusColor(ec.mesesDeuda)} ${selectedProp?.propiedadId === ec.propiedadId ? 'ring-2 ring-white/50 brightness-125' : 'hover:brightness-110'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-lg font-sans">{ec.numero}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/40">
                    {ec.mesesDeuda === 0 ? 'AL DÍA' : ec.mesesDeuda === 1 ? 'MORA LEVE' : 'MORA CRÍTICA'}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm opacity-80 truncate max-w-[120px]">{ec.residente}</span>
                  <div className="text-right">
                    <div className="font-bold text-base">$ {fmtVE(ec.totalDeudaUSD)}</div>
                    <div className="text-xs opacity-70">Bs. {fmtVE(ec.totalDeudaVES)}</div>
                  </div>
                </div>
              </button>
            ))}
            {cuentasFiltradas.length === 0 && (
              <p className="text-center text-slate-400 p-4">Sin resultados para este filtro.</p>
            )}
          </div>
        </div>

        {/* Detalles del Apartamento Seleccionado */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedProp ? (
            <div className="glass-panel p-6 rounded-xl shadow-lg flex flex-col h-[600px]">
              <div className="border-b border-agent-border pb-4 mb-4 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-2xl text-white">Apto {selectedProp.numero}</h4>
                  <p className="text-slate-300 text-base">{selectedProp.residente}</p>
                </div>
                <div className={`px-4 py-2 rounded-lg border font-bold text-center ${getStatusColor(selectedProp.mesesDeuda)}`}>
                  <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Deuda Total</div>
                  <div className="text-xl">$ {fmtVE(selectedProp.totalDeudaUSD)}</div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedProp.avisosPendientes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-agent-success opacity-80">
                    <CheckCircle2 className="w-16 h-16 mb-4" />
                    <p className="text-xl font-bold">Inmueble solvente</p>
                    <p className="text-sm mt-2">No hay recibos pendientes de pago.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {selectedProp.avisosPendientes.map((aviso: any, i: number) => (
                      <div key={i} className="bg-black/30 border border-agent-border rounded-lg p-5">
                        <div className="flex justify-between mb-4 pb-2 border-b border-white/5">
                          <div>
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Recibo Mes {aviso.mes}/{aviso.anio}</span>
                            <div className="text-white font-mono mt-1 text-xs">ID: {aviso.id}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-agent-danger font-bold text-lg">Saldo Pendiente: $ {fmtVE(aviso.deudaRestanteUSD)}</div>
                            <div className="text-slate-400 text-sm">Original: $ {fmtVE(aviso.montoUSD)} | Abonado: $ {fmtVE(aviso.abonadoUSD)}</div>
                          </div>
                        </div>

                        <form onSubmit={(e) => handlePagar(e, aviso.id)} className="flex gap-3 items-end bg-agent-bg p-3 rounded border border-agent-border focus-within:border-agent-cyan/50 transition-colors">
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 block mb-1">Monto a Abonar</label>
                            <input 
                              required type="text" inputMode="decimal"
                              value={displayMonto} 
                              onChange={e => handleMontoInput(e.target.value)}
                              onBlur={handleMontoBlur}
                              className="w-full bg-transparent text-white border-b border-agent-border focus:border-agent-cyan outline-none p-1 font-bold" 
                              placeholder="0,00" 
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-slate-400 block mb-1">Moneda</label>
                            <select 
                              value={formPago.moneda} 
                              onChange={e => setFormPago({...formPago, moneda: e.target.value})} 
                              className="w-full bg-transparent text-white border-b border-agent-border focus:border-agent-cyan outline-none p-1 font-bold"
                            >
                              <option>USD</option><option>VES</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs text-slate-400 block mb-1">Nro. Referencia</label>
                            <input 
                              required 
                              value={formPago.referencia} 
                              onChange={e => setFormPago({...formPago, referencia: e.target.value})} 
                              className="w-full bg-transparent text-white border-b border-agent-border focus:border-agent-cyan outline-none p-1" 
                              placeholder="Zelle / Transf." 
                            />
                          </div>
                          <button type="submit" disabled={loading} className="px-4 py-2 bg-agent-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors shrink-0 disabled:opacity-50">
                            REGISTRAR PAGO
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl flex items-center justify-center h-full opacity-50 border-dashed">
              <p className="text-slate-300 font-bold text-lg">Selecciona un inmueble de la lista para gestionar sus cobros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ReportesPanel({ activeCondominio }: { activeCondominio: string }) {
  const [loading, setLoading] = useState(false);

  // 1. Avisos de Cobro (PDF)
  const generarAvisosPDF = async () => {
    if (!activeCondominio) return alert('Seleccione un condominio');
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tesoreria/${activeCondominio}/estado-cuentas`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      const doc = new jsPDF();
      let pageAdded = false;

      data.forEach((prop: any) => {
        if (prop.avisosPendientes && prop.avisosPendientes.length > 0) {
          prop.avisosPendientes.forEach((aviso: any, index: number) => {
            if (pageAdded) doc.addPage();
            pageAdded = true;

            doc.setFontSize(22);
            doc.text('AVISO DE COBRO', 105, 20, { align: 'center' });
            
            doc.setFontSize(12);
            doc.text(`Condominio ID: ${activeCondominio}`, 20, 40);
            doc.text(`Propiedad: ${prop.numero}`, 20, 50);
            doc.text(`Residente: ${prop.residente}`, 20, 60);
            
            doc.text(`Fecha de Emisión: ${new Date(aviso.fechaEmision).toLocaleDateString()}`, 120, 40);
            doc.text(`Vencimiento: ${new Date(aviso.fechaVencimiento).toLocaleDateString()}`, 120, 50);

            autoTable(doc, {
              startY: 80,
              head: [['Concepto', 'Monto USD', 'Monto VES']],
              body: [
                ['Cuota de Condominio', `$${aviso.montoUSD.toFixed(2)}`, `Bs. ${aviso.montoVES.toFixed(2)}`]
              ],
              theme: 'grid',
              headStyles: { fillColor: [41, 128, 185] }
            });

            doc.setFontSize(14);
            const finalY = (doc as any).lastAutoTable.finalY || 100;
            doc.text(`Total a Pagar USD: $${aviso.montoUSD.toFixed(2)}`, 20, finalY + 20);
            doc.text(`Total a Pagar VES: Bs. ${aviso.montoVES.toFixed(2)}`, 20, finalY + 30);
          });
        }
      });

      if (!pageAdded) {
        alert('No hay avisos pendientes para generar.');
      } else {
        doc.save('Avisos_Cobro_Condominio.pdf');
      }
    } catch (e) {
      console.error(e);
      alert('Error al generar el PDF de Avisos');
    }
    setLoading(false);
  };

  // 2. Relación de Ingresos (XLSX)
  const generarRelacionExcel = async () => {
    if (!activeCondominio) return alert('Seleccione un condominio');
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tesoreria/${activeCondominio}/pagos`);
      if (!res.ok) throw new Error('Network error');
      const pagos = await res.json();
      
      if (!pagos || pagos.length === 0) {
        alert('No hay pagos registrados.');
        setLoading(false);
        return;
      }

      const rows = pagos.map((p: any) => ({
        ID_Pago: p.id,
        Fecha: new Date(p.fecha).toLocaleDateString(),
        Monto: p.montoPagado,
        Moneda: p.moneda,
        Referencia: p.referencia,
        Aviso_ID: p.avisoId
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
      XLSX.writeFile(wb, "Relacion_Ingresos.xlsx");
    } catch (e) {
      console.error(e);
      alert('Error al generar Excel');
    }
    setLoading(false);
  };

  // 3. Morosidad (PDF)
  const generarMorosidadPDF = async () => {
    if (!activeCondominio) return alert('Seleccione un condominio');
    setLoading(true);
    try {
      const res = await apiFetch(`/api/tesoreria/${activeCondominio}/estado-cuentas`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      const morosos = data.filter((d: any) => d.mesesDeuda > 1);

      if (morosos.length === 0) {
        alert('No hay apartamentos con morosidad mayor a 1 mes.');
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text('REPORTE DE MOROSIDAD', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Condominio: ${activeCondominio}`, 14, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 40);

      const tableData = morosos.map((m: any) => [
        m.numero,
        m.residente,
        m.mesesDeuda.toString(),
        `$${m.totalDeudaUSD.toFixed(2)}`,
        `Bs. ${m.totalDeudaVES.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 50,
        head: [['Propiedad', 'Residente', 'Meses en Mora', 'Deuda USD', 'Deuda VES']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] }
      });

      doc.save('Reporte_Morosidad.pdf');
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF de Morosidad');
    }
    setLoading(false);
  };

  // 4. Bitácora de Mantenimiento (PDF)
  const generarBitacoraPDF = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/inspecciones`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      if (!data || data.length === 0) {
        alert('No hay inspecciones registradas.');
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.text('BITÁCORA DE MANTENIMIENTO', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Fecha de Reporte: ${new Date().toLocaleDateString()}`, 14, 30);

      const tableData = data.map((i: any) => [
        new Date(i.fecha).toLocaleDateString(),
        i.infraestructuraId,
        i.tecnico,
        i.resultado,
        i.observaciones || ''
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Área/Infraestructura', 'Técnico', 'Resultado', 'Observaciones']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] }
      });

      doc.save('Bitacora_Mantenimiento.pdf');
    } catch (e) {
      console.error(e);
      alert('Error al generar Bitácora de Mantenimiento');
    }
    setLoading(false);
  };

  const reportConfigs = [
    { title: 'Avisos de Cobro', desc: 'PDFs individuales de deudas por apartamento.', action: generarAvisosPDF },
    { title: 'Relación de Ingresos', desc: 'Sábana en Excel de pagos conciliados.', action: generarRelacionExcel },
    { title: 'Morosidad', desc: 'Listado de apartamentos con deuda pendiente (>1 mes).', action: generarMorosidadPDF },
    { title: 'Bitácora de Mantenimiento', desc: 'Registro en PDF de inspecciones técnicas.', action: generarBitacoraPDF },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-agent-cyan" /> Central de Reportes
          </h3>
          <p className="text-slate-200 mt-1 font-sans font-semibold text-base">Generación de documentos PDF y respaldos XLSX</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportConfigs.map((rep, i) => (
          <div key={i} className="glass-panel rounded-xl shadow-lg p-5 flex flex-col justify-between">
            <div>
              <div className="p-3 bg-black/30 rounded-lg inline-block text-agent-cyan border border-agent-cyan/30 mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-lg">{rep.title}</h4>
              <p className="text-base text-slate-200 mt-2 mb-6 font-sans font-semibold tracking-wide">{rep.desc}</p>
            </div>
            <button 
              onClick={rep.action}
              disabled={loading}
              className="w-full bg-agent-accent/10 border border-agent-accent/30 text-agent-accent py-2 rounded text-base font-bold hover:bg-agent-accent hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'GENERANDO...' : 'GENERAR Y DESCARGAR'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

const PREGUNTAS_SEGURIDAD = [
  "¿Cuál es el nombre de tu primera mascota?",
  "¿En qué ciudad nació tu madre?",
  "¿Cuál es el nombre de tu escuela primaria?",
  "¿Cuál fue tu primer vehículo (marca/modelo)?",
  "¿Cómo se llamaba tu mejor amigo de la infancia?",
  "¿Cuál es tu color favorito?",
  "¿Cuál es el nombre de tu abuelo materno?",
  "¿En qué calle vivías cuando eras niño?",
  "¿Cuál es tu comida favorita?",
  "¿Cuál fue tu primer trabajo?"
];

function LoginScreen({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [mode, setMode] = React.useState<'LOGIN' | 'REGISTER' | 'RECOVER_1' | 'RECOVER_2' | 'RECOVER_3'>('LOGIN');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  // Form states
  const [docType, setDocType] = React.useState('V');
  const [docNum, setDocNum] = React.useState('');
  const [nombreRazon, setNombreRazon] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefono, setTelefono] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  
  // Security Questions
  const [q1, setQ1] = React.useState(PREGUNTAS_SEGURIDAD[0]);
  const [a1, setA1] = React.useState('');
  const [q2, setQ2] = React.useState(PREGUNTAS_SEGURIDAD[1]);
  const [a2, setA2] = React.useState('');
  const [q3, setQ3] = React.useState(PREGUNTAS_SEGURIDAD[2]);
  const [a3, setA3] = React.useState('');
  const [recoverQuestions, setRecoverQuestions] = React.useState<string[]>([]);

  const getDoc = () => `${docType}-${docNum}`;

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>, setter: any) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setter(val);
  };

  const validarPassword = (pass: string) => {
    const letras = pass.replace(/[^A-Za-z]/g, '').length;
    const numeros = pass.replace(/[^0-9]/g, '').length;
    return letras === 6 && numeros === 4 && pass.length === 10;
  };

  const [loginType, setLoginType] = React.useState<'CONDOMINIO' | 'ADMIN'>('CONDOMINIO');

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const finalUsername = loginType === 'CONDOMINIO' ? getDoc() : docNum;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: finalUsername, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onLogin(data.token, data.usuario);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    
    if (q1 === q2 || q1 === q3 || q2 === q3) {
      setError('Debes seleccionar 3 preguntas diferentes.');
      return;
    }
    if (!validarPassword(password)) {
      setError('La contraseña debe tener exactamente 6 letras y 4 números (sin símbolos).');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: getDoc(),
          nombreEdificio: nombreRazon,
          email,
          telefono,
          password,
          preguntas: [
            { pregunta: q1, respuesta: a1 },
            { pregunta: q2, respuesta: a2 },
            { pregunta: q3, respuesta: a3 }
          ]
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Registro exitoso. Ya puedes iniciar sesión.');
      setMode('LOGIN');
      setPassword(''); setDocNum('');
    } catch (err: any) {
      setError(err.message || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  const submitRecover1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await apiFetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: getDoc() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecoverQuestions(data.preguntas);
      setMode('RECOVER_2');
      setA1(''); setA2(''); setA3('');
    } catch (err: any) {
      setError(err.message || 'Error obteniendo preguntas');
    } finally {
      setLoading(false);
    }
  };

  const submitRecover2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarPassword(password)) {
      setError('La nueva contraseña debe tener exactamente 6 letras y 4 números.');
      return;
    }
    setError(''); setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: getDoc(),
          respuestas: [a1, a2, a3],
          newPassword: password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Contraseña restablecida correctamente.');
      setMode('LOGIN');
      setPassword(''); setDocNum('');
    } catch (err: any) {
      setError(err.message || 'Error al restablecer');
    } finally {
      setLoading(false);
    }
  };

  const renderDocInput = () => (
    <div className="flex gap-2">
      <select value={docType} onChange={e => setDocType(e.target.value)} className="bg-[#0D1326]/80 border border-agent-border text-white px-3 py-3 rounded-lg focus:border-agent-cyan focus:outline-none">
        <option value="V">V</option>
        <option value="J">J</option>
      </select>
      <div className="relative flex-1">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agent-text" />
        <input required type="text" placeholder="Cédula o RIF (Solo números)" value={docNum} onChange={e => handleNumChange(e, setDocNum)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-10 pr-4 py-3 rounded-lg focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080C17] flex items-center justify-center relative overflow-hidden font-sans py-10">
      <div className="city-bg" />
      
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white/80" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-widest">{mode === 'REGISTER' ? 'REGISTRO' : mode.startsWith('RECOVER') ? 'RECUPERAR' : 'CONVEN'}</h2>
          <p className="text-agent-cyan font-mono text-sm tracking-widest mt-1">OPERATIVE SYSTEM</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden border border-white/5">
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
          {success && <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-4 text-sm text-center">{success}</div>}

          {mode === 'LOGIN' && (
            <form onSubmit={submitLogin} className="space-y-4">
              <div className="flex bg-[#0D1326] p-1 rounded-lg border border-agent-border mb-4">
                <button type="button" onClick={() => { setLoginType('CONDOMINIO'); setDocNum(''); }} className={`flex-1 text-sm py-2 rounded-md transition-colors ${loginType === 'CONDOMINIO' ? 'bg-agent-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Condominio</button>
                <button type="button" onClick={() => { setLoginType('ADMIN'); setDocNum(''); }} className={`flex-1 text-sm py-2 rounded-md transition-colors ${loginType === 'ADMIN' ? 'bg-agent-accent text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Administrador</button>
              </div>

              {loginType === 'CONDOMINIO' ? renderDocInput() : (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agent-text" />
                  <input required type="text" placeholder="Usuario (Ej. admin)" value={docNum} onChange={e => setDocNum(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-10 pr-4 py-3 rounded-lg focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
                </div>
              )}
              
              <div className="relative">
                <input required type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-4 pr-11 py-3 rounded-lg focus:border-agent-cyan focus:outline-none" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><Eye className="w-5 h-5"/></button>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-agent-accent hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Ingresar al Sistema'}
              </button>
              <div className="text-center mt-4 space-y-2 flex flex-col">
                <button type="button" onClick={() => { setMode('REGISTER'); setError(''); setSuccess(''); }} className="text-agent-cyan text-sm hover:underline">¿No tienes cuenta? Regístrate</button>
                <button type="button" onClick={() => { setMode('RECOVER_1'); setError(''); setSuccess(''); }} className="text-slate-400 text-xs hover:text-white">¿Olvidaste tu contraseña?</button>
              </div>
            </form>
          )}

          {mode === 'REGISTER' && (
            <form onSubmit={submitRegister} className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar px-1">
              {renderDocInput()}
              
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agent-text" />
                <input required type="text" placeholder="Nombre o Razón Social" value={nombreRazon} onChange={e => setNombreRazon(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-10 pr-4 py-3 rounded-lg focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agent-text" />
                <input required type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-10 pr-4 py-3 rounded-lg focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
              </div>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agent-text" />
                <input required type="text" placeholder="Teléfono" value={telefono} onChange={e => handleNumChange(e, setTelefono)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-10 pr-4 py-3 rounded-lg focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
              </div>

              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-xs text-agent-cyan mb-2 font-bold uppercase tracking-wider">Preguntas de Seguridad (Elige 3)</p>
                
                {[1,2,3].map(num => (
                  <div key={num} className="mb-3 p-3 bg-black/20 rounded border border-white/5">
                    <select required value={num === 1 ? q1 : num === 2 ? q2 : q3} onChange={e => {
                      if (num === 1) setQ1(e.target.value);
                      if (num === 2) setQ2(e.target.value);
                      if (num === 3) setQ3(e.target.value);
                    }} className="w-full bg-[#0D1326] border border-agent-border text-xs text-white p-2 rounded mb-2 focus:border-agent-cyan focus:outline-none">
                      {PREGUNTAS_SEGURIDAD.map(p => (
                        <option key={p} value={p} disabled={(num !== 1 && q1 === p) || (num !== 2 && q2 === p) || (num !== 3 && q3 === p)}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input required type="text" placeholder="Respuesta..." value={num === 1 ? a1 : num === 2 ? a2 : a3} onChange={e => {
                      if (num === 1) setA1(e.target.value);
                      if (num === 2) setA2(e.target.value);
                      if (num === 3) setA3(e.target.value);
                    }} className="w-full bg-[#0D1326]/80 border border-agent-border text-white px-3 py-2 text-sm rounded focus:border-agent-cyan focus:outline-none placeholder:text-agent-text/60" />
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 mt-4 relative">
                <input required type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-4 pr-11 py-3 rounded-lg focus:border-agent-cyan focus:outline-none" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 mt-2 -translate-y-1/2 text-slate-400 hover:text-white"><Eye className="w-5 h-5"/></button>
                <p className="text-[10px] text-slate-400 mt-2">* Exactamente 6 letras y 4 números (Sin símbolos).</p>
              </div>

              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-agent-cyan hover:bg-agent-accent text-black hover:text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_0_15px_rgba(34,211,238,0.3)] disabled:opacity-50 mt-4">
                {loading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Crear Cuenta'}
              </button>
              
              <div className="text-center mt-4">
                <button type="button" onClick={() => setMode('LOGIN')} className="text-agent-text text-sm hover:text-white">Volver al Login</button>
              </div>
            </form>
          )}

          {mode === 'RECOVER_1' && (
            <form onSubmit={submitRecover1} className="space-y-4">
              <p className="text-sm text-slate-300 text-center mb-4">Ingresa tu número de documento para buscar tus preguntas de seguridad.</p>
              {renderDocInput()}
              <button type="submit" disabled={loading} className="w-full bg-agent-accent hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
                {loading ? 'Buscando...' : 'Continuar'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setMode('LOGIN')} className="text-agent-text text-sm hover:text-white">Volver al Login</button>
              </div>
            </form>
          )}

          {mode === 'RECOVER_2' && (
            <form onSubmit={submitRecover2} className="space-y-4">
              <p className="text-sm text-slate-300 text-center mb-4">Responde correctamente para crear una nueva contraseña.</p>
              
              {[1,2,3].map(num => (
                <div key={num} className="mb-3">
                  <p className="text-xs text-agent-cyan mb-1">{recoverQuestions[num-1]}</p>
                  <input required type="text" placeholder="Respuesta..." value={num === 1 ? a1 : num === 2 ? a2 : a3} onChange={e => {
                    if (num === 1) setA1(e.target.value);
                    if (num === 2) setA2(e.target.value);
                    if (num === 3) setA3(e.target.value);
                  }} className="w-full bg-[#0D1326]/80 border border-agent-border text-white px-3 py-2 text-sm rounded focus:border-agent-cyan focus:outline-none" />
                </div>
              ))}

              <div className="relative mt-4">
                <input required type={showPass ? 'text' : 'password'} placeholder="Nueva Contraseña" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#0D1326]/80 border border-agent-border text-white pl-4 pr-11 py-3 rounded-lg focus:border-agent-cyan focus:outline-none" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"><Eye className="w-5 h-5"/></button>
                <p className="text-[10px] text-slate-400 mt-2">* Exactamente 6 letras y 4 números.</p>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-agent-cyan text-black hover:text-white hover:bg-agent-accent font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50 mt-4">
                {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setMode('LOGIN')} className="text-agent-text text-sm hover:text-white">Cancelar</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;


function FinanzasPanel() {
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [fondo, setFondo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', nombre: '', tipo: 'NACIONAL', saldoUSD: '', saldoVES: '' });
  // display values with thousand separators
  const [displayUSD, setDisplayUSD] = useState('');
  const [displayVES, setDisplayVES] = useState('');

  // Format: user input string → "4.254,25" on blur
  const formatMonto = (raw: string) => {
    // raw is already the clean dot-decimal number stored in form state
    const num = parseFloat(raw);
    if (isNaN(num)) return '';
    return fmtVE(num);
  };

  const handleMontoInput = (raw: string, field: 'saldoUSD' | 'saldoVES', setDisplay: (v: string) => void) => {
    // Allow only digits, dots (thousands) and comma (decimal)
    const onlyAllowed = raw.replace(/[^0-9,.]/g, '');
    setDisplay(onlyAllowed);
    // Convert display format to raw float: remove thousand dots, replace decimal comma with dot
    const numeric = onlyAllowed.replace(/\./g, '').replace(',', '.');
    setForm(f => ({ ...f, [field]: numeric }));
  };

  const [editFondo, setEditFondo] = useState(false);
  const [fondoForm, setFondoForm] = useState({ saldoUSD: '', porcentaje: '' });

  const fetchData = async () => {
    try {
      const resC = await apiFetch('/api/tesoreria/cuentas');
      const resF = await apiFetch('/api/tesoreria/fondo');
      setCuentas(await resC.json());
      const f = await resF.json();
      setFondo(f);
      setFondoForm({ saldoUSD: f?.saldoUSD?.toString() || '0', porcentaje: f?.porcentaje?.toString() || '10' });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveCuenta = async (e: any) => {
    e.preventDefault();
    const url = form.id ? `/api/tesoreria/cuentas/${form.id}` : '/api/tesoreria/cuentas';
    const method = form.id ? 'PUT' : 'POST';
    await apiFetch(url, {
      method,
      body: JSON.stringify(form)
    });
    setShowForm(false);
    setDisplayUSD('');
    setDisplayVES('');
    fetchData();
  };

  const handleDeleteCuenta = async (id: string) => {
    if(!confirm('¿Eliminar cuenta bancaria?')) return;
    await apiFetch(`/api/tesoreria/cuentas/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleSaveFondo = async (e: any) => {
    e.preventDefault();
    await apiFetch('/api/tesoreria/fondo', {
      method: 'POST',
      body: JSON.stringify({ saldoUSD: fondoForm.saldoUSD, porcentaje: fondoForm.porcentaje })
    });
    setEditFondo(false);
    fetchData();
  };

  if (loading) return <div className="text-white p-6">Cargando...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FONDO DE RESERVA */}
        <div className="glass-panel border border-agent-border p-6 rounded-xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-agent-cyan" /> Fondo de Reserva</h3>
            {!editFondo && <button onClick={() => setEditFondo(true)} className="px-3 py-1 bg-agent-accent/10 border border-agent-accent/40 text-agent-accent rounded-lg text-sm hover:bg-agent-accent hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>}
          </div>
          
          {editFondo ? (
            <form onSubmit={handleSaveFondo} className="space-y-4 bg-black/20 p-4 rounded-lg border border-agent-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Saldo Total (USD)</label>
                  <input type="number" step="0.01" value={fondoForm.saldoUSD} onChange={e => setFondoForm({...fondoForm, saldoUSD: e.target.value})} className="w-full bg-agent-bg border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Porcentaje Mensual (%)</label>
                  <input type="number" step="1" value={fondoForm.porcentaje} onChange={e => setFondoForm({...fondoForm, porcentaje: e.target.value})} className="w-full bg-agent-bg border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none" required />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditFondo(false)} className="px-4 py-2 border border-agent-border text-slate-300 rounded hover:bg-white/5">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-agent-success text-white rounded hover:bg-emerald-600 font-bold">Guardar</button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 bg-agent-bg/30 rounded-lg border border-agent-border/50">
              <span className="text-5xl font-extrabold text-agent-cyan drop-shadow-md">$ {fmtVE(Number(fondo?.saldoUSD || 0))}</span>
              <span className="text-slate-300 mt-2 font-medium">Retención del {fondo?.porcentaje || 10}% sobre gastos</span>
            </div>
          )}
        </div>

        {/* RESUMEN CUENTAS */}
        <div className="glass-panel border border-agent-border p-6 rounded-xl">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><Activity className="w-5 h-5 text-agent-success" /> Saldo Total en Bancos</h3>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-agent-success/10 border border-agent-success/30 rounded-lg text-center">
                <span className="block text-xs text-agent-success font-bold uppercase mb-1">Bolívares (VES)</span>
                <span className="text-2xl font-extrabold text-white">Bs. {fmtVE(cuentas.reduce((a,c) => a + Number(c.saldoVES), 0))}</span>
             </div>
             <div className="p-4 bg-agent-cyan/10 border border-agent-cyan/30 rounded-lg text-center">
                <span className="block text-xs text-agent-cyan font-bold uppercase mb-1">Dólares (USD)</span>
                <span className="text-2xl font-extrabold text-white">$ {fmtVE(cuentas.reduce((a,c) => a + Number(c.saldoUSD), 0))}</span>
             </div>
          </div>
        </div>

      </div>

      {/* LISTA DE CUENTAS BANCARIAS */}
      <div className="glass-panel border border-agent-border p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2"><CreditCard className="w-5 h-5 text-agent-accent" /> Cuentas Bancarias</h3>
          <button onClick={() => { setForm({ id: '', nombre: '', tipo: 'NACIONAL', saldoUSD: '', saldoVES: '' }); setDisplayUSD(''); setDisplayVES(''); setShowForm(true); }} className="px-4 py-2 bg-agent-accent text-white rounded-lg font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Plus className="w-4 h-4" /> Nueva Cuenta
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSaveCuenta} className="mb-6 p-4 bg-agent-bg/50 border border-agent-border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 mb-1">Nombre del Banco o Cuenta</label>
                <input type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full bg-black/40 border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none" placeholder="Ej. Banco Banesco Cta Corriente" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Tipo</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="w-full bg-black/40 border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none">
                  <option value="NACIONAL">Nacional (Bs)</option>
                  <option value="INTERNACIONAL">Internacional (USD)</option>
                  <option value="EFECTIVO">Caja Chica / Efectivo</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Saldo Inicial (USD)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayUSD}
                  onChange={e => handleMontoInput(e.target.value, 'saldoUSD', setDisplayUSD)}
                  onBlur={() => setDisplayUSD(form.saldoUSD ? formatMonto(form.saldoUSD) : '')}
                  className="w-full bg-black/40 border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none font-mono"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Saldo Inicial (VES)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayVES}
                  onChange={e => handleMontoInput(e.target.value, 'saldoVES', setDisplayVES)}
                  onBlur={() => setDisplayVES(form.saldoVES ? formatMonto(form.saldoVES) : '')}
                  className="w-full bg-black/40 border border-agent-border rounded px-3 py-2 text-white focus:border-agent-cyan outline-none font-mono"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-agent-border text-slate-300 rounded hover:bg-white/5">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-agent-success text-white rounded hover:bg-emerald-600 font-bold">Guardar Cuenta</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-agent-border/50 bg-black/20">
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Cuenta / Banco</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Saldo USD</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Saldo VES</th>
                <th className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((c: any) => (
                <tr key={c.id} className="border-b border-agent-border/30 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-white font-medium">{c.nombre}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded ${c.tipo === 'NACIONAL' ? 'bg-agent-success/20 text-agent-success' : c.tipo === 'INTERNACIONAL' ? 'bg-agent-cyan/20 text-agent-cyan' : 'bg-agent-accent/20 text-agent-accent'}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-300 font-bold font-mono">$ {fmtVE(Number(c.saldoUSD))}</td>
                  <td className="p-3 text-right text-slate-300 font-bold font-mono">Bs. {fmtVE(Number(c.saldoVES))}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { 
                        const usdFmt = Number(c.saldoUSD).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        const vesFmt = Number(c.saldoVES).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        setForm({ id: c.id, nombre: c.nombre, tipo: c.tipo, saldoUSD: c.saldoUSD.toString(), saldoVES: c.saldoVES.toString() });
                        setDisplayUSD(usdFmt);
                        setDisplayVES(vesFmt);
                        setShowForm(true);
                      }} className="p-1.5 text-agent-accent hover:bg-agent-accent/20 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCuenta(c.id)} className="p-1.5 text-agent-danger hover:bg-agent-danger/20 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {cuentas.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-slate-400">No hay cuentas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LicenseScreen({ onActivated }: { onActivated: () => void }) {
  const [key, setKey] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (key.length !== 15) {
      setError('La licencia debe contener exactamente 15 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/licencia/activar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ llave: key })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Error al validar la licencia.');
      } else {
        alert('Software Activado Exitosamente.');
        onActivated();
      }
    } catch (err: any) {
      setError('Error de conexion al validar licencia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agent-bg flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl max-w-md w-full border border-agent-accent shadow-[0_0_20px_rgba(59,130,246,0.2)]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-agent-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-agent-accent shadow-inner">
            <Key className="w-8 h-8 text-agent-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wider">SISTEMA BLOQUEADO</h1>
          <p className="text-slate-400 mt-2">Ingrese la Licencia Comercial para usar CONVEN</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500 rounded-lg text-red-200 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleActivate} className="space-y-6">
          <div>
            <label className="block text-slate-300 mb-2 font-bold text-sm">Clave de 15 Caracteres</label>
            <input 
              type="text" 
              value={key}
              onChange={e => setKey(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 15))}
              className="w-full bg-black/50 border border-slate-700 rounded-lg p-4 text-white text-center tracking-[0.3em] font-mono font-bold focus:border-agent-accent focus:ring-1 focus:ring-agent-accent outline-none"
              placeholder="XXXXX00000XXXXX"
              maxLength={15}
            />
            <p className="text-xs text-slate-500 mt-2 text-center">Contacte a su proveedor de software si no posee una llave.</p>
          </div>
          
          <button 
            type="submit"
            disabled={loading || key.length !== 15}
            className="w-full py-3 bg-agent-accent hover:bg-blue-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'VALIDANDO...' : 'ACTIVAR SOFTWARE'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AuditoriaForensePanel() {
  const [loading, React_useState] = React.useState(false);
  
  const handleDownload = async () => {
    try {
      React_useState(true);
      const res = await apiFetch('/api/auditoria/shadow-log');
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error: ' + errorData.error);
        React_useState(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'shadow_audit.log';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Error descargando log: ' + e.message);
    } finally {
      React_useState(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-8 rounded-xl border border-agent-danger/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-agent-danger/20 rounded-lg flex items-center justify-center border border-agent-danger/50">
            <Shield className="w-7 h-7 text-agent-danger" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wide">Bóveda Criptográfica WORM</h2>
            <p className="text-slate-400 mt-1">Registros de Auditoría Inmutables - Acceso Clasificado</p>
          </div>
        </div>
        
        <div className="bg-black/40 border border-white/10 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-agent-danger flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" /> PRECAUCIÓN FORENSE
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            Este módulo otorga acceso directo al archivo <strong>shadow.log</strong> del sistema. 
            El archivo contiene las firmas SHA-256 de todas las transacciones financieras (abonos, gastos, modificaciones), generadas de manera invisible y fuera del alcance de la base de datos principal. 
            Es matemáticamente imposible de alterar sin corromper la integridad de la cadena, cumpliendo con los estándares requeridos para peritaje legal.
          </p>
          <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4">
            <li>Formato WORM (Write Once, Read Many).</li>
            <li>Inmune a inyecciones SQL o truncados de base de datos.</li>
            <li>Almacenamiento Out-of-Band (archivo oculto en el servidor).</li>
          </ul>
        </div>

        <button 
          onClick={handleDownload} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-agent-danger text-white font-bold rounded hover:bg-red-600 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          <Download className="w-5 h-5" />
          {loading ? 'DESCARGANDO BÓVEDA...' : 'DESCARGAR REGISTRO WORM (.LOG)'}
        </button>
      </div>
    </div>
  );
}
