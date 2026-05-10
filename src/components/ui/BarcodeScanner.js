'use client';
import { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, X } from 'lucide-react';

let scannerIdCounter = 0;

export default function BarcodeScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const containerRef = useRef(null);
    const [error, setError] = useState('');
    const [scannerId] = useState(() => `barcode-reader-${++scannerIdCounter}`);

    useEffect(() => {
        let html5QrCode = null;
        let mounted = true;
        (async () => {
            try {
                const { Html5Qrcode } = await import('html5-qrcode');
                if (!mounted || !containerRef.current) return;
                html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 280, height: 120 }, aspectRatio: 1.777 },
                    (decodedText) => { onScan(decodedText); },
                    () => {}
                );
            } catch (err) {
                if (mounted) setError(err?.message || 'Cámara no disponible');
            }
        })();
        return () => { mounted = false; html5QrCode?.stop().catch(() => {}); };
    }, [onScan, scannerId]);

    useEffect(() => {
        function handleKey(e) { if (e.key === 'Escape') onClose(); }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl overflow-hidden max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <Camera size={20} className="text-brand-600" />
                        <h3 className="font-bold text-slate-900 text-base">Escanear código</h3>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" aria-label="Cerrar">
                        <X size={22} />
                    </button>
                </div>
                <div className="relative bg-black">
                    <div id={scannerId} ref={containerRef} className="w-full" />
                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                            <CameraOff size={40} className="text-slate-400 mb-3" />
                            <p className="text-base font-medium">Cámara no disponible</p>
                            <p className="text-sm text-slate-400 mt-2">Permite el acceso a la cámara para escanear</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 text-center">
                    <p className="text-sm text-slate-500">Permite el acceso a la cámara para escanear</p>
                </div>
            </div>
        </div>
    );
}
