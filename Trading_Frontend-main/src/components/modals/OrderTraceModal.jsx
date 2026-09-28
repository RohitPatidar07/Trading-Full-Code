import React, { useState, useEffect } from 'react';
import { traceTrade } from '../../services/api';

const OrderTraceModal = ({ isOpen, onClose, tradeId }) => {
    const [loading, setLoading] = useState(true);
    const [traceData, setTraceData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !tradeId) return;

        const fetchTrace = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await traceTrade(tradeId);
                setTraceData(data);
            } catch (err) {
                console.error('Order trace fetch error:', err);
                setError(err.response?.data?.message || err.message || 'Failed to trace order');
            } finally {
                setLoading(false);
            }
        };

        fetchTrace();
    }, [isOpen, tradeId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#101726] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#162032]">
                    <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-lg">
                            🔍
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-white tracking-wide">
                                Order Flow Trace & Root-Cause Diagnosis
                            </h2>
                            <p className="text-xs text-slate-400">
                                Trade #{tradeId} &bull; End-to-End Execution Pipeline
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xl cursor-pointer"
                    >
                        &times;
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-3">
                            <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                            <p className="text-xs text-slate-400">Tracing trade across all 5 verification stages...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            <strong>Trace Failed:</strong> {error}
                        </div>
                    ) : traceData && (
                        <>
                            {/* Summary Banner */}
                            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 uppercase font-semibold">Client:</span>
                                        <span className="text-sm font-bold text-white">
                                            {traceData.user?.username} (#{traceData.user?.id})
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                            {traceData.user?.role}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        Audited at: {new Date(traceData.audited_at).toLocaleString()}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-400 font-medium">Pipeline Result:</span>
                                    {traceData.overall_status === 'HEALTHY' ? (
                                        <span className="px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                            <span>●</span> All Checks Passed
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
                                            <span>▲</span> Defect Detected ({traceData.failed_stage_count} Stage)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 5-Stage Stepper View */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    5-Stage Execution Checkpoints
                                </h3>

                                <div className="space-y-3">
                                    {traceData.stages?.map((s) => {
                                        const isPass = s.status === 'PASS';
                                        const isWarn = s.status === 'WARN';
                                        return (
                                            <div
                                                key={s.stage}
                                                className={`p-4 rounded-lg border transition-all ${
                                                    isPass
                                                        ? 'bg-slate-900/60 border-emerald-500/20'
                                                        : isWarn
                                                        ? 'bg-amber-950/20 border-amber-500/30'
                                                        : 'bg-rose-950/20 border-rose-500/40'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                                                                isPass
                                                                    ? 'bg-emerald-500 text-black'
                                                                    : isWarn
                                                                    ? 'bg-amber-500 text-black'
                                                                    : 'bg-rose-500 text-white'
                                                            }`}
                                                        >
                                                            {isPass ? '✓' : '!'}
                                                        </span>
                                                        <span className="text-sm font-bold text-white">
                                                            Stage {s.stage}: {s.name}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                            isPass
                                                                ? 'bg-emerald-500/20 text-emerald-300'
                                                                : isWarn
                                                                ? 'bg-amber-500/20 text-amber-300'
                                                                : 'bg-rose-500/20 text-rose-300'
                                                        }`}
                                                    >
                                                        {s.status}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-slate-300 pl-9">
                                                    {s.notes}
                                                </p>

                                                {/* Mini Data Details */}
                                                {s.data && (
                                                    <div className="mt-2.5 ml-9 p-2.5 rounded bg-black/40 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
                                                        {Object.entries(s.data).map(([key, val]) => (
                                                            <div key={key} className="truncate">
                                                                <span className="text-slate-500">{key}:</span>{' '}
                                                                <span className="text-slate-200">
                                                                    {typeof val === 'boolean' ? (val ? 'true' : 'false') : String(val ?? '-')}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Root Cause Card */}
                            <div className="p-4 rounded-lg bg-blue-500/[0.06] border border-blue-500/20 space-y-2">
                                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <span>🧠</span> Diagnostic Finding & Recommendation
                                </h3>
                                <div className="text-xs text-slate-300 space-y-1.5 pl-6">
                                    <p>
                                        <strong className="text-white">Finding:</strong> {traceData.diagnosis}
                                    </p>
                                    {traceData.root_cause && (
                                        <p>
                                            <strong className="text-rose-400">Root Cause:</strong> {traceData.root_cause}
                                        </p>
                                    )}
                                    <p>
                                        <strong className="text-emerald-400">Recommended Fix:</strong> {traceData.recommended_fix}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-white/10 bg-[#162032] flex justify-between items-center text-xs text-slate-400">
                    <span>100% Read-Only Safety &bull; Database untouched</span>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all cursor-pointer"
                    >
                        Close Inspector
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderTraceModal;
