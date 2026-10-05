'use client';
import { useState, useEffect } from 'react';
import { ImageOff, Package } from 'lucide-react';
import { formatProductImageUrl, getDriveFallbackUrl } from '@/lib/imageUtils';

export { formatProductImageUrl, getDriveFallbackUrl };

// Miniatura de producto con resiliencia de carga y fallbacks visuales de alta calidad
export default function ProductThumb({ url, icon, size = 'sm', fit = 'cover', className = '', alt = '' }) {
    const [failed, setFailed] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    useEffect(() => {
        setFailed(false);
        setUseFallback(false);
    }, [url]);

    let dims = 'w-10 h-10 rounded-xl text-lg';
    if (size === 'card') {
        dims = 'w-full h-full';
    } else if (size === 'lg') {
        dims = 'w-full h-48 sm:h-64 rounded-2xl';
    } else if (size === 'md') {
        dims = 'w-14 h-14 rounded-xl text-2xl';
    }

    const primaryUrl = formatProductImageUrl(url);
    const fallbackUrl = getDriveFallbackUrl(url);
    const currentSrc = useFallback ? (fallbackUrl || primaryUrl) : primaryUrl;

    function handleImageError() {
        if (!useFallback && fallbackUrl && fallbackUrl !== primaryUrl) {
            setUseFallback(true);
        } else {
            setFailed(true);
        }
    }

    const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover';

    if (currentSrc && !failed) {
        return (
            <img
                src={currentSrc}
                alt={alt || 'Foto del producto'}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
                className={`${dims} ${fitClass} bg-transparent ${className}`}
            />
        );
    }

    if (size === 'card') {
        return (
            <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100/90 dark:from-zinc-900/90 dark:to-zinc-950 text-slate-300 dark:text-zinc-600 ${className}`}>
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800/80 shadow-xs border border-slate-200/50 dark:border-zinc-700/50 flex items-center justify-center text-slate-400 dark:text-zinc-400 group-hover:scale-110 transition-transform duration-300">
                    {icon || <Package size={22} strokeWidth={1.8} />}
                </div>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-1.5 uppercase tracking-wider">Sin foto</span>
            </div>
        );
    }

    return (
        <div className={`${dims} bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-center flex-shrink-0 ${className}`}>
            {icon || <ImageOff size={size === 'lg' ? 28 : 16} className="text-slate-300 dark:text-zinc-600" />}
        </div>
    );
}
