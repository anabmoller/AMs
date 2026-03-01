// ============================================================
// CONSTANTES DEL SISTEMA — YPOTI COMPRAS
// Fuente: SAP + Asana + configuración del grupo
// ============================================================

export const COMPANIES = [
  { id: 'rb', name: 'Rural Bioenergia S.A.', type: 'empresa' },
  { id: 'ch', name: 'Chacobras', type: 'empresa' },
  { id: 'lc', name: 'La Constancia', type: 'empresa' },
  { id: 'cp', name: 'Control Pasto', type: 'empresa' },
  { id: 'am', name: 'Ana Moller', type: 'persona_fisica' },
  { id: 'gm', name: 'Gabriel Moller', type: 'persona_fisica' },
  { id: 'pm', name: 'Pedro Moller', type: 'persona_fisica' },
];

export const ESTABLISHMENTS = [
  { id: 'ypoti', name: 'Ypoti', company: 'rb', manager: 'Fabiano' },
  { id: 'cerro', name: 'Cerro Memby', company: 'rb', manager: 'Fabiano' },
  { id: 'cielo', name: 'Cielo Azul', company: 'rb', manager: 'Mauricio' },
  { id: 'lusipar', name: 'Lusipar', company: 'rb', manager: 'Ronei' },
  { id: 'sms', name: 'Santa Maria da Serra', company: 'rb', manager: 'Ronei' },
  { id: 'ybypora', name: 'Ybyporã', company: 'rb', manager: 'Fabiano' },
  { id: 'santa_clara', name: 'Santa Clara', company: 'rb', manager: 'Mauricio' },
  { id: 'yby_pyta', name: 'Yby Pyta', company: 'rb', manager: 'Mauricio' },
  { id: 'oro_verde', name: 'Oro Verde', company: 'rb', manager: 'Ronei' },
];

export const SECTORS = [
  'Recria', 'Confinamento', 'Agricultura', 'Administrativo',
  'Manutenção', 'Veterinária', 'Logística', 'Oficina', 'TI',
];

export const PRODUCT_TYPES = [
  'Insumo', 'Repuesto', 'Equipamento', 'Maquinário',
  'Herramienta', 'Farmacia', 'Herbicida', 'Provista',
  'Uniformes', 'Útiles de oficina',
];

export const URGENCY_LEVELS = [
  { value: 'baja', label: 'Baja', color: 'emerald', icon: '◇' },
  { value: 'media', label: 'Media', color: 'amber', icon: '◆' },
  { value: 'alta', label: 'Alta', color: 'orange', icon: '▲' },
  { value: 'emergencia', label: 'Emergencia', color: 'red', icon: '⚠' },
];

export const STATUS_FLOW = [
  { key: 'borrador', label: 'Borrador', color: '#6b7280', icon: '📝', step: 0 },
  { key: 'pendiente', label: 'Pendiente', color: '#8b5cf6', icon: '📋', step: 1 },
  { key: 'aprobacion_gerente', label: 'Aprob. Gerente', color: '#f59e0b', icon: '👤', step: 2 },
  { key: 'cotizacion', label: 'Cotización', color: '#8b5cf6', icon: '💰', step: 3 },
  { key: 'aprobacion_compra', label: 'Aprob. Compra', color: '#3b82f6', icon: '✅', step: 4 },
  { key: 'orden_compra', label: 'Orden de Compra', color: '#10b981', icon: '📦', step: 5 },
  { key: 'recibido', label: 'Recibido', color: '#059669', icon: '✔', step: 6 },
  { key: 'sap', label: 'Registrado SAP', color: '#047857', icon: '🏁', step: 7 },
];

export const APPROVAL_RULES = [
  { id: 'R1', condition: 'Valor < ₲ 5.000.000', approvers: ['Gerente de Área'] },
  { id: 'R2', condition: 'Valor ≥ ₲ 5.000.000', approvers: ['Gerente de Área', 'Director'] },
  { id: 'R3', condition: 'Valor ≥ ₲ 50.000.000', approvers: ['Gerente de Área', 'Director', 'Ana Moller'] },
  { id: 'R4', condition: 'Emergencia', approvers: ['Gerente de Área (SLA 4h)'] },
  { id: 'R5', condition: 'Farmacia/Veterinária', approvers: ['Rodrigo Ferreira', 'Gerente'] },
];
