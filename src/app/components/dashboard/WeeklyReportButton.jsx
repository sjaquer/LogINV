'use client';
import { useState } from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';

export default function WeeklyReportButton({ onGenerate, onExportExcel }) {
    const [generating, setGenerating] = useState(false);
    const [exporting, setExporting] = useState(false);

    async function handleGenerate() {
        setGenerating(true);
        try {
            await onGenerate();
        } finally {
            setGenerating(false);
        }
    }

    async function handleExportExcel() {
        setExporting(true);
        try {
            await onExportExcel();
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex gap-3">
            <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-primary px-5 py-3 text-base font-bold flex items-center gap-2 shadow-sm flex-1 sm:flex-none justify-center"
            >
                {generating ? (
                    <><span className="spinner border-white border-t-transparent w-5 h-5" /> Generando...</>
                ) : (
                    <><FileText size={18} /> Reporte semanal</>
                )}
            </button>
            <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="btn btn-ghost px-4 py-3 text-base font-semibold flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 flex-1 sm:flex-none justify-center disabled:opacity-60"
            >
                {exporting ? (
                    <><span className="spinner border-slate-400 border-t-transparent w-4 h-4" /> Generando...</>
                ) : (
                    <><FileSpreadsheet size={18} /> Exportar a Excel</>
                )}
            </button>
        </div>
    );
}
