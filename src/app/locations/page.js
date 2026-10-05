'use client';
import { useState, useCallback, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useLocations } from '@/hooks/useLocations';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { EmptyState } from '@/components/ui/SharedComponents';
import PullToRefresh from '@/components/ui/PullToRefresh';
import RouteGuard from '@/components/ui/RouteGuard';
import LocationFormModal from './components/LocationFormModal';
import LocationCard from './components/LocationCard';
import {
    MapPin, Plus, Building2, Search, CheckCircle2, ShieldAlert
} from 'lucide-react';

export default function LocationsPage() {
    const { ubicaciones, loading, crearUbicacion, actualizarUbicacion, eliminarUbicacion, toggleUbicacion } = useLocations();
    const { user } = useAuth();
    const { setHideBottomNav } = useSidebar();
    const role = user?.rol || 'voluntario';

    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pisoFilter, setPisoFilter] = useState('TODOS');

    useEffect(() => {
        setHideBottomNav(!!showForm);
        return () => setHideBottomNav(false);
    }, [showForm, setHideBottomNav]);

    const handleSave = useCallback(async (data, id) => {
        if (id) {
            await actualizarUbicacion(id, data);
        } else {
            await crearUbicacion(data);
        }
    }, [crearUbicacion, actualizarUbicacion]);

    const handleEdit = useCallback((ubicacion) => {
        setEditingLocation(ubicacion);
        setShowForm(true);
    }, []);

    const handleRefresh = useCallback(() => {
        return new Promise(resolve => setTimeout(resolve, 600));
    }, []);

    const canManage = role === 'admin' || role === 'encargado';

    const filteredUbicaciones = useMemo(() => {
        return ubicaciones.filter(loc => {
            const matchesQuery = !searchQuery.trim() || 
                (loc.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (loc.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (loc.codigo || loc.id || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesPiso = pisoFilter === 'TODOS' || 
                (pisoFilter === 'ALMACENES' && (loc.nombre || '').toLowerCase().includes('almacén')) ||
                (loc.piso === pisoFilter);

            return matchesQuery && matchesPiso;
        });
    }, [ubicaciones, searchQuery, pisoFilter]);

    const stats = useMemo(() => {
        const total = ubicaciones.length;
        const activas = ubicaciones.filter(u => u.activa !== false).length;
        const totalCapacidad = ubicaciones.reduce((acc, u) => acc + (Number(u.capacidad) || 0), 0);
        return { total, activas, totalCapacidad };
    }, [ubicaciones]);

    return (
        <RouteGuard>
        <div className="flex flex-col flex-1 bg-slate-50/50 dark:bg-black min-h-screen">
            <Header title="Ubicaciones" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-8">

                {/* Banner Header with Stats */}
                <div className="bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                                <span className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300 flex items-center justify-center">
                                    <MapPin size={18} />
                                </span>
                                Ubicaciones y Espacios Físicos
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {loading ? 'Cargando ubicaciones...' : `${stats.total} espacios registrados en la base de datos de la iglesia`}
                            </p>
                        </div>

                        {canManage && (
                            <button
                                onClick={() => { setEditingLocation(null); setShowForm(true); }}
                                className="btn btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-2 shadow-sm self-start sm:self-auto"
                            >
                                <Plus size={18} /> Nueva ubicación
                            </button>
                        )}
                    </div>

                    {/* Quick Stats Badges */}
                    {!loading && (
                        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-violet-500 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-slate-400">Total</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{stats.total}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-slate-400">Activas</div>
                                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{stats.activas}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className="text-blue-500 flex-shrink-0" />
                                <div>
                                    <div className="text-xs text-slate-400">Capacidad Total</div>
                                    <div className="text-sm font-bold text-slate-800 dark:text-white">{stats.totalCapacidad} pers.</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Buscar por nombre, código o descripción..."
                            className="inp pl-10 text-sm py-2.5 bg-white dark:bg-[#0d0d10] border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400"
                        />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        {[
                            { id: 'TODOS', label: 'Todas' },
                            { id: 'Piso 1', label: 'Piso 1' },
                            { id: 'Piso 2', label: 'Piso 2' },
                            { id: 'Piso 3', label: 'Piso 3' },
                            { id: 'ALMACENES', label: 'Almacenes' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setPisoFilter(tab.id)}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                                    pisoFilter === tab.id
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Locations grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#0d0d10] border border-slate-200 dark:border-white/10 rounded-2xl h-44 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : filteredUbicaciones.length === 0 ? (
                    <EmptyState 
                        icon={Building2} 
                        title="Sin ubicaciones encontradas" 
                        subtitle={searchQuery ? `No hay resultados para "${searchQuery}"` : "Crea tu primera ubicación para organizar el inventario"} 
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredUbicaciones.map(loc => (
                            <LocationCard
                                key={loc.id}
                                ubicacion={loc}
                                canManage={canManage}
                                onEdit={handleEdit}
                                onToggle={toggleUbicacion}
                                onDelete={eliminarUbicacion}
                            />
                        ))}
                    </div>
                )}
            </div>
            </PullToRefresh>

            {/* Modal */}
            {showForm && (
                <LocationFormModal
                    ubicacion={editingLocation}
                    onClose={() => { setShowForm(false); setEditingLocation(null); }}
                    onSave={handleSave}
                />
            )}
        </div>
        </RouteGuard>
    );
}
