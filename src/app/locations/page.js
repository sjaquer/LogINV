'use client';
import { useState, useCallback, useEffect } from 'react';
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
    MapPin, Plus, Building2,
} from 'lucide-react';

export default function LocationsPage() {
    const { ubicaciones, loading, crearUbicacion, actualizarUbicacion, eliminarUbicacion, toggleUbicacion } = useLocations();
    const { user } = useAuth();
    const { setHideBottomNav } = useSidebar();
    const userName = user?.nombre || 'Usuario';
    const role = user?.rol || 'voluntario';

    const [showForm, setShowForm] = useState(false);
    const [editingLocation, setEditingLocation] = useState(null);

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

    return (
        <RouteGuard>
        <div className="flex flex-col flex-1 bg-slate-50/50">
            <Header title="Ubicaciones" />
            <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-fade-in max-w-5xl mx-auto w-full pb-4">

                {/* Description */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                        <MapPin size={18} className="text-violet-500" /> Gestión de ubicaciones
                    </h3>
                    <p className="text-xs text-slate-500">Administra los espacios donde se encuentra el inventario de la iglesia.</p>
                </div>

                {/* Action bar */}
                {canManage && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => { setEditingLocation(null); setShowForm(true); }}
                            className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
                        >
                            <Plus size={20} /> Nueva ubicación
                        </button>
                    </div>
                )}

                {/* Locations grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl h-40 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : ubicaciones.length === 0 ? (
                    <EmptyState 
                        icon={Building2} 
                        title="Sin ubicaciones" 
                        subtitle="Crea tu primera ubicación para organizar el inventario" 
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {ubicaciones.map(loc => (
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
