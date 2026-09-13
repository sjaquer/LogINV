'use client';
import { useRef, useState } from 'react';
import { Camera, Trash2, AlertTriangle, ImageOff } from 'lucide-react';
import { useGoogleDrive } from '@/services/googleDrive';

// Sube/reemplaza la foto de un producto en la carpeta compartida de Google
// Drive de la cuenta que autoriza. El archivo queda público ("cualquiera con
// el enlace puede ver"), así que se guarda de forma universal: cualquier
// usuario de la app ve la foto sin importar su rol, sin autorizar nada.
export default function ProductImageUploader({ imagenUrl, imagenId, onChange }) {
    const { loading, error, authorize, upload, remove, authorized } = useGoogleDrive();
    const [localError, setLocalError] = useState('');
    const inputRef = useRef(null);

    async function handlePick() {
        setLocalError('');
        if (!authorized) {
            const ok = await authorize();
            if (!ok) { setLocalError('No se pudo autorizar el acceso a Google Drive.'); return; }
        }
        inputRef.current?.click();
    }

    async function handleFile(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setLocalError('');
        try {
            const oldId = imagenId;
            const result = await upload(file);
            onChange({ imagen_url: result.url, imagen_drive_id: result.id });
            if (oldId) remove(oldId); // limpieza en segundo plano, no bloquea
        } catch (err) {
            setLocalError(err.message || 'Error al subir la imagen');
        }
    }

    function handleRemove() {
        const oldId = imagenId;
        onChange({ imagen_url: '', imagen_drive_id: '' });
        if (oldId) remove(oldId);
    }

    return (
        <div>
            <div className="flex items-center gap-3">
                {imagenUrl ? (
                    <img src={imagenUrl} alt="" className="w-20 h-20 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0" />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center flex-shrink-0">
                        <ImageOff size={22} className="text-slate-300" />
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handlePick}
                        disabled={loading}
                        className="btn btn-ghost px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                    >
                        {loading ? <span className="spinner border-slate-400 border-t-transparent w-3.5 h-3.5" /> : <Camera size={14} />}
                        {imagenUrl ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {imagenUrl && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                        >
                            <Trash2 size={14} /> Quitar
                        </button>
                    )}
                </div>
            </div>
            {(localError || error) && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {localError || error}
                </p>
            )}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFile} />
        </div>
    );
}
