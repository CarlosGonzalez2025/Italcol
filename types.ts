import React from 'react';

export enum UserRole {
  ADMIN = 'admin',
  SOLICITANTE = 'solicitante', // Lider de tarea
  AUTORIZANTE = 'autorizante', // Supervisor / Jefe Area
  MANTENIMIENTO = 'mantenimiento',
  LIDER_SST = 'lider_sst',
}

export enum PermitStatus {
  PENDING_REVISION = 'pendiente_revision',
  APPROVED = 'aprobado',
  IN_PROGRESS = 'en_ejecucion',
  CLOSED = 'cerrado',
  REJECTED = 'rechazado',
  SUSPENDED = 'suspendido',
  DRAFT = 'borrador'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  uid?: string;
  displayName?: string;
  empresa?: string;
}

export interface Approval {
    status: 'pendiente' | 'aprobado' | 'rechazado';
    uid?: string;
    userName?: string;
    userRole?: UserRole;
    userEmpresa?: string;
    firmaApertura?: string; // Data URL
    signedAt?: string; // ISO Date
    comments?: string;
}

export interface Signature {
    signedBy: string;
    signerName: string;
    signedAt: string;
    role: UserRole;
}

export interface ValidacionDiaria {
    dia: number;
    nombre: string;
    fecha: string;
    firma: string;
}

export interface WorkerDetail {
  id: string; // Cedula
  name: string; // Used in code
  nombre?: string; // Used in some parts of the new logic, aliasing to name
  cedula?: string; // Aliasing to id
  role: string;
  rol?: string; // Aliasing
  otroRol?: string;
  aptitude: {
    tec: boolean;
    tsa: boolean;
  };
  tsaTec?: { tec: boolean; tsa: boolean }; // Alias for aptitude
  training: {
    tec: boolean;
    tsa: boolean;
    otro: boolean;
    otroDesc?: string;
    otroCual?: string;
  };
  entrenamiento?: any; // Alias
  socialSecurity: {
    eps: boolean;
    arl: boolean;
    pension: boolean;
  };
  eps?: boolean;
  arl?: boolean;
  pensiones?: boolean;
  signatureOpen?: string; // Data URL of the signature
  firmaApertura?: string; // Alias
  firmaCierre?: string;
}

// Anexos Interfaces
export interface AnexoAltura {
    alturaAproximada?: string;
    tareaRealizar?: { nombre: string; descripcion: string };
    emergencia?: { contacto: string; telefono: string };
    tipoEstructura?: Record<string, boolean | string>;
    aspectosSeguridad?: Record<string, string>; // 'si' | 'no'
    precauciones?: Record<string, string>;
    afectaciones?: { riesgoOtrasAreas: string; otrasAreasRiesgo: string; personalNotificado: string; observaciones: string };
    validacion?: { responsable: ValidacionDiaria[]; autoridad: ValidacionDiaria[] };
}

export interface AnexoConfinado {
    emergencia?: { contacto: string; telefono: string };
    identificacionPeligros?: Record<string, string>;
    procedimientoComunicacionCual?: string;
    precauciones?: Record<string, string>;
    requerimientosEquipos?: Record<string, string>;
    autoridadDelArea?: { nombre: string };
    responsableDelTrabajo?: { nombre: string };
    supervisorTrabajo?: { nombre: string };
    resultadosPruebasGases?: { lel: string; o2: string; h2s: string; co: string };
    pruebasGasesPeriodicas?: { pruebas: { id: string; hora: string; lel: string; o2: string; h2s: string; co: string; firma: string }[] };
    validacion?: { responsable: ValidacionDiaria[]; autoridad: ValidacionDiaria[] };
}

export interface AnexoEnergias {
    energiasPeligrosas?: Record<string, boolean>;
    trabajosEnCaliente?: Record<string, string>;
    procedimientoLOTO?: Record<string, string>;
    planeacion?: Record<string, string>;
    metodosControl?: Record<string, boolean>;
    sistemaElectrico?: { tensionNominal: string; tensionPersonal: string; distanciaSeguridad: string };
}

export interface AnexoIzaje {
    informacionGeneral: {
        accion: Record<string, boolean>;
        pesoCarga: Record<string, boolean>;
        equipoUtilizar: Record<string, boolean>;
        capacidadEquipo: string;
    };
    aspectosRequeridos?: Record<string, string>;
    precauciones?: Record<string, boolean>;
    validacion?: { responsable: ValidacionDiaria[]; autoridad: ValidacionDiaria[] };
}

export interface AnexoExcavaciones {
    informacionGeneral: { dimensiones: string; profundidad: string; ancho: string; largo: string };
    aspectosRequeridos?: Record<string, string>;
    precauciones?: Record<string, boolean>;
    validacion?: { responsable: ValidacionDiaria[]; autoridad: ValidacionDiaria[] };
}

export interface Permit {
  id: string;
  number: string;
  createdAt: string;
  createdBy: string; // User ID
  requesterName: string;
  status: PermitStatus;
  
  // New user object for full context
  user?: { displayName: string; uid: string; email: string };

  generalInfo?: {
      areaEspecifica: string;
      planta: string;
      proceso: string;
      contrato: string;
      empresa: string;
      validFrom: string;
      validUntil: string;
      workDescription: string;
  };
  
  // Compatibility fields (legacy)
  area: string; 
  plant: string;
  process: string;
  contract: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string; 
  tools: string;
  workerCount: number;
  
  // Checklists
  selectedWorkTypes?: {
    altura: boolean;
    espaciosConfinados: boolean;
    energia: boolean;
    izaje: boolean;
    caliente: boolean; // Mapped to energia
    excavacion: boolean;
    general: boolean;
  };
  workTypes: any; // Alias for backward compatibility
  
  // Section: Executor / Responsable
  executor: {
    name: string;
    cargo: string;
    company: string;
    scope: string;
  };
  
  // ATS
  anexoATS?: {
      peligros: Record<string, string>; // id -> 'si' | 'no'
      epp: Record<string, any>;
      justificacion: Record<string, string>;
  };
  // Legacy ATS fields
  atsJustification: string;
  selectedHazards: string[];
  additionalHazards: { hazard: string; control: string }[];
  
  // Verification Matrix (Legacy)
  verificationMatrix: Record<string, string>;
  
  // PPE (Legacy)
  ppe: Record<string, any>;
  eppEmergencias?: { emergencias: Record<string, string> };
  emergencyChecks: Record<string, string>; // Legacy

  // Workers
  workers: WorkerDetail[];

  // Approvals & Signatures
  isSSTSignatureRequired?: boolean;
  controlEnergia?: boolean; // Helper flag

  approvals?: {
      solicitante?: Approval;
      autorizante?: Approval;
      mantenimiento?: Approval;
      lider_sst?: Approval;
      coordinador_alturas?: Approval;
  };
  // Legacy Signatures
  signatures: {
    requester?: Signature;
    authorizer?: Signature;
    maintenance?: Signature;
    sst?: Signature;
  };

  // Annexes
  anexoAltura?: AnexoAltura;
  anexoConfinado?: AnexoConfinado;
  anexoEnergias?: AnexoEnergias;
  anexoIzaje?: AnexoIzaje;
  anexoExcavaciones?: AnexoExcavaciones;

  // Closure
  closure?: {
      terminado: boolean;
      cancelado: boolean;
      razonCancelacion?: string;
      observacionesCierre?: string;
      responsable?: { nombre: string; fecha: string; firma: string };
      autoridad?: { nombre: string; fecha: string; firma: string };
      canceladoPor?: { nombre: string; fecha: string };
  };
  // Legacy Closure
  closingChecks?: any;
  closingSignatures: any;
  rejectionReason?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}