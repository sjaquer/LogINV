'use client';
import { useRef, useState } from 'react';
import { Camera, Trash2, AlertTriangle, ImageOff, CheckCircle2 } from 'lucide-react';
import { useGoogleDrive } from '@/services/googleDrive';
import { compressImage } from '@/lib/imageCompression';
import ProductThumb from '@/components/ui/ProductThumb';

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function ProductImageUploader({ imagenUrl, imagenId, onChange }) {
    const { loading: driveLoading, upload, remove } = useGoogleDrive();
    const [processing, setProcessing] = useState(false);
    const [infoMsg, setInfoMsg] = useState('');
    const [localError, setLocalError] = useState('');
    const inputRef = useRef(null);

    function handlePick() {
        setLocalError('');
        setInfoMsg('');
        inputRef.current?.click();
    }

    async function handleFile(e) {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        setLocalError('');
        setInfoMsg('');
        setProcessing(true);

        try {
            // 1. Comprimir en el navegador (reduce de varios MB a ~40-60 KB)
            const compressed = await compressImage(file);
            const oldId = imagenId;

            let uploadedToDrive = false;

            // 2. Si Google Drive está configurado, intentar subirlo
            if (process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID) {
                try {
                    const result = await upload(compressed);
                    onChange({ imagen_url: result.url, imagen_drive_id: result.id });
                    uploadedToDrive = true;
                    setInfoMsg('Foto subida a Google Drive con éxito.');
                } catch (driveErr) {
                    console.warn('[LogINV] Google Drive no disponible, usando almacenamiento local optimizado:', driveErr.message);
                }
            }

            // 3. Fallback seguro: si no se subió a Drive, guardar la imagen comprimida (DataURL)
            if (!uploadedToDrive) {
                const dataUrl = await fileToDataUrl(compressed);
                onChange({ imagen_url: dataUrl, imagen_drive_id: '' });
                setInfoMsg('Foto guardada y optimizada en alta calidad.');
            }

            if (oldId) remove(oldId);
        } catch (err) {
            console.error('[LogINV] Error procesando imagen:', err);
            setLocalError(err.message || 'Error al procesar la imagen');
        } finally {
            setProcessing(false);
        }
    }

    function handleRemove() {
        const oldId = imagenId;
        onChange({ imagen_url: '', imagen_drive_id: '' });
        setInfoMsg('');
        setLocalError('');
        if (oldId) remove(oldId);
    }

    const isLoading = processing || driveLoading;

    return (
        <div>
            <div className="flex items-center gap-3">
                {imagenUrl ? (
                    <ProductThumb url={imagenUrl} size="sm" className="w-20 h-20" />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center flex-shrink-0">
                        <ImageOff size={22} className="text-slate-300" />
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={handlePick}
                        disabled={isLoading}
                        className="btn btn-ghost px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                    >
                        {isLoading ? <span className="spinner border-slate-400 border-t-transparent w-3.5 h-3.5" /> : <Camera size={14} />}
                        {imagenUrl ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    {imagenUrl && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1.5 disabled:opacity-60"
                        >
                            <Trash2 size={14} /> Quitar
                        </button>
                    )}
                </div>
            </div>
            {infoMsg && (
                <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> {infoMsg}
                </p>
            )}
            {localError && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} /> {localError}
                </p>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFile}
            />
        </div>
    );
}
