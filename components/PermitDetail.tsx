import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbService } from '../services/dbService';
import { Permit, PermitStatus, UserRole, User, Approval, ValidacionDiaria } from '../types';
import {
  FileText, AlertTriangle, Shield, Users, ArrowLeft, CheckCircle, XCircle, Clock,
  PlayCircle, PauseCircle, Lock, Edit, ShieldCheck, Circle,
  ChevronDown, Siren, FileDown, Check, Info, FileX, MessageSquare
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, differenceInCalendarDays, parseISO, isValid } from 'date-fns';

// Import UI Components
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

// --- UTILS ---
const safeFormat = (date: any, fmt: string): string => {
  if (!date) return 'N/A';
  let parsedDate;
  if (date && typeof date.toDate === 'function') parsedDate = date.toDate();
  else if (date instanceof Date) parsedDate = date;
  else if (typeof date === 'string') parsedDate = new Date(date);
  
  return parsedDate && isValid(parsedDate) ? format(parsedDate, fmt) : 'N/A';
};

const getStatusInfo = (status: string) => {
    const statusInfo: any = {
        borrador: { text: 'Borrador', icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        pendiente_revision: { text: 'Pendiente Revisión', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
        aprobado: { text: 'Aprobado', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
        en_ejecucion: { text: 'En Ejecución', icon: PlayCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
        suspendido: { text: 'Suspendido', icon: PauseCircle, color: 'text-orange-600', bgColor: 'bg-orange-100' },
        cerrado: { text: 'Cerrado', icon: Lock, color: 'text-gray-600', bgColor: 'bg-gray-100' },
        rechazado: { text: 'Rechazado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    };
    return statusInfo[status] || statusInfo.borrador;
};

// --- CUSTOM COMPONENTS ---

const Section = ({ title, children, className = '' }: any) => (
    <div className={className}>
      <h3 className="text-sm font-bold uppercase text-gray-500 border-b-2 border-gray-300 pb-1 mb-3">{title}</h3>
      <div className="text-sm">{children}</div>
    </div>
);

const Field = ({ label, value, fullWidth }: any) => (
    <div className={fullWidth ? 'col-span-2' : ''}>
        <p className="text-xs text-gray-500 font-bold">{label}</p>
        <div className="font-semibold text-gray-800 break-words">{value || 'No especificado'}</div>
    </div>
);

const RadioCheck = ({ label, value, spec }: any) => {
    let status = value === true || value === 'si' ? 'si' : (value === false || value === 'no' ? 'no' : 'na');
    const icons: any = {
        si: <CheckCircle className="h-5 w-5 text-green-500" />,
        no: <XCircle className="h-5 w-5 text-red-500" />,
        na: <Circle className="h-5 w-5 text-gray-300" />,
    };
    return (
        <div className="flex items-center justify-between p-2 border-b border-slate-100 last:border-0">
            <span className="text-xs flex-1 pr-2 text-slate-700">{label}</span>
            <div className="flex items-center gap-2">
                {spec && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">{spec}</span>}
                {icons[status]}
            </div>
        </div>
    );
};

// --- SIGNATURE PAD ---
const SignaturePad = ({ onSave, isSaving }: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = canvas.parentElement?.clientWidth || 400;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.lineCap = 'round';
            }
        }
    }, []);

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        setIsEmpty(false);
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: any) => {
        if (e.buttons !== 1 && e.type !== 'touchmove') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const clear = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleSave = () => {
        if (isEmpty) return alert("Debe firmar antes de guardar.");
        onSave(canvasRef.current?.toDataURL());
    };

    return (
        <div className="p-4 bg-slate-50 rounded-lg">
            <div className="bg-white border border-slate-300 rounded shadow-sm mb-4 w-full">
                <canvas 
                    ref={canvasRef}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                />
            </div>
            
            <div className="mb-4 flex gap-3 items-start p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded shrink-0" defaultChecked disabled />
                <p className="text-[10px] text-blue-800 leading-tight text-justify">
                    Al firmar, valido las condiciones de seguridad y autorizo el tratamiento de mis datos personales para fines de seguridad y salud en el trabajo, conforme a la política de protección de datos de la organización.
                </p>
            </div>

            <div className="flex justify-between gap-3">
                <Button variant="outline" onClick={clear} size="sm">Limpiar</Button>
                <Button variant="primary" onClick={handleSave} disabled={isSaving || isEmpty} size="sm">
                    {isSaving ? 'Guardando...' : 'Guardar Firma'}
                </Button>
            </div>
        </div>
    );
};

export const PermitDetail: React.FC<{ user: User }> = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [permit, setPermit] = useState<Permit | null>(null);
    const [loading, setLoading] = useState(true);

    // Dialog States
    const [sigDialogOpen, setSigDialogOpen] = useState(false);
    const [workerSigDialogOpen, setWorkerSigDialogOpen] = useState(false);
    const [closureDialogOpen, setClosureDialogOpen] = useState(false);
    
    // Signing State
    const [signingContext, setSigningContext] = useState<any>(null); // { role, type, index? }
    const [signerName, setSignerName] = useState('');
    const [isSigning, setIsSigning] = useState(false);

    // Initial Load & Realtime Listener
    useEffect(() => {
        if (!id) return;
        const docRef = doc(db, 'permits', id);
        const unsubscribe = onSnapshot(docRef, (snap) => {
            if (snap.exists()) {
                const data = snap.data() as Permit;
                // Patch legacy data structures if needed
                if (!data.approvals) data.approvals = {};
                if (!data.workers) data.workers = [];
                setPermit({ id: snap.id, ...data });
            } else {
                setPermit(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id]);

    // --- LOGIC ---
    const getWorkTypesString = (p: Permit) => {
        const types = [];
        const wt = p.selectedWorkTypes || p.workTypes || {};
        if (wt.altura) types.push('Trabajo en Alturas');
        if (wt.espaciosConfinados || wt.confinado) types.push('Espacios Confinados');
        if (wt.energia) types.push('Control de Energías');
        if (wt.izaje) types.push('Izaje de Cargas');
        if (wt.excavacion) types.push('Excavaciones');
        if (wt.general) types.push('Trabajo General');
        return types.join(', ') || 'General';
    };

    const canSign = (role: string) => {
        if (!permit || !user) return { can: false, reason: 'Cargando...' };
        const status = permit.status;
        
        // Block signing if closed/rejected/suspended
        if (['rechazado', 'cerrado', 'suspendido'].includes(status)) return { can: false, reason: `Permiso ${status}` };

        // Hierarchy Logic
        const approvals = permit.approvals || {};
        
        if (role === 'solicitante') {
            if (approvals.solicitante?.status === 'aprobado') return { can: false, reason: 'Ya firmado' };
            // Allow creator or admin
            if (permit.createdBy !== user.id && user.role !== 'admin') return { can: false, reason: 'Solo el creador puede firmar' };
            return { can: true };
        }

        if (role === 'autorizante') {
            if (approvals.autorizante?.status === 'aprobado') return { can: false, reason: 'Ya firmado' };
            if (user.role !== 'autorizante' && user.role !== 'admin') return { can: false, reason: 'Rol requerido: Autorizante' };
            if (approvals.solicitante?.status !== 'aprobado') return { can: false, reason: 'Falta firma del Solicitante' };
            return { can: true };
        }

        if (role === 'lider_sst') {
             if (approvals.lider_sst?.status === 'aprobado') return { can: false, reason: 'Ya firmado' };
             if (user.role !== 'lider_sst' && user.role !== 'admin') return { can: false, reason: 'Rol requerido: SST' };
             if (approvals.solicitante?.status !== 'aprobado') return { can: false, reason: 'Falta firma del Solicitante' };
             return { can: true };
        }

        if (role === 'mantenimiento') {
             if (approvals.mantenimiento?.status === 'aprobado') return { can: false, reason: 'Ya firmado' };
             if (user.role !== 'mantenimiento' && user.role !== 'admin') return { can: false, reason: 'Rol requerido: Mantenimiento' };
             return { can: true };
        }

        return { can: false, reason: 'Rol desconocido' };
    };

    // --- ACTIONS ---
    const handleSign = async (dataUrl: string) => {
        if (!permit || !signingContext) return;
        setIsSigning(true);
        try {
            const { role, type, index } = signingContext;
            const permitRef = doc(db, 'permits', permit.id);

            // 1. Worker Signature
            if (type === 'worker') {
                const workers = [...permit.workers];
                if (workers[index]) {
                    if (role === 'apertura') workers[index].firmaApertura = dataUrl;
                    else workers[index].firmaCierre = dataUrl;
                    await updateDoc(permitRef, { workers });
                }
            } 
            // 2. Closure Signature
            else if (type === 'closure') {
                const closureData = permit.closure || {};
                const field = role === 'responsable' ? 'responsable' : 'autoridad';
                await updateDoc(permitRef, {
                    [`closure.${field}`]: {
                        nombre: user.name,
                        fecha: new Date().toISOString(),
                        firma: dataUrl
                    }
                });
            }
            // 3. Approval Signature
            else {
                const approvalData: Approval = {
                    status: 'aprobado',
                    userName: user.name,
                    userRole: user.role,
                    signedAt: new Date().toISOString(),
                    firmaApertura: dataUrl,
                    uid: user.id
                };
                await updateDoc(permitRef, { [`approvals.${role}`]: approvalData });
            }
            
            setSigDialogOpen(false);
            setWorkerSigDialogOpen(false);
            setClosureDialogOpen(false);
        } catch (e) {
            console.error(e);
            alert("Error al guardar firma");
        } finally {
            setIsSigning(false);
        }
    };

    const changeStatus = async (newStatus: PermitStatus) => {
        if (!permit) return;
        if (!confirm(`¿Cambiar estado a ${newStatus}?`)) return;
        try {
            await updateDoc(doc(db, 'permits', permit.id), { status: newStatus });
        } catch(e) { alert("Error al actualizar estado"); }
    };

    const handleExportPDF = () => {
        if (!permit) return;
        const doc = new jsPDF();
        
        doc.setFontSize(14);
        doc.text("PERMISO DE TRABAJO - SGTC", 14, 20);
        
        autoTable(doc, {
            startY: 30,
            head: [['Campo', 'Valor']],
            body: [
                ['Número', permit.number],
                ['Solicitante', permit.requesterName],
                ['Estado', permit.status],
                ['Fecha Creación', safeFormat(permit.createdAt, 'dd/MM/yyyy HH:mm')],
                ['Ubicación', `${permit.generalInfo?.planta || permit.plant} - ${permit.generalInfo?.areaEspecifica || permit.area}`],
                ['Tipos de Trabajo', getWorkTypesString(permit)],
                ['Descripción', permit.generalInfo?.workDescription || permit.description]
            ]
        });

        // Workers Table
        if (permit.workers?.length) {
            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Nombre', 'Rol', 'Aptitud', 'Firma Apertura']],
                body: permit.workers.map(w => [w.name, w.role, w.aptitude?.tec ? 'TEC' : 'TSA', w.firmaApertura ? 'Firmado' : 'Pendiente'])
            });
        }
        
        doc.save(`Permiso-${permit.number}.pdf`);
    };

    if (loading) return <div className="p-8 text-center">Cargando detalles...</div>;
    if (!permit) return <div className="p-8 text-center text-red-500">Permiso no encontrado</div>;

    const statusStyle = getStatusInfo(permit.status);

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 md:px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => navigate(-1)} size="icon"><ArrowLeft className="h-5 w-5"/></Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            {permit.number}
                            <Badge className={`ml-2 ${statusStyle.bgColor} ${statusStyle.color}`}>
                                <statusStyle.icon size={14} className="mr-1" /> {statusStyle.text}
                            </Badge>
                        </h1>
                        <p className="text-xs text-slate-500">{permit.generalInfo?.planta || permit.plant} • {permit.generalInfo?.areaEspecifica || permit.area}</p>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    {permit.status === PermitStatus.APPROVED && (user.role === 'admin' || user.role === 'solicitante') && (
                        <Button onClick={() => changeStatus(PermitStatus.IN_PROGRESS)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <PlayCircle className="mr-2 h-4 w-4"/> Iniciar Ejecución
                        </Button>
                    )}
                    {permit.status === PermitStatus.IN_PROGRESS && (
                        <Button onClick={() => setClosureDialogOpen(true)} className="bg-slate-800 text-white hover:bg-slate-900">
                            <Lock className="mr-2 h-4 w-4"/> Cerrar Permiso
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleExportPDF}><FileDown className="mr-2 h-4 w-4"/> PDF</Button>
                </div>
            </div>

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                
                {/* General Info Card */}
                <Card>
                    <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Field label="Solicitante" value={permit.requesterName} />
                        <Field label="Empresa" value={permit.generalInfo?.empresa || permit.company} />
                        <Field label="Contrato" value={permit.generalInfo?.contrato || permit.contract} />
                        <Field label="Validez Desde" value={safeFormat(permit.generalInfo?.validFrom || permit.startDate, 'dd/MM/yyyy HH:mm')} />
                        <Field label="Validez Hasta" value={safeFormat(permit.generalInfo?.validUntil || permit.endDate, 'dd/MM/yyyy HH:mm')} />
                        <Field label="Tipos de Trabajo" value={getWorkTypesString(permit)} fullWidth />
                        <Field label="Descripción Tarea" value={permit.generalInfo?.workDescription || permit.description} fullWidth />
                    </CardContent>
                </Card>

                {/* Collapsible Sections (ATS & Annexes) */}
                <Collapsible defaultOpen>
                    <CollapsibleTrigger className="flex w-full items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm font-semibold text-slate-700">
                        <span className="flex items-center gap-2"><Shield size={18} className="text-blue-500"/> Análisis de Trabajo Seguro (ATS)</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="bg-white border-x border-b border-slate-200 rounded-b-lg p-6 space-y-4">
                        {/* ATS Content Mock - would map from real data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {permit.selectedHazards?.map((h: string) => (
                                 <div key={h} className="text-sm border p-2 rounded bg-slate-50">Peligro ID: {h}</div>
                             ))}
                             {permit.anexoATS?.peligros && Object.entries(permit.anexoATS.peligros).filter(([_,v]) => v === 'si').map(([k]) => (
                                 <div key={k} className="text-sm border p-2 rounded bg-slate-50 flex gap-2"><AlertTriangle size={14} className="text-amber-500 mt-0.5"/> {k}</div>
                             ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Anexo Alturas */}
                {permit.selectedWorkTypes?.alturas && permit.anexoAltura && (
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm font-semibold text-blue-800 hover:bg-blue-100 transition-colors">
                            <span className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-blue-600"/>
                                ANEXO 1 - Trabajo en Alturas
                            </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-white border-x border-b border-blue-200 rounded-b-lg p-6 space-y-6">
                            <Section title="Información General">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Altura Aproximada" value={`${permit.anexoAltura.alturaAproximada || 'N/A'} metros`} />
                                    <Field label="Tarea" value={permit.anexoAltura.tareaRealizar?.nombre} />
                                    <Field label="Descripción" value={permit.anexoAltura.tareaRealizar?.descripcion} fullWidth />
                                    <Field label="Contacto Emergencia" value={`${permit.anexoAltura.emergencia?.contacto || 'N/A'} - ${permit.anexoAltura.emergencia?.telefono || 'N/A'}`} />
                                </div>
                            </Section>

                            {permit.anexoAltura.aspectosSeguridad && (
                                <Section title="Aspectos de Seguridad Verificados" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoAltura.aspectosSeguridad).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoAltura.tipoEstructura && (
                                <Section title="Tipo de Estructura" className="mt-6">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(permit.anexoAltura.tipoEstructura).map(([key, value]) =>
                                            value ? (
                                                <span key={key}>
                                                    <Badge className="bg-blue-100 text-blue-800">{key}</Badge>
                                                </span>
                                            ) : null
                                        )}
                                    </div>
                                </Section>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Anexo Confinado */}
                {permit.selectedWorkTypes?.confinado && permit.anexoConfinado && (
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between bg-purple-50 p-4 rounded-lg border border-purple-200 shadow-sm font-semibold text-purple-800 hover:bg-purple-100 transition-colors">
                            <span className="flex items-center gap-2">
                                <Siren size={18} className="text-purple-600"/>
                                ANEXO 2 - Espacios Confinados
                            </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-white border-x border-b border-purple-200 rounded-b-lg p-6 space-y-6">
                            <Section title="Pruebas de Gases Iniciales">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Field label="LEL (0%)" value={permit.anexoConfinado.resultadosPruebasGases?.lel || 'N/A'} />
                                    <Field label="O2 (19.5-22%)" value={permit.anexoConfinado.resultadosPruebasGases?.o2 || 'N/A'} />
                                    <Field label="H2S (0-10 PPM)" value={permit.anexoConfinado.resultadosPruebasGases?.h2s || 'N/A'} />
                                    <Field label="CO (0-25 PPM)" value={permit.anexoConfinado.resultadosPruebasGases?.co || 'N/A'} />
                                </div>
                            </Section>

                            {permit.anexoConfinado.identificacionPeligros && (
                                <Section title="Identificación de Peligros" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoConfinado.identificacionPeligros).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoConfinado.precauciones && (
                                <Section title="Precauciones y Controles" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoConfinado.precauciones).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Anexo Energías */}
                {permit.selectedWorkTypes?.energia && permit.anexoEnergias && (
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm font-semibold text-yellow-800 hover:bg-yellow-100 transition-colors">
                            <span className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-yellow-600"/>
                                ANEXO 3 - Control de Energías
                            </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-white border-x border-b border-yellow-200 rounded-b-lg p-6 space-y-6">
                            {permit.anexoEnergias.energiasPeligrosas && (
                                <Section title="Tipos de Energía Identificados">
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(permit.anexoEnergias.energiasPeligrosas).map(([key, value]) =>
                                            value ? (
                                                <span key={key}>
                                                    <Badge className="bg-yellow-100 text-yellow-800">{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</Badge>
                                                </span>
                                            ) : null
                                        )}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoEnergias.trabajosEnCaliente && (
                                <Section title="Trabajos en Caliente" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoEnergias.trabajosEnCaliente).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoEnergias.procedimientoLOTO && (
                                <Section title="Procedimiento LOTO" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoEnergias.procedimientoLOTO).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoEnergias.sistemaElectrico && (
                                <Section title="Sistema Eléctrico" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Field label="Tensión Nominal" value={permit.anexoEnergias.sistemaElectrico.tensionNominal} />
                                        <Field label="Tensión Personal Expuesto" value={permit.anexoEnergias.sistemaElectrico.tensionPersonal} />
                                        <Field label="Distancia de Seguridad" value={permit.anexoEnergias.sistemaElectrico.distanciaSeguridad} />
                                    </div>
                                </Section>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Anexo Izaje */}
                {permit.selectedWorkTypes?.izaje && permit.anexoIzaje && (
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm font-semibold text-green-800 hover:bg-green-100 transition-colors">
                            <span className="flex items-center gap-2">
                                <Shield size={18} className="text-green-600"/>
                                ANEXO 4 - Izaje de Cargas
                            </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-white border-x border-b border-green-200 rounded-b-lg p-6 space-y-6">
                            <Section title="Información General">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Acción" value={Object.entries(permit.anexoIzaje.informacionGeneral.accion || {}).filter(([,v]) => v).map(([k]) => k).join(', ')} />
                                    <Field label="Peso de Carga" value={Object.entries(permit.anexoIzaje.informacionGeneral.pesoCarga || {}).filter(([,v]) => v).map(([k]) => k).join(', ')} />
                                    <Field label="Equipo a Utilizar" value={Object.entries(permit.anexoIzaje.informacionGeneral.equipoUtilizar || {}).filter(([,v]) => v).map(([k]) => k).join(', ')} />
                                    <Field label="Capacidad del Equipo" value={permit.anexoIzaje.informacionGeneral.capacidadEquipo} />
                                </div>
                            </Section>

                            {permit.anexoIzaje.aspectosRequeridos && (
                                <Section title="Aspectos Requeridos" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoIzaje.aspectosRequeridos).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoIzaje.precauciones && (
                                <Section title="Precauciones" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoIzaje.precauciones).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Anexo Excavaciones */}
                {permit.selectedWorkTypes?.excavacion && permit.anexoExcavaciones && (
                    <Collapsible defaultOpen={false}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between bg-orange-50 p-4 rounded-lg border border-orange-200 shadow-sm font-semibold text-orange-800 hover:bg-orange-100 transition-colors">
                            <span className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-orange-600"/>
                                ANEXO 5 - Excavaciones
                            </span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="bg-white border-x border-b border-orange-200 rounded-b-lg p-6 space-y-6">
                            <Section title="Dimensiones de la Excavación">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Field label="Dimensiones" value={permit.anexoExcavaciones.informacionGeneral.dimensiones} />
                                    <Field label="Profundidad" value={permit.anexoExcavaciones.informacionGeneral.profundidad} />
                                    <Field label="Ancho" value={permit.anexoExcavaciones.informacionGeneral.ancho} />
                                    <Field label="Largo" value={permit.anexoExcavaciones.informacionGeneral.largo} />
                                </div>
                            </Section>

                            {permit.anexoExcavaciones.aspectosRequeridos && (
                                <Section title="Aspectos Requeridos" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoExcavaciones.aspectosRequeridos).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {permit.anexoExcavaciones.precauciones && (
                                <Section title="Precauciones" className="mt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {Object.entries(permit.anexoExcavaciones.precauciones).map(([key, value]) => (
                                            <RadioCheck key={key} label={key.replace(/([A-Z])/g, ' $1').toUpperCase()} value={value} />
                                        ))}
                                    </div>
                                </Section>
                            )}
                        </CollapsibleContent>
                    </Collapsible>
                )}

                {/* Workers Table */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Users className="text-blue-500"/> Personal Autorizado</CardTitle></CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
                                <tr>
                                    <th className="p-3">Nombre</th>
                                    <th className="p-3">Rol</th>
                                    <th className="p-3">Seguridad Social</th>
                                    <th className="p-3">Firma Apertura</th>
                                    <th className="p-3">Firma Cierre</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {permit.workers?.map((w, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 font-medium">{w.name} <div className="text-xs text-slate-400">{w.id}</div></td>
                                        <td className="p-3">{w.role}</td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                {w.socialSecurity?.eps && <Badge variant="secondary">EPS</Badge>}
                                                {w.socialSecurity?.arl && <Badge variant="secondary">ARL</Badge>}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            {w.firmaApertura ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12}/> Firmado</span> : (
                                                <Button size="sm" variant="outline" onClick={() => {
                                                    setSigningContext({ type: 'worker', role: 'apertura', index: idx });
                                                    setWorkerSigDialogOpen(true);
                                                }}>Firmar</Button>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {w.firmaCierre ? <span className="text-green-600 text-xs font-bold flex items-center gap-1"><Check size={12}/> Firmado</span> : (
                                                 (permit.status === PermitStatus.IN_PROGRESS || permit.status === PermitStatus.SUSPENDED) && (
                                                    <Button size="sm" variant="outline" onClick={() => {
                                                        setSigningContext({ type: 'worker', role: 'cierre', index: idx });
                                                        setWorkerSigDialogOpen(true);
                                                    }}>Firmar</Button>
                                                 )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Approvals Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['solicitante', 'autorizante', 'mantenimiento', 'lider_sst'].map((role) => {
                        const approval = permit.approvals?.[role as keyof typeof permit.approvals];
                        const signed = approval?.status === 'aprobado';
                        const { can, reason } = canSign(role);
                        
                        // Skip unneeded roles
                        if (role === 'mantenimiento' && !permit.selectedWorkTypes?.energia) return null;
                        if (role === 'lider_sst' && !permit.isSSTSignatureRequired) return null;

                        return (
                            <Card key={role} className={`border-t-4 ${signed ? 'border-t-green-500' : 'border-t-amber-500'}`}>
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-bold uppercase text-slate-500 mb-2">{role.replace('_', ' ')}</h4>
                                    {signed ? (
                                        <div className="space-y-1">
                                            <p className="font-bold text-slate-800 text-sm">{approval.userName}</p>
                                            <p className="text-xs text-slate-400">{safeFormat(approval.signedAt, 'dd/MM/yy HH:mm')}</p>
                                            <div className="mt-2 bg-green-50 text-green-700 text-xs py-1 px-2 rounded inline-flex items-center gap-1">
                                                <CheckCircle size={12}/> Firmado
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-slate-400 italic mb-3">Pendiente de firma</p>
                                            {can ? (
                                                <Button className="w-full" size="sm" onClick={() => {
                                                    setSigningContext({ role, type: 'approval' });
                                                    setSigDialogOpen(true);
                                                }}>Firmar Apertura</Button>
                                            ) : (
                                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">{reason}</div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

            </main>

            {/* --- DIALOGS --- */}

            {/* Signature Dialog */}
            <Dialog open={sigDialogOpen} onClose={() => setSigDialogOpen(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Registrar Firma de Aprobación</h3>
                    <p className="text-sm text-slate-500 mb-4">Al firmar, usted valida las condiciones de seguridad y autoriza el trabajo.</p>
                    <SignaturePad onSave={handleSign} isSaving={isSigning} />
                    <div className="mt-4 flex justify-end">
                        <Button variant="ghost" onClick={() => setSigDialogOpen(false)}>Cancelar</Button>
                    </div>
                </div>
            </Dialog>

            {/* Worker Signature Dialog */}
            <Dialog open={workerSigDialogOpen} onClose={() => setWorkerSigDialogOpen(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Firma de Trabajador</h3>
                    <p className="text-sm text-slate-500 mb-4">Certifico haber recibido la instrucción y conocer los riesgos.</p>
                    <SignaturePad onSave={handleSign} isSaving={isSigning} />
                    <div className="mt-4 flex justify-end">
                        <Button variant="ghost" onClick={() => setWorkerSigDialogOpen(false)}>Cancelar</Button>
                    </div>
                </div>
            </Dialog>

             {/* Closure Dialog */}
             <Dialog open={closureDialogOpen} onClose={() => setClosureDialogOpen(false)}>
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4">Cierre del Permiso</h3>
                    
                    <div className="space-y-6">
                        {/* Responsable Closure */}
                        <div className="border p-4 rounded bg-slate-50">
                            <h5 className="font-bold text-sm mb-2">Responsable del Trabajo</h5>
                            {permit?.closure?.responsable?.firma ? (
                                <div className="text-green-600 text-sm font-bold flex items-center gap-2"><CheckCircle size={16}/> Firmado por {permit.closure.responsable.nombre}</div>
                            ) : (
                                <Button size="sm" onClick={() => {
                                    setSigningContext({ role: 'responsable', type: 'closure' });
                                    setSigDialogOpen(true);
                                }}>Firmar Cierre</Button>
                            )}
                        </div>

                         {/* Authority Closure */}
                         <div className="border p-4 rounded bg-slate-50">
                            <h5 className="font-bold text-sm mb-2">Autoridad del Área</h5>
                            {permit?.closure?.autoridad?.firma ? (
                                <div className="text-green-600 text-sm font-bold flex items-center gap-2"><CheckCircle size={16}/> Firmado por {permit.closure.autoridad.nombre}</div>
                            ) : (
                                <Button size="sm" disabled={!permit?.closure?.responsable?.firma} onClick={() => {
                                    setSigningContext({ role: 'autoridad', type: 'closure' });
                                    setSigDialogOpen(true);
                                }}>Firmar Cierre</Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setClosureDialogOpen(false)}>Cancelar</Button>
                        <Button 
                            disabled={!permit?.closure?.responsable?.firma || !permit?.closure?.autoridad?.firma}
                            onClick={() => changeStatus(PermitStatus.CLOSED)}
                        >
                            Confirmar Cierre Final
                        </Button>
                    </div>
                </div>
            </Dialog>

        </div>
    );
};
