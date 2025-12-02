
import React, { useState, useRef, useEffect } from 'react';
import { User, WorkerDetail } from '../types';
import { dbService } from '../services/dbService';
import { useNavigate } from 'react-router-dom';
import { 
  PLANTS, PROCESSES, CONTRACTS, COMPANIES, 
  HAZARD_MASTER_LIST, VERIFICATION_SECTIONS, 
  PPE_LIST, EMERGENCY_CHECKS, ATS_JUSTIFICATIONS 
} from '../constants';
import { ArrowRight, ArrowLeft, Check, Search, Trash2, Plus, Info, AlertTriangle, Save, ShieldCheck, X, PenTool, Eraser } from 'lucide-react';

// --- STYLES & SUB COMPONENTS ---
const labelClass = "block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wide ml-1";
const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400";

const Checkbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-teal-50 border-teal-500 text-teal-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
        <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center ${checked ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-300'}`}>
            {checked && <Check size={10} className="text-white"/>}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        <span className="text-xs font-bold uppercase select-none">{label}</span>
    </label>
);

const Badge = ({ children, color }: { children?: React.ReactNode, color: 'blue' | 'purple' | 'emerald' | 'slate' }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-800 border-blue-200',
        purple: 'bg-purple-100 text-purple-800 border-purple-200',
        emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${colors[color]}`}>{children}</span>
}

const SignaturePadModal = ({ onClose, onSave }: { onClose: () => void, onSave: (data: string) => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);

    // Responsive Canvas Sizing
    useEffect(() => {
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                const { width } = containerRef.current.getBoundingClientRect();
                // Set actual canvas size to match display size for sharp rendering
                canvasRef.current.width = width;
                canvasRef.current.height = 200;
                
                // Re-context setup after resize
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = '#000';
                }
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        isDrawing.current = true;
        const { x, y } = getCoords(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { x, y } = getCoords(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        isDrawing.current = false;
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath(); // Reset path
    };

    const saveSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Registrar Firma</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                
                <div ref={containerRef} className="p-4 bg-slate-100 flex justify-center w-full">
                    <canvas 
                        ref={canvasRef}
                        className="bg-white border border-slate-300 rounded shadow-sm touch-none cursor-crosshair w-full"
                        style={{ height: '200px' }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                </div>

                <div className="p-4 space-y-4">
                    <div className="flex gap-3 items-start p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <input type="checkbox" className="mt-1 w-4 h-4 text-blue-600 rounded shrink-0" defaultChecked disabled />
                        <p className="text-[10px] text-blue-800 leading-tight text-justify">
                            Al firmar, acepto que he recibido la instrucción del trabajo, comprendo los peligros y controles, y autorizo el tratamiento de mis datos personales para fines de seguridad y salud en el trabajo, conforme a la política de la organización.
                        </p>
                    </div>

                    <div className="flex justify-between gap-3">
                        <button onClick={clearCanvas} className="flex-1 py-3 border border-slate-300 rounded-lg text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 active:bg-slate-100">
                            <Eraser size={16} /> Limpiar
                        </button>
                        <button onClick={saveSignature} className="flex-1 py-3 bg-teal-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-teal-600 active:bg-teal-700 shadow-sm">
                            <Save size={16} /> Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface CreatePermitProps {
  user: User;
}

const steps = ['Info General', 'ATS Detallado', 'Verificación', 'EPP y Emergencia', 'Trabajadores', 'Confirmación'];

const WORKER_ROLES = ['Soldador', 'Electricista', 'Ayudante', 'Vigía', 'Mecánico', 'Ingeniero', 'Supervisor', 'Otro'];

export const CreatePermitWizard: React.FC<CreatePermitProps> = ({ user }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modals State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    area: '',
    plant: '',
    process: '',
    contract: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
    tools: '',
    workerCount: 0,
    
    // Executor
    executor: { name: '', cargo: '', company: '', scope: '' },

    meetingRequired: 'SI',
    atsVerified: 'SI',
    
    // Work Types
    workTypes: {
      altura: false, espaciosConfinados: false, energia: false,
      izaje: false, caliente: false, excavacion: false, general: false
    },
    
    // ATS
    atsJustification: '',
    selectedHazards: [] as string[],
    additionalHazards: [] as { hazard: string; control: string }[],
    
    // Verification Matrix
    verificationMatrix: {} as Record<string, string>, // key -> SI/NO/NA
    
    // PPE
    ppe: {} as Record<string, any>,
    
    // Emergency
    emergencyChecks: {} as Record<string, string>,
    
    // Workers
    workers: [] as WorkerDetail[]
  });

  // Temporary state for adding a worker
  const [newWorker, setNewWorker] = useState<WorkerDetail>({
      id: '', name: '', role: '',
      aptitude: { tec: false, tsa: false },
      training: { tec: false, tsa: false, otro: false, otroDesc: '' },
      socialSecurity: { eps: false, arl: false, pension: false },
      signatureOpen: undefined
  });

  const handleNext = () => {
    if (currentStep === 0) {
        if (!formData.startDate || !formData.endDate) return alert("Fechas requeridas");
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return alert("La duración máxima es de 7 días");
        if (end <= start) return alert("La fecha fin debe ser posterior a la fecha inicio");
        if (!formData.description || !formData.area) return alert("Campos obligatorios faltantes (Descripción, Área)");
    }
    if (currentStep === 4 && formData.workers.length === 0) {
        return alert("Debe agregar al menos un trabajador autorizado.");
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
      window.scrollTo(0, 0);
  };

  const openWorkerModal = () => {
      setNewWorker({
        id: '', name: '', role: '',
        aptitude: { tec: false, tsa: false },
        training: { tec: false, tsa: false, otro: false, otroDesc: '' },
        socialSecurity: { eps: false, arl: false, pension: false },
        signatureOpen: undefined
      });
      setIsWorkerModalOpen(true);
  };

  const saveWorker = () => {
      if (!newWorker.name || !newWorker.id || !newWorker.role) return alert("Complete los campos obligatorios (Nombre, Cédula, Rol)");
      if (!newWorker.signatureOpen) return alert("La firma del trabajador es obligatoria para el registro.");
      
      if (formData.workers.some(w => w.id === newWorker.id)) {
          return alert("Ya existe un trabajador con esta cédula en la lista.");
      }

      setFormData(prev => ({
          ...prev, 
          workers: [...prev.workers, newWorker]
      }));
      setIsWorkerModalOpen(false);
  };

  const removeWorker = (id: string) => {
    setFormData(prev => ({...prev, workers: prev.workers.filter(w => w.id !== id)}));
  };

  const handleSignatureSave = (dataUrl: string) => {
      setNewWorker(prev => ({...prev, signatureOpen: dataUrl}));
      setIsSigModalOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const id = await dbService.createPermit(formData, user.id, user.name);
      await dbService.signPermit(id, { id: user.id, name: user.name, role: user.role });
      navigate(`/permits/${id}`);
    } catch (error) {
      console.error(error);
      alert('Error al crear el permiso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 lg:pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-2">
        <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">Crear Nuevo Permiso</h1>
            <p className="text-slate-500 text-xs md:text-sm">Complete el asistente para generar un permiso de trabajo seguro.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <div className="flex items-center min-w-[600px] lg:min-w-0">
            {steps.map((step, index) => (
                <div key={step} className={`flex items-center ${index !== steps.length - 1 ? 'flex-1' : ''}`}>
                    <div className={`flex flex-col items-center px-2 md:px-4 relative group cursor-default`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all duration-300 ${
                            index === currentStep ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' :
                            index < currentStep ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                            {index < currentStep ? <Check size={16} /> : index + 1}
                        </div>
                        <span className={`text-[10px] md:text-xs font-bold whitespace-nowrap ${index === currentStep ? 'text-blue-700' : 'text-slate-400'}`}>{step}</span>
                    </div>
                    {index !== steps.length - 1 && (
                         <div className={`h-1 flex-1 mx-2 rounded-full min-w-[20px] ${index < currentStep ? 'bg-green-500' : 'bg-slate-100'}`}></div>
                    )}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 md:p-8 lg:p-10 relative">
        
        {/* STEP 1: INFO GENERAL */}
        {currentStep === 0 && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* ... Existing Step 1 Content ... */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex gap-3 text-amber-800 text-sm shadow-sm">
                <Info size={20} className="shrink-0 mt-0.5" />
                <p className="font-medium">El permiso queda bajo custodia de Quién Autoriza (Supervisor/Jefe Área).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Área o Equipo Específico</label>
                    <input type="text" className={inputClass} placeholder="Ej: Caldera B, Silo 5..." value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
                </div>
                
                <div>
                    <label className={labelClass}>Planta</label>
                    <div className="relative">
                        <select className={inputClass} value={formData.plant} onChange={e => setFormData({...formData, plant: e.target.value})}>
                            <option value="">Seleccione...</option>
                            {PLANTS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Proceso</label>
                    <select className={inputClass} value={formData.process} onChange={e => setFormData({...formData, process: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Empresa</label>
                    <select className={inputClass} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {COMPANIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Contrato</label>
                    <select className={inputClass} value={formData.contract} onChange={e => setFormData({...formData, contract: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {CONTRACTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                
                <div>
                    <label className={labelClass}>Fecha Inicio</label>
                    <input type="datetime-local" className={inputClass} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                    <label className={labelClass}>Fecha Fin (Max 7 días)</label>
                    <input type="datetime-local" className={inputClass} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Descripción de la Tarea - ALCANCE</label>
                    <textarea className={inputClass} rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describa detalladamente qué se va a realizar y qué NO está incluido..." />
                </div>
                
                 <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <label className={labelClass}>Equipos y/o Herramientas</label>
                    <input type="text" className={inputClass} placeholder="Ej: Taladro, Pulidora, Andamio Certificado..." value={formData.tools} onChange={e => setFormData({...formData, tools: e.target.value})} />
                </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Check className="text-blue-500" size={20}/> Listas de Verificación Complementarias</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(formData.workTypes).map(key => (
                        <label key={key} className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                            (formData.workTypes as any)[key] 
                            ? 'bg-blue-50 border-blue-500 shadow-sm' 
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${(formData.workTypes as any)[key] ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                {(formData.workTypes as any)[key] && <Check size={12} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={(formData.workTypes as any)[key]} 
                                onChange={() => setFormData(prev => ({
                                    ...prev, 
                                    workTypes: { ...prev.workTypes, [key]: !(prev.workTypes as any)[key] }
                                }))} 
                            />
                            <span className={`text-sm font-semibold capitalize ${(formData.workTypes as any)[key] ? 'text-blue-800' : 'text-slate-600'}`}>
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

             <div className="border-t border-slate-100 pt-6 bg-slate-50/50 p-4 -mx-4 md:-mx-8 md:-mb-8 md:p-8 rounded-b-xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Responsable del Trabajo / Ejecutor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>Nombre Completo</label><input type="text" className={inputClass} value={formData.executor.name} onChange={e => setFormData({...formData, executor: {...formData.executor, name: e.target.value}})} /></div>
                    <div><label className={labelClass}>Cargo</label><input type="text" className={inputClass} value={formData.executor.cargo} onChange={e => setFormData({...formData, executor: {...formData.executor, cargo: e.target.value}})} /></div>
                    <div><label className={labelClass}>Compañía</label><input type="text" className={inputClass} value={formData.executor.company} onChange={e => setFormData({...formData, executor: {...formData.executor, company: e.target.value}})} /></div>
                    <div><label className={labelClass}>Alcance Específico</label><input type="text" className={inputClass} value={formData.executor.scope} onChange={e => setFormData({...formData, executor: {...formData.executor, scope: e.target.value}})} /></div>
                </div>
            </div>
          </div>
        )}

        {/* STEP 2: ATS DETALLADO */}
        {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Identificación de Peligros, Riesgos y Controles</h2>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex gap-3">
                <Info className="text-blue-600 mt-0.5 shrink-0" size={20} />
                <p className="text-sm text-blue-900">Seleccione "SI" para los peligros involucrados. El control se mostrará automáticamente y debe ser cumplido íntegramente.</p>
            </div>
            
            <div className="space-y-6">
                {HAZARD_MASTER_LIST.map((category) => (
                    <div key={category.category} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-700 text-sm uppercase tracking-wide">{category.category}</span>
                        </div>
                        <div className="divide-y divide-slate-100 bg-white">
                            {category.items.map(item => {
                                const isSelected = formData.selectedHazards.includes(item.id);
                                return (
                                <div key={item.id} className={`p-4 transition-colors ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <div className="pt-1">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300 shrink-0"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                    if(e.target.checked) setFormData({...formData, selectedHazards: [...formData.selectedHazards, item.id]});
                                                    else setFormData({...formData, selectedHazards: formData.selectedHazards.filter(i => i !== item.id)});
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={`block text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                                                {item.hazard}
                                            </span>
                                            {isSelected && (
                                                <div className="mt-2 p-3 bg-green-50 text-green-900 text-xs rounded border border-green-200 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                                    <Check size={14} className="mt-0.5 shrink-0" />
                                                    <div className="break-words"><strong className="font-bold mr-1">CONTROL:</strong> {item.control}</div>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )})}
                        </div>
                    </div>
                ))}
                
                {/* Additional Hazards */}
                <div className="border border-slate-200 rounded-xl p-4 md:p-6 bg-slate-50/50">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                        <h4 className="font-bold text-slate-700">Peligros Adicionales</h4>
                        <button 
                            onClick={() => setFormData(p => ({...p, additionalHazards: [...p.additionalHazards, {hazard: '', control: ''}]}))}
                            className="text-xs font-bold flex items-center justify-center gap-1 bg-white border border-slate-300 px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-blue-600 transition-colors shadow-sm w-full sm:w-auto"
                        >
                            <Plus size={14}/> Agregar Fila
                        </button>
                    </div>
                    <div className="space-y-3">
                        {formData.additionalHazards.map((h, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row gap-2">
                                <input type="text" placeholder="Descripción del Peligro" className={`${inputClass} bg-white`}
                                    value={h.hazard} 
                                    onChange={e => {
                                        const newHazards = [...formData.additionalHazards];
                                        newHazards[idx].hazard = e.target.value;
                                        setFormData({...formData, additionalHazards: newHazards});
                                    }}
                                />
                                <input type="text" placeholder="Medida de Control" className={`${inputClass} bg-white`}
                                    value={h.control} 
                                    onChange={e => {
                                        const newHazards = [...formData.additionalHazards];
                                        newHazards[idx].control = e.target.value;
                                        setFormData({...formData, additionalHazards: newHazards});
                                    }}
                                />
                                <button onClick={() => {
                                    const newHazards = formData.additionalHazards.filter((_, i) => i !== idx);
                                    setFormData({...formData, additionalHazards: newHazards});
                                }} className="text-red-500 hover:bg-red-50 p-2 rounded self-end sm:self-auto"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {formData.additionalHazards.length === 0 && <p className="text-xs text-slate-400 italic">No se han agregado peligros adicionales.</p>}
                    </div>
                </div>

                <div className="mt-4">
                     <label className={labelClass}>Justificación para el uso del ATS</label>
                     <select className={inputClass} value={formData.atsJustification} onChange={e => setFormData({...formData, atsJustification: e.target.value})}>
                        <option value="">Seleccione...</option>
                        {ATS_JUSTIFICATIONS.map(j => <option key={j} value={j}>{j}</option>)}
                     </select>
                </div>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFICACIÓN */}
        {currentStep === 2 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Verificación de Peligros Asociados</h2>
                <p className="text-sm text-slate-500">Valide en sitio si existen los siguientes peligros.</p>
                
                <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-4 border-b font-bold">Peligro</th>
                                    <th className="p-4 border-b text-center w-16">SI</th>
                                    <th className="p-4 border-b text-center w-16">NO</th>
                                    <th className="p-4 border-b text-center w-16">N/A</th>
                                </tr>
                            </thead>
                            <tbody>
                                {VERIFICATION_SECTIONS.map((section) => (
                                    <React.Fragment key={section.name}>
                                        <tr className="bg-slate-50/80">
                                            <td colSpan={4} className="px-4 py-2 font-bold text-slate-800 text-[10px] uppercase tracking-wider border-t border-b bg-slate-100/50">{section.name}</td>
                                        </tr>
                                        {section.items.map(hazard => (
                                            <tr key={hazard} className="hover:bg-slate-50 border-b border-slate-100 last:border-0">
                                                <td className="p-3 pl-4 font-medium text-slate-700">{hazard}</td>
                                                {['SI', 'NO', 'N/A'].map(opt => (
                                                    <td key={opt} className="p-2 text-center border-l border-slate-50">
                                                        <label className="flex items-center justify-center w-full h-full cursor-pointer py-1">
                                                            <input 
                                                                type="radio" 
                                                                name={`haz_${hazard}`}
                                                                checked={formData.verificationMatrix[hazard] === opt}
                                                                onChange={() => setFormData(prev => ({
                                                                    ...prev, 
                                                                    verificationMatrix: { ...prev.verificationMatrix, [hazard]: opt }
                                                                }))}
                                                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                            />
                                                        </label>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 4: EPP */}
        {currentStep === 3 && (
             <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <ShieldCheck className="text-blue-500"/>
                        Equipos de Protección Personal (EPP)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {PPE_LIST.map((item) => (
                            <div key={item.key} className="flex flex-col border-b border-slate-100 pb-3">
                                <span className="text-sm font-semibold text-slate-700 mb-3">{item.label}</span>
                                {item.type === 'bool' ? (
                                    <div className="flex gap-4">
                                        {['SI', 'NO', 'N/A'].map(opt => (
                                            <label key={opt} className={`flex items-center gap-2 text-xs cursor-pointer px-3 py-1.5 rounded border transition-all ${
                                                formData.ppe[item.key] === opt 
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                                                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                            }`}>
                                                <input 
                                                    type="radio" 
                                                    name={`ppe_${item.key}`}
                                                    checked={formData.ppe[item.key] === opt}
                                                    onChange={() => setFormData(prev => ({
                                                        ...prev, ppe: { ...prev.ppe, [item.key]: opt }
                                                    }))}
                                                    className="hidden"
                                                /> 
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <input 
                                        type="text" 
                                        className={inputClass}
                                        placeholder="Especificar..."
                                        value={formData.ppe[item.key] || ''}
                                        onChange={e => setFormData(prev => ({
                                            ...prev, ppe: { ...prev.ppe, [item.key]: e.target.value }
                                        }))}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <AlertTriangle className="text-orange-500"/>
                        Notificaciones y Emergencias
                    </h2>
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                        {EMERGENCY_CHECKS.map((check) => (
                            <div key={check} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                                <span className="text-sm font-medium text-slate-700 flex-1">{check}</span>
                                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg shrink-0">
                                    {['SI', 'NO', 'N/A'].map(opt => (
                                        <label key={opt} className={`flex items-center gap-1 text-xs font-bold cursor-pointer px-3 py-1.5 rounded-md transition-all ${
                                            formData.emergencyChecks[check] === opt
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name={`emg_${check}`}
                                                className="hidden"
                                                checked={formData.emergencyChecks[check] === opt}
                                                onChange={() => setFormData(prev => ({
                                                    ...prev, emergencyChecks: { ...prev.emergencyChecks, [check]: opt }
                                                }))}
                                            /> {opt}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* STEP 5: TRABAJADORES (UPDATED) */}
        {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex flex-col sm:flex-row justify-between sm:items-end border-b pb-4 gap-4">
                     <h2 className="text-xl font-bold text-slate-800">Trabajadores Autorizados</h2>
                     <button onClick={openWorkerModal} className="bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-sm w-full sm:w-auto">
                        <Plus size={16} /> Agregar Trabajador
                     </button>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                    <Info size={20} className="shrink-0 mt-0.5" />
                    <p>Los trabajadores se deben agregar manualmente, y desde el mismo registro el trabajador debe poner o dibujar la firma de apertura.</p>
                </div>

                <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left min-w-[700px]">
                            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="p-4">Nombre</th>
                                    <th className="p-4">Cédula</th>
                                    <th className="p-4">Cargo/Rol</th>
                                    <th className="p-4">Certificados</th>
                                    <th className="p-4">Seguridad Social</th>
                                    <th className="p-4 text-center">Firma</th>
                                    <th className="p-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {formData.workers.map(w => (
                                    <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-900">{w.name}</td>
                                        <td className="p-4 text-slate-500 font-mono">{w.id}</td>
                                        <td className="p-4 text-slate-700">{w.role}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex gap-1 flex-wrap">
                                                    <span className="text-[10px] font-bold text-slate-400">APT:</span>
                                                    {w.aptitude.tec && <Badge color="blue">TEC</Badge>}
                                                    {w.aptitude.tsa && <Badge color="purple">TSA</Badge>}
                                                    {!w.aptitude.tec && !w.aptitude.tsa && <span className="text-slate-400">-</span>}
                                                </div>
                                                <div className="flex gap-1 flex-wrap">
                                                    <span className="text-[10px] font-bold text-slate-400">ENT:</span>
                                                    {w.training.tec && <Badge color="blue">TEC</Badge>}
                                                    {w.training.tsa && <Badge color="purple">TSA</Badge>}
                                                    {w.training.otro && <Badge color="slate">{w.training.otroDesc || 'Otro'}</Badge>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-1 flex-wrap text-[10px] font-medium text-slate-600">
                                                {w.socialSecurity.eps && <Badge color="emerald">EPS</Badge>}
                                                {w.socialSecurity.arl && <Badge color="emerald">ARL</Badge>}
                                                {w.socialSecurity.pension && <Badge color="emerald">PEN</Badge>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {w.signatureOpen ? (
                                                <div className="text-green-600 flex flex-col items-center">
                                                    <PenTool size={16} />
                                                    <span className="text-[10px] font-bold">Firmado</span>
                                                </div>
                                            ) : (
                                                <span className="text-red-400 text-[10px]">Pendiente</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => removeWorker(w.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {formData.workers.length === 0 && (
                                    <tr><td colSpan={7} className="p-10 text-center text-slate-400 italic">No se han agregado trabajadores.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* STEP 6: REVIEW */}
        {currentStep === 5 && (
             <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Confirmación y Firma de Apertura</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-700 uppercase text-xs tracking-wider border-b pb-2">Resumen Operativo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="col-span-1 sm:col-span-2">
                            <p className="text-xs text-slate-400 font-bold uppercase">Tarea</p>
                            <p className="font-medium text-slate-800 break-words">{formData.description}</p>
                        </div>
                        <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Ubicación</p>
                            <p className="font-medium text-slate-800">{formData.area} ({formData.plant})</p>
                        </div>
                        <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Fechas</p>
                            <p className="font-medium text-slate-800">{new Date(formData.startDate).toLocaleDateString()} - {new Date(formData.endDate).toLocaleDateString()}</p>
                        </div>
                         <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Peligros Identificados</p>
                            <p className="font-bold text-red-600 bg-red-50 inline-block px-2 py-0.5 rounded border border-red-100">{formData.selectedHazards.length} Riesgos</p>
                        </div>
                        <div>
                             <p className="text-xs text-slate-400 font-bold uppercase">Personal</p>
                            <p className="font-medium text-slate-800">{formData.workers.length} Trabajadores</p>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex flex-col justify-center">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                            <Check size={24} />
                        </div>
                        <div className="text-sm text-blue-900">
                            <p className="font-bold text-lg mb-2">Declaración del Solicitante</p>
                            <p className="mb-2 leading-relaxed opacity-80">Manifiesto que he verificado las condiciones, validado los riesgos y que la información aquí contenida es veraz.</p>
                            <p className="leading-relaxed opacity-80">Asumo el compromiso de cumplir con las orientaciones de seguridad contenidas en este documento.</p>
                        </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-blue-200">
                        <p className="text-xs text-blue-800 uppercase font-bold mb-1">Firmado Digitalmente por:</p>
                        <p className="text-lg font-bold text-blue-900 break-words">{user.name}</p>
                        <p className="text-xs text-blue-700">{user.email}</p>
                        <p className="text-[10px] text-blue-500 mt-1">{new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col-reverse md:flex-row justify-between gap-4">
            <button 
                onClick={handlePrev}
                disabled={currentStep === 0 || isSubmitting}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-colors w-full md:w-auto ${currentStep === 0 ? 'text-slate-300 cursor-not-allowed hidden md:flex' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 md:border-transparent'}`}
            >
                <ArrowLeft size={18} />
                Anterior
            </button>

            {currentStep === steps.length - 1 ? (
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-green-200 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 w-full md:w-auto"
                >
                    {isSubmitting ? 'Procesando...' : 'Firmar y Generar Permiso'}
                    {!isSubmitting && <Save size={18} />}
                </button>
            ) : (
                <button 
                    onClick={handleNext}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md hover:shadow-blue-200 transition-all w-full md:w-auto"
                >
                    Siguiente
                    <ArrowRight size={18} />
                </button>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Worker Form Modal */}
      {isWorkerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                      <h3 className="font-bold text-lg text-slate-800">Agregar Trabajador</h3>
                      <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      <div>
                          <label className={labelClass}>Nombres y Apellidos</label>
                          <input type="text" className={inputClass} value={newWorker.name} onChange={e => setNewWorker({...newWorker, name: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>Cédula</label>
                          <input type="text" className={inputClass} value={newWorker.id} onChange={e => setNewWorker({...newWorker, id: e.target.value})} />
                      </div>
                      <div>
                          <label className={labelClass}>Cargo/Rol</label>
                          <select className={inputClass} value={newWorker.role} onChange={e => setNewWorker({...newWorker, role: e.target.value})}>
                              <option value="">Seleccione...</option>
                              {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                      </div>

                      <div className="space-y-2">
                          <label className={labelClass}>Certificado Aptitud Médica</label>
                          <div className="flex gap-4">
                              <Checkbox label="TEC" checked={newWorker.aptitude.tec} onChange={() => setNewWorker({...newWorker, aptitude: {...newWorker.aptitude, tec: !newWorker.aptitude.tec}})} />
                              <Checkbox label="TSA" checked={newWorker.aptitude.tsa} onChange={() => setNewWorker({...newWorker, aptitude: {...newWorker.aptitude, tsa: !newWorker.aptitude.tsa}})} />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className={labelClass}>Entrenamiento / Capacitación</label>
                          <div className="flex flex-wrap gap-4">
                              <Checkbox label="TEC" checked={newWorker.training.tec} onChange={() => setNewWorker({...newWorker, training: {...newWorker.training, tec: !newWorker.training.tec}})} />
                              <Checkbox label="TSA" checked={newWorker.training.tsa} onChange={() => setNewWorker({...newWorker, training: {...newWorker.training, tsa: !newWorker.training.tsa}})} />
                              <Checkbox label="Otro" checked={newWorker.training.otro} onChange={() => setNewWorker({...newWorker, training: {...newWorker.training, otro: !newWorker.training.otro}})} />
                          </div>
                          {newWorker.training.otro && (
                              <input 
                                  type="text" 
                                  className={`${inputClass} mt-2`} 
                                  placeholder="Especificar otro entrenamiento..."
                                  value={newWorker.training.otroDesc}
                                  onChange={e => setNewWorker({...newWorker, training: {...newWorker.training, otroDesc: e.target.value}})}
                              />
                          )}
                      </div>

                      <div className="space-y-2">
                          <label className={labelClass}>Afiliación a Seguridad Social</label>
                          <div className="flex gap-4">
                              <Checkbox label="EPS" checked={newWorker.socialSecurity.eps} onChange={() => setNewWorker({...newWorker, socialSecurity: {...newWorker.socialSecurity, eps: !newWorker.socialSecurity.eps}})} />
                              <Checkbox label="ARL" checked={newWorker.socialSecurity.arl} onChange={() => setNewWorker({...newWorker, socialSecurity: {...newWorker.socialSecurity, arl: !newWorker.socialSecurity.arl}})} />
                              <Checkbox label="Pensiones" checked={newWorker.socialSecurity.pension} onChange={() => setNewWorker({...newWorker, socialSecurity: {...newWorker.socialSecurity, pension: !newWorker.socialSecurity.pension}})} />
                          </div>
                      </div>

                      <div className="pt-2">
                          <label className={labelClass}>Firma de Apertura</label>
                          <div 
                              onClick={() => setIsSigModalOpen(true)}
                              className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${newWorker.signatureOpen ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-300 hover:bg-slate-100'}`}
                          >
                              {newWorker.signatureOpen ? (
                                  <div className="flex flex-col items-center">
                                      <img src={newWorker.signatureOpen} alt="Firma" className="h-16 object-contain mb-2" />
                                      <span className="text-xs text-green-700 font-bold flex items-center gap-1"><Check size={12}/> Firma Registrada</span>
                                      <span className="text-[10px] text-slate-400 mt-1">Click para cambiar</span>
                                  </div>
                              ) : (
                                  <>
                                      <PenTool size={24} className="text-slate-400 mb-2" />
                                      <span className="text-sm font-medium text-slate-600">Registrar Firma</span>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="p-5 border-t bg-slate-50 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 z-10">
                      <button onClick={() => setIsWorkerModalOpen(false)} className="px-4 py-3 sm:py-2 text-slate-600 font-bold text-sm hover:bg-slate-200 rounded-lg w-full sm:w-auto">Cancelar</button>
                      <button onClick={saveWorker} className="px-6 py-3 sm:py-2 bg-teal-600 text-white font-bold text-sm rounded-lg hover:bg-teal-700 shadow-sm w-full sm:w-auto">Guardar Trabajador</button>
                  </div>
              </div>
          </div>
      )}

      {/* Signature Pad Modal */}
      {isSigModalOpen && (
          <SignaturePadModal 
              onClose={() => setIsSigModalOpen(false)} 
              onSave={handleSignatureSave} 
          />
      )}

    </div>
  );
};
