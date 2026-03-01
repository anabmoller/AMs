/**
 * Desktop sidebar navigation — dark mode
 */
export default function DesktopSidebar({ screen, onNavigate, onNewRequest, currentUser, canViewAnalytics, canManageUsers }) {
  const mainItems = [
    { key: 'dashboard', icon: '📋', label: 'Solicitudes' },
    { key: 'inventory', icon: '📦', label: 'Inventario' },
    ...(canViewAnalytics ? [{ key: 'analytics', icon: '📊', label: 'Análisis' }] : []),
    ...(canViewAnalytics ? [{ key: 'analysis', icon: '📈', label: 'Análisis Pro' }] : []),
    ...(canManageUsers ? [{ key: 'security', icon: '🛡️', label: 'Seguridad' }] : []),
  ];

  const adminItems = [
    ...(canManageUsers ? [{ key: 'users', icon: '👥', label: 'Usuarios' }] : []),
    ...(canViewAnalytics ? [{ key: 'budgets', icon: '💰', label: 'Presupuestos' }] : []),
    ...(canManageUsers ? [{ key: 'parameters', icon: '⚙️', label: 'Parámetros' }] : []),
    ...(canManageUsers ? [{ key: 'approvalConfig', icon: '🔄', label: 'Aprobaciones' }] : []),
  ];

  const initial = currentUser?.charAt(0)?.toUpperCase() || 'U';

  return (
    <aside className="desktop-sidebar bg-[#0d0e14]">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-base">
          Y
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight leading-tight m-0">YPOTI</h1>
          <div className="text-[10px] font-medium text-slate-500 tracking-wide">{"Gestión de Compras"}</div>
        </div>
      </div>

      {/* User card */}
      <div className="mx-3 mt-3 mb-1 px-3 py-2.5 bg-[rgba(255,255,255,0.04)] rounded-lg border border-white/[0.06] flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-semibold text-xs">
          {initial}
        </div>
        <div className="text-sm font-medium text-white truncate">
          {currentUser}
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-2 flex-1 overflow-y-auto">
        <SectionLabel>Principal</SectionLabel>
        {mainItems.map(item => (
          <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
        ))}

        {adminItems.length > 0 && (
          <>
            <SectionLabel>{"Administración"}</SectionLabel>
            {adminItems.map(item => (
              <NavItem key={item.key} item={item} active={screen === item.key} onClick={() => onNavigate(item.key)} />
            ))}
          </>
        )}

        <SectionLabel>Sistema</SectionLabel>
        <NavItem
          item={{ key: 'settings', icon: '🔧', label: 'Configuración' }}
          active={screen === 'settings'}
          onClick={() => onNavigate('settings')}
        />
      </nav>

      {/* New request button */}
      <div className="px-4 pb-5 pt-3">
        <button
          onClick={onNewRequest}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-none cursor-pointer"
          aria-label="Nueva Solicitud"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Nueva Solicitud
        </button>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 pt-3.5 pb-1.5">
      {children}
    </div>
  );
}

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border-none text-sm cursor-pointer mb-0.5 transition-all ${
        active
          ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
          : 'bg-transparent text-slate-400 font-normal hover:bg-[rgba(255,255,255,0.06)] hover:text-slate-200'
      }`}
    >
      <span className="text-[15px] w-5 text-center">{item.icon}</span>
      {item.label}
    </button>
  );
}
