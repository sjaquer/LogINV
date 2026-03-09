'use client';
import { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

const THRESHOLD = 70;

export default function PullToRefresh({ onRefresh, children }) {
    const [pullY, setPullY] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const touchStartY = useRef(0);
    const isPulling = useRef(false);

    const onTouchStart = useCallback((e) => {
        if (window.scrollY <= 0 && !refreshing) {
            touchStartY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, [refreshing]);

    const onTouchMove = useCallback((e) => {
        if (!isPulling.current || refreshing) return;
        const diff = e.touches[0].clientY - touchStartY.current;
        if (diff > 0) {
            setPullY(Math.min(diff * 0.4, 100));
        } else {
            setPullY(0);
            isPulling.current = false;
        }
    }, [refreshing]);

    const onTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;
        if (pullY >= THRESHOLD && !refreshing && onRefresh) {
            setRefreshing(true);
            setPullY(48);
            try {
                await onRefresh();
            } finally {
                setTimeout(() => { setRefreshing(false); setPullY(0); }, 400);
            }
        } else {
            setPullY(0);
        }
    }, [pullY, refreshing, onRefresh]);

    const showIndicator = pullY > 10 || refreshing;

    return (
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div
                className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
                style={{ height: showIndicator ? Math.max(pullY, refreshing ? 48 : 0) : 0 }}
            >
                <RefreshCw
                    size={20}
                    className={`text-brand-500 transition-transform ${refreshing ? 'animate-spin' : ''}`}
                    style={!refreshing ? { transform: `rotate(${pullY * 3}deg)` } : undefined}
                />
                {pullY >= THRESHOLD && !refreshing && (
                    <span className="text-xs text-brand-500 font-medium ml-2">Suelta para actualizar</span>
                )}
                {refreshing && (
                    <span className="text-xs text-brand-500 font-medium ml-2">Actualizando...</span>
                )}
            </div>
            {children}
        </div>
    );
}
