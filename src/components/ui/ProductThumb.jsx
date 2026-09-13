'use client';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

// Miniatura de producto: muestra la foto de Google Drive si existe (pública,
// visible para cualquier usuario sin necesitar su propia cuenta de Google),
// o el ícono de categoría como respaldo. Usado en ProductCard y en el
// visualizador de detalle.
export default function ProductThumb({ url, icon, size = 'sm', className = '' }) {
    const [failed, setFailed] = useState(false);
    const dims = size === 'lg' ? 'w-full h-40 sm:h-48 rounded-xl text-4xl' : 'w-10 h-10 rounded-xl text-lg';

    if (url && !failed) {
        return (
            <img
                src={url}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
                className={`${dims} object-cover border border-slate-100 bg-slate-50 flex-shrink-0 ${className}`}
            />
        );
    }
    return (
        <div className={`${dims} bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 ${className}`}>
            {icon || <ImageOff size={size === 'lg' ? 28 : 16} className="text-slate-300" />}
        </div>
    );
}
