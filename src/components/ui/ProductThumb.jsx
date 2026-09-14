'use client';
import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import { formatProductImageUrl, getDriveFallbackUrl } from '@/lib/imageUtils';

export { formatProductImageUrl, getDriveFallbackUrl };

// Miniatura de producto con resiliencia de carga y fallbacks
export default function ProductThumb({ url, icon, size = 'sm', className = '' }) {
    const [failed, setFailed] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    useEffect(() => {
        setFailed(false);
        setUseFallback(false);
    }, [url]);

    const dims = size === 'lg' ? 'w-full h-40 sm:h-48 rounded-xl text-4xl' : 'w-10 h-10 rounded-xl text-lg';

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

    if (currentSrc && !failed) {
        return (
            <img
                src={currentSrc}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImageError}
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
