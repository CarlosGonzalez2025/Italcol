import { User, UserRole, Permit, PermitStatus } from './types';

// Mock Users
export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Carlos Admin', email: 'admin@sgtc.com', role: UserRole.ADMIN, avatar: 'https://i.pravatar.cc/150?u=admin' },
  { id: 'u2', name: 'Juan Solicitante', email: 'juan@sgtc.com', role: UserRole.SOLICITANTE, avatar: 'https://i.pravatar.cc/150?u=juan' },
  { id: 'u3', name: 'Maria Autorizante', email: 'maria@sgtc.com', role: UserRole.AUTORIZANTE, avatar: 'https://i.pravatar.cc/150?u=maria' },
  { id: 'u4', name: 'Pedro Mantenimiento', email: 'pedro@sgtc.com', role: UserRole.MANTENIMIENTO, avatar: 'https://i.pravatar.cc/150?u=pedro' },
  { id: 'u5', name: 'Luisa SST', email: 'luisa@sgtc.com', role: UserRole.LIDER_SST, avatar: 'https://i.pravatar.cc/150?u=luisa' },
];

// Mock Workers Database for Search functionality
export const WORKER_DATABASE = [
  { 
    id: '1010', name: 'Roberto Gomez', role: 'Soldador', 
    aptitude: { tec: true, tsa: false },
    training: { tec: true, tsa: true, otro: false },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
  { 
    id: '2020', name: 'Ana Martinez', role: 'Electricista',
    aptitude: { tec: false, tsa: true },
    training: { tec: false, tsa: true, otro: false },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
  { 
    id: '3030', name: 'Luis Torres', role: 'Ayudante',
    aptitude: { tec: false, tsa: false },
    training: { tec: false, tsa: false, otro: false },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
  { 
    id: '4040', name: 'Claudia Ruiz', role: 'Vigía',
    aptitude: { tec: true, tsa: true },
    training: { tec: true, tsa: true, otro: false },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
  { 
    id: '5050', name: 'Jorge Perez', role: 'Mecánico',
    aptitude: { tec: false, tsa: false },
    training: { tec: false, tsa: false, otro: true, otroDesc: 'Alturas Avanzado' },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
  { 
    id: '6060', name: 'Maria Diaz', role: 'Ingeniera de Campo',
    aptitude: { tec: true, tsa: true },
    training: { tec: true, tsa: true, otro: false },
    socialSecurity: { eps: true, arl: true, pension: true }
  },
];

export const PLANTS = ['Planta Principal', 'Planta B', 'Patio Tanques', 'Oficinas Administrativas', 'Malambo', 'Yumbo'];
export const PROCESSES = ['Mantenimiento', 'Producción', 'Logística', 'Proyectos', 'Servicios Generales'];
export const CONTRACTS = ['CT-2024-001', 'CT-2024-002', 'Interno', 'CT-EXT-99'];
export const COMPANIES = ['Italcol', 'Contratista A', 'Contratista B', 'Servicios XYZ'];

// ATS Justifications
export const ATS_JUSTIFICATIONS = [
  'TRABAJO RUTINARIO REALIZADO 1 VEZ CADA 3 MESES',
  'TRABAJO NO RUTINARIO (EMERGENCIA)',
  'TRABAJO RUTINARIO QUE NO POSEE UN PROCEDIMIENTO SEGURO',
  'TRABAJO NO RUTINARIO (PLANEADO)',
  'TRABAJO RUTINARIO CON CONDICIÓN ESPECÍFICA'
];

// ATS Hazards List (Extracted from provided table)
export const HAZARD_MASTER_LIST = [
  {
    category: 'LOCATIVOS',
    items: [
      { id: 'loc_1', hazard: 'Superficies irregulares', control: 'Uso de botas de seguridad con suela antideslizante. Controlar escapes, derrames o goteras. Limpiar de inmediato.' },
      { id: 'loc_2', hazard: 'Superficies deslizantes', control: 'Al subir o bajar escaleras utilizar todos los peldaños y sujetarse del pasamanos; mantener los tres puntos de apoyo.' },
      { id: 'loc_3', hazard: 'Superficies con diferencia de nivel', control: 'No caminar hacia atrás. No acercarse a los vacíos existentes cerca al área de trabajo.' },
      { id: 'loc_4', hazard: 'Techos, muros, pisos en mal estado', control: 'Hacer uso de los elementos de prevención contra caídas. Diligenciar permiso de altura si supera 2.0m.' },
      { id: 'loc_5', hazard: 'Espacios reducidos', control: 'Si esta catalogado como espacio confinado, aplica permiso de espacios confinados.' },
    ]
  },
  {
    category: 'FÍSICOS',
    items: [
      { id: 'fis_1', hazard: 'Deficiencia de iluminación', control: 'Uso de reflectores y/o lámparas. Informar ausencia de luz. Usar gafas claras.' },
      { id: 'fis_2', hazard: 'Exceso de iluminación', control: 'Uso de gafas oscuras en caso de exceso de iluminación.' },
      { id: 'fis_3', hazard: 'Ruido (Intermitente/Continuo)', control: 'Usar de manera permanente protección auditiva tipo copa o de inserción.' },
      { id: 'fis_4', hazard: 'Contacto superficies calientes', control: 'Usar guantes de protección, ropa manga larga, identificar con señalización.' },
      { id: 'fis_5', hazard: 'Exposición a arco de soldadura', control: 'Utilizar yelmo de soldar o pantalla de mano siempre que se suelde.' },
    ]
  },
  {
    category: 'QUÍMICOS',
    items: [
      { id: 'quim_1', hazard: 'Gases, humos, vapores', control: 'Uso permanente de protección respiratoria adecuada (filtros específicos).' },
      { id: 'quim_2', hazard: 'Material particulado', control: 'Mantenimiento periódico de mascarilla. Asegurar sello efectivo.' },
      { id: 'quim_3', hazard: 'Uso sustancias peligrosas', control: 'Uso de EPP de acuerdo a FDS. Disponer de Ficha de Datos de Seguridad en sitio.' },
      { id: 'quim_4', hazard: 'Derrame de productos', control: 'Definir plan de emergencia, contar con kit antiderrames.' },
    ]
  },
  {
    category: 'MECÁNICOS',
    items: [
      { id: 'mec_1', hazard: 'Proyección de partículas', control: 'Uso obligatorio de EPP facial y visual.' },
      { id: 'mec_2', hazard: 'Mecanismo en movimiento', control: 'Mantener guardas instaladas. No acercar segmentos corporales.' },
      { id: 'mec_3', hazard: 'Manejo de herramientas', control: 'Inspección preoperacional. Uso en condiciones operativas seguras.' },
      { id: 'mec_4', hazard: 'Movimiento equipos pesados', control: 'Señalización en sitio, paleta de pare y siga.' },
    ]
  },
  {
    category: 'BIOMECÁNICOS',
    items: [
      { id: 'bio_1', hazard: 'Carga Estática (Posturas)', control: 'Calentamiento previo, pausas activas, higiene postural.' },
      { id: 'bio_2', hazard: 'Carga Dinámica (Peso)', control: 'No levantar >25kg (H) / 12.5kg (M). Usar ayudas mecánicas.' },
    ]
  },
  {
    category: 'BIOLÓGICOS / VIAL',
    items: [
      { id: 'biol_1', hazard: 'Exposición vectores/enfermedades', control: 'Orden y aseo, evitar acumulación de agua.' },
      { id: 'vial_1', hazard: 'Accidente vial (Peatonal)', control: 'Hacer uso de vías definidas.' },
      { id: 'vial_2', hazard: 'Atropellamiento', control: 'Respetar límites de velocidad (10km/h), no usar celular.' },
    ]
  },
  {
    category: 'AMBIENTALES',
    items: [
        { id: 'amb_1', hazard: 'Generación residuos', control: 'Realizar separación y disponer según clasificación.' },
        { id: 'amb_2', hazard: 'Consumo de agua', control: 'Uso eficiente, prevenir derrames.' },
        { id: 'amb_3', hazard: 'Mezcla concreto suelo', control: 'Uso de mezcladora o recipiente.' },
        { id: 'amb_4', hazard: 'Emisiones material particulado', control: 'Cubrir materiales que puedan generar polvo.' }
    ]
  }
];

// Verification Matrix Sections
export const VERIFICATION_SECTIONS = [
  {
      name: 'FÍSICOS',
      items: ['Ruido', 'Iluminación Deficiente', 'Temperaturas Extremas', 'Vibración', 'Radiación Ionizante', 'Radiación NO ionizante', 'Disconfort térmico', 'Superficies calientes']
  },
  {
      name: 'QUÍMICOS',
      items: ['Gases y vapores', 'Humos metálicos', 'Fibras', 'Polvos', 'Liquidos Nieblas', 'Liquidos Rocios']
  },
  {
      name: 'SEGURIDAD',
      items: ['Elementos de maquinas', 'Herramientas mecanicas', 'Herramientas manuales', 'Equipos en movimiento', 'Proyeccion de particulas', 'Proyeccion de fluidos', 'Equipos presurizados', 'Intervencion sistemas electricos', 'Adyacente equipos/lineas energizados', 'Alta tension', 'Baja tension', 'Estática', 'Fuga', 'Incendio', 'Explosion']
  },
  {
      name: 'LOCATIVOS',
      items: ['Trabajo alturas', 'Espacios confinados', 'Superficies irregulares', 'Superficies deslizantes', 'Superficies con desnivel', 'Condiciones de orden y aseo', 'Transito de vehiculos', 'Almacenamiento']
  },
  {
      name: 'BIOLOGICO / AMBIENTAL',
      items: ['Picaduras', 'Mordeduras', 'Bacterias, virus hongos', 'Fluidos o excrementos', 'Generacion de residuos', 'Emisiones y/o vertimientos', 'Derrame potencial sutancias quimicas', 'Uso material de arrastre o cantera']
  },
  {
      name: 'BIOMECANICOS',
      items: ['Posturas forzadas', 'Posturas prolongada', 'Esfuerzo', 'Movimiento repetitivo', 'Movimiento antigravitacional', 'Manipulacion manual de cargas']
  },
  {
      name: 'PSICOSOCIAL',
      items: ['Pausas', 'Trabajo nocturno', 'Rotacion', 'Horas extras', 'Turno']
  }
];

// PPE List (Mix of Boolean and Text)
export const PPE_LIST = [
  { key: 'ropa_trabajo', label: 'Ropa de trabajo', type: 'bool' },
  { key: 'overol_ignifugo', label: 'Overol Ignífugo (Categoría)', type: 'text' },
  { key: 'prot_soldador', label: 'Protección cuerpo para soldador', type: 'bool' },
  { key: 'prot_respiratoria', label: 'Protección respiratoria', type: 'bool' },
  { key: 'casco', label: 'Casco (Tipo/Clase)', type: 'text' },
  { key: 'chavo', label: 'Chavo en tela o carnaza', type: 'bool' },
  { key: 'botas_dielectricas', label: 'Botas de seguridad + dielectrica', type: 'bool' },
  { key: 'prot_metatarso', label: 'Protección metatarso', type: 'bool' },
  { key: 'monogafas', label: 'Monogafas / Gafas', type: 'bool' },
  { key: 'careta_soldador', label: 'Careta de soldador', type: 'bool' },
  { key: 'gafas_oxicorte', label: 'Gafas de oxicorte', type: 'bool' },
  { key: 'careta_total', label: 'Careta de protección total', type: 'bool' },
  { key: 'auditiva_insercion', label: 'Protección auditiva Inserción', type: 'bool' },
  { key: 'auditiva_copa', label: 'Protección auditiva copa', type: 'bool' },
  { key: 'guantes_corte', label: 'Guantes anti corte', type: 'bool' },
  { key: 'guantes_quimicos', label: 'Guantes sustancias químicas', type: 'bool' },
  { key: 'guantes_temp', label: 'Guantes temperatura', type: 'bool' },
  { key: 'arnes', label: 'Arnés (Tipo)', type: 'text' },
  { key: 'mosqueton', label: 'Mosquetón', type: 'bool' },
  { key: 'eslinga', label: 'Eslinga (Tipo)', type: 'text' },
  { key: 'linea_vida', label: 'Línea de vida (Tipo)', type: 'text' },
  { key: 'punto_anclaje', label: 'Punto de anclaje (Cual)', type: 'text' },
  { key: 'senalizacion', label: 'Señalización', type: 'bool' },
  { key: 'barandas', label: 'Barandas', type: 'bool' },
  { key: 'delimitacion', label: 'Delimitación Perimetral', type: 'bool' },
  { key: 'control_acceso', label: 'Control de acceso', type: 'bool' },
];

export const EMERGENCY_CHECKS = [
  'NOTIFICACIÓN: El personal afectado fue notificado',
  'EMERGENCIAS: Recordar y verificar',
  'A.- Las emergencias potenciales que pueden ocurrir',
  'B.- Los procedimientos establecidos',
  'C.- Rutas de Evacuación',
  'D.- Puntos de encuentro',
  'E.- Ubicación equipos emergencia'
];

export const INITIAL_PERMITS: Permit[] = [];