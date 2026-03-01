/**
 * Formateo de moneda Guaraníes
 * @param {number} value - Valor numérico
 * @param {boolean} abbreviated - Si true, usa M/B para millones/billones
 * @returns {string} Ej: "Gs 1.234.567" o "Gs 1.234M"
 */
export function formatGs(value, abbreviated = false) {
  if (value == null || isNaN(value)) return 'Gs 0';

  if (abbreviated) {
    if (Math.abs(value) >= 1e9) return `Gs ${(value / 1e9).toFixed(0)}B`;
    if (Math.abs(value) >= 1e6) return `Gs ${(value / 1e6).toFixed(0)}M`;
    if (Math.abs(value) >= 1e3) return `Gs ${(value / 1e3).toFixed(0)}K`;
  }

  return `Gs ${value.toLocaleString('es-PY')}`;
}

/**
 * Formateo USD
 * @param {number} value
 * @returns {string}
 */
export function formatUSD(value) {
  if (value == null || isNaN(value)) return 'USD 0';
  return `USD ${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
}

/**
 * Formateo de fecha relativa
 * @param {string} dateStr - Fecha ISO
 * @returns {string} Ej: "hace 3 días", "hoy", "hace 2 semanas"
 */
export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
}

/**
 * Formateo de fecha completa en español
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-PY', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

/**
 * Formateo de número con separador de miles
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value == null || isNaN(value)) return '0';
  return value.toLocaleString('es-PY');
}

/**
 * Truncar texto con ellipsis
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

/**
 * Generar iniciales de un nombre
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

/**
 * Clase CSS para color de urgencia (Tailwind)
 * @param {string} urgency
 * @returns {string}
 */
export function getUrgencyClass(urgency) {
  const map = {
    baja: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    media: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    alta: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    emergencia: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return map[urgency?.toLowerCase()] || map.media;
}

/**
 * Clase CSS para color de status (Tailwind)
 * @param {string} status
 * @returns {string}
 */
export function getStatusClass(status) {
  const map = {
    borrador: 'bg-slate-500/10 text-slate-400',
    pendiente: 'bg-purple-500/10 text-purple-400',
    pendiente_aprobacion: 'bg-amber-500/10 text-amber-400',
    aprobacion_gerente: 'bg-amber-500/10 text-amber-400',
    cotizacion: 'bg-violet-500/10 text-violet-400',
    aprobacion_compra: 'bg-blue-500/10 text-blue-400',
    en_proceso: 'bg-blue-500/10 text-blue-400',
    orden_compra: 'bg-emerald-500/10 text-emerald-400',
    recibido: 'bg-green-500/10 text-green-400',
    registrado_sap: 'bg-teal-500/10 text-teal-400',
    sap: 'bg-teal-500/10 text-teal-400',
    rechazado: 'bg-red-500/10 text-red-400',
    cancelado: 'bg-slate-500/10 text-slate-500',
  };
  return map[status] || map.pendiente;
}
