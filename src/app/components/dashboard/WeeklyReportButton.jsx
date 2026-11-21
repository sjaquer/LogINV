'use client';
import { useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';

// Botones de reporte pensados para ir sobre la cabecera azul del panel.
// Nota: `bg-[#fff]` (y no `bg-white`) para que el botón siga siendo blanco en
// modo oscuro: globals.css remapea `bg-white` a negro en html.dark.
export default function WeeklyReportButton({ onGenerate, onExportExcel, canGenerate = true }) {
    const [generating, setGenerating] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function run(setBusy, fn) {
        setBusy(true);
        try {
            await fn();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
                type="button"
                onClick={() => run(setGenerating, onGenerate)}
                disabled={generating || !canGenerate}
                title={canGenerate ? 'PDF del último conteo completado' : 'Aún no hay conteos completados en esta ubicación'}
                className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#fff] px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {generating
                    ? <span className="spinner h-4 w-4" />
                    : <FileText size={17} aria-hidden="true" />}
                Reporte del último conteo
            </button>
            <button
                type="button"
                onClick={() => run(setExporting, onExportExcel)}
                disabled={exporting}
                className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[0.98] disabled:opacity-60"
            >
                {exporting
                    ? <span className="spinner h-4 w-4 border-white/30 border-t-white" />
                    : <FileSpreadsheet size={17} aria-hidden="true" />}
                Exportar a Excel
            </button>
        </div>
    );
}
