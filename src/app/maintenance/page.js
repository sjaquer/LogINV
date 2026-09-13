'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useMaintenance } from '@/hooks/useMaintenance';
import { useProductos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import MaintenanceFormModal from './components/MaintenanceFormModal';
import MaintenanceCard from './components/MaintenanceCard';
import {
    Wrench, Plus, Clock, Play, CheckCircle, AlertTriangle,
} from 'lucide-react';

export default function MaintenancePage() {
    const { 
        mantenimientos, mantenimientosProgramados, mantenimientosEnProgreso, 
        mantenimientosCompletados, mantenimientosVencidos,
        loading, crearMantenimiento, iniciarMantenimiento, completarMantenimiento, eliminarMantenimiento 
    } = useMaintenance();
    const { productos } = useProductos();
    const { user } = useAuth();
    const { setHideBottomNav } = useSidebar();
    const userName = user?.nombre || 'Usuario';

    const [tab, setTab] = useState('programados');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        setHideBottomNav(!!showForm);
        return () => setHideBottomNav(false);
    }, [showForm, setHideBottomNav]);

    const filteredMaintenance = useMemo(() => {
        if (tab === 'programados') return mantenimientosProgramados;
        if (tab === 'progreso') return mantenimientosEnProgreso;
        if (tab === 'completados') return mantenimientosCompletados;
        return mantenimientos;
    }, [mantenimientos, mantenimientosProgramados, mantenimientosEnProgreso, mantenimientosCompletados, tab]);

    const handleCreate = useCallback(async (data) => {
        await crearMantenimiento({
            ...data,
            created_by: userName,
        });
    }, [crearMantenimiento, userName]);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    return (
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Mantenimiento" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Wrench size={18} className="text-amber-500" /> Control de mantenimiento
                    </h3>
                    <p className="text-xs text-slate-500">Programa, gestiona y da seguimiento a mantenimientos de equipos e ítems.</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm overflow-x-auto">
                    <button
                        onClick={() => setTab('programados')}
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-semibold transition-all ${tab === 'programados' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Clock size={18} /> Programados ({mantenimientosProgramados.length})
                    </button>
                    <button
                        onClick={() => setTab('progreso')}
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-semibold transition-all ${tab === 'progreso' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Play size={18} /> En Progreso ({mantenimientosEnProgreso.length})
                    </button>
                    <button
                        onClick={() => setTab('completados')}
                        className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-semibold transition-all ${tab === 'completados' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <CheckCircle size={18} /> Completados ({mantenimientosCompletados.length})
                    </button>
                </div>

                {/* Alerts */}
                {mantenimientosVencidos.length > 0 && tab === 'programados' && (
                    <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertTriangle size={18} className="flex-shrink-0" />
                        <span>Tienes <strong>{mantenimientosVencidos.length}</strong> mantenimiento(s) vencido(s)</span>
                    </div>
                )}

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={20} /> Nuevo mantenimiento
                    </button>
                </div>

                {/* Maintenance list */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-32 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredMaintenance.length === 0 ? (
                    <EmptyState 
                        icon={Wrench} 
                        title={tab === 'programados' ? 'No hay mantenimientos programados' : tab === 'progreso' ? 'No hay mantenimientos en progreso' : 'No hay mantenimientos completados'} 
                        subtitle="Los mantenimientos aparecerán aquí" 
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredMaintenance.map(maint => (
                            <MaintenanceCard
                                key={maint.id}
                                maintenance={maint}
                                onStart={tab === 'programados' ? () => iniciarMantenimiento(maint.id) : null}
                                onComplete={tab === 'progreso' ? () => completarMantenimiento(maint.id) : null}
                                onDelete={eliminarMantenimiento}
                            />
                        ))}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* Modal */}
            {showForm && (
                <MaintenanceFormModal
                    productos={productos}
                    onClose={() => setShowForm(false)}
                    onSave={handleCreate}
                />
            )}
        </div>
    );
}
