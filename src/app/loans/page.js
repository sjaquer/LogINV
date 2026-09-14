'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLoans } from '@/hooks/useLoans';
import { useProductos } from '@/hooks/useFirestore';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import RouteGuard from '@/components/ui/RouteGuard';
import LoanFormModal from './components/LoanFormModal';
import LoanCard from './components/LoanCard';
import ReturnModal from './components/ReturnModal';
import { formatDate } from '@/lib/utils';
import {
    Handshake, Plus, Clock, CheckCircle, AlertTriangle, Filter,
} from 'lucide-react';

export default function LoansPage() {
    const { 
        prestamos, prestamosActivos, prestamosVencidos, 
        loading, crearPrestamo, registrarDevolucion, eliminarPrestamo 
    } = useLoans();
    const { productos } = useProductos();
    const { user } = useAuth();
    const { ubicacion } = useLocation();
    const { setHideBottomNav } = useSidebar();
    const userName = user?.nombre || 'Usuario';

    const [tab, setTab] = useState('activos');
    const [showForm, setShowForm] = useState(false);
    const [returnLoan, setReturnLoan] = useState(null);

    useEffect(() => {
        setHideBottomNav(!!showForm || !!returnLoan);
        return () => setHideBottomNav(false);
    }, [showForm, returnLoan, setHideBottomNav]);

    const filteredLoans = useMemo(() => {
        let list = prestamos;
        if (tab === 'activos') list = prestamosActivos;
        else if (tab === 'vencidos') list = prestamosVencidos;
        else if (tab === 'historial') list = prestamos.filter(p => p.estado === 'devuelto');
        return list;
    }, [prestamos, prestamosActivos, prestamosVencidos, tab]);

    const handleCreateLoan = useCallback(async (data) => {
        await crearPrestamo({
            ...data,
            created_by: userName,
        });
    }, [crearPrestamo, userName]);

    const handleReturn = useCallback(async (notas) => {
        if (!returnLoan) return;
        await registrarDevolucion(returnLoan.id, notas);
        setReturnLoan(null);
    }, [returnLoan, registrarDevolucion]);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    return (
        <RouteGuard>
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Préstamos" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <Handshake size={18} className="text-blue-500" /> Control de préstamos
                    </h3>
                    <p className="text-xs text-slate-500">Registra y gestiona los préstamos de equipos e ítems del inventario.</p>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
                    <button
                        onClick={() => setTab('activos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'activos' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <Clock size={20} /> Activos ({prestamosActivos.length})
                    </button>
                    <button
                        onClick={() => setTab('vencidos')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'vencidos' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <AlertTriangle size={20} /> Vencidos ({prestamosVencidos.length})
                    </button>
                    <button
                        onClick={() => setTab('historial')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm sm:text-base font-semibold transition-all ${tab === 'historial' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                        <CheckCircle size={20} /> Historial
                    </button>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                    >
                        <Plus size={20} /> Nuevo préstamo
                    </button>
                </div>

                {/* Loans list */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-32 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredLoans.length === 0 ? (
                    <EmptyState 
                        icon={Handshake} 
                        title={tab === 'activos' ? 'No hay préstamos activos' : tab === 'vencidos' ? 'No hay préstamos vencidos' : 'Sin historial'} 
                        subtitle="Los préstamos aparecerán aquí" 
                    />
                ) : (
                    <div className="space-y-3">
                        {filteredLoans.map(loan => (
                            <LoanCard
                                key={loan.id}
                                loan={loan}
                                onReturn={tab !== 'historial' ? () => setReturnLoan(loan) : null}
                                onDelete={eliminarPrestamo}
                            />
                        ))}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* Modals */}
            {showForm && (
                <LoanFormModal
                    productos={productos}
                    ubicacion={ubicacion}
                    onClose={() => setShowForm(false)}
                    onSave={handleCreateLoan}
                />
            )}
            {returnLoan && (
                <ReturnModal
                    loan={returnLoan}
                    onClose={() => setReturnLoan(null)}
                    onConfirm={handleReturn}
                />
            )}
        </div>
        </RouteGuard>
    );
}
