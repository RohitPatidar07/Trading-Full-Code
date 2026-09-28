import React, { useState, useEffect, useCallback } from 'react';
import { 
    Activity, 
    Wifi, 
    WifiOff, 
    RefreshCw, 
    RotateCcw, 
    CheckCircle2, 
    AlertTriangle, 
    Coins, 
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import * as api from '../services/api';

const AllTickHealthCard = ({ compact = false, onRefreshParent }) => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pinging, setPinging] = useState(false);
    const [reconnecting, setReconnecting] = useState(false);
    const [reconnectMsg, setReconnectMsg] = useState(null);
    const [error, setError] = useState(null);

    const fetchHealth = useCallback(async (doPing = false) => {
        try {
            if (doPing) setPinging(true);
            else if (!health) setLoading(true);

            setError(null);
            const res = await api.getAllTickHealth(doPing);
            if (res.success && res.data) {
                setHealth(res.data);
            }
        } catch (err) {
            console.error('Failed to load AllTick health:', err);
            setError(err.response?.data?.message || err.message || 'Error checking AllTick');
        } finally {
            setLoading(false);
            setPinging(false);
        }
    }, [health]);

    useEffect(() => {
        fetchHealth(false);
        // Refresh diagnostics every 15 seconds
        const timer = setInterval(() => fetchHealth(false), 15000);
        return () => clearInterval(timer);
    }, [fetchHealth]);

    const handleReconnect = async () => {
        if (reconnecting) return;
        setReconnecting(true);
        setReconnectMsg(null);
        setError(null);
        try {
            const res = await api.reconnectAllTick();
            if (res.success) {
                setHealth(res.data);
                setReconnectMsg('Feed Reconnected Successfully!');
                if (onRefreshParent) onRefreshParent();
                setTimeout(() => setReconnectMsg(null), 4000);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to reconnect');
        } finally {
            setReconnecting(false);
        }
    };

    const isConnected = health?.isRunning && (health?.isWsConnected || health?.pollingActive);
    const mode = health?.mode || (health?.isWsConnected ? 'WEBSOCKET' : 'HTTP_DEPTH_POLL');
    const latency = health?.latencyMs || 0;

    const getLatencyColor = (ms) => {
        if (!ms || ms === 0) return 'text-slate-400';
        if (ms < 500) return 'text-emerald-400';
        if (ms < 1000) return 'text-amber-400';
        return 'text-rose-400';
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/60 border border-white/10 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="font-semibold text-slate-300">AllTick:</span>
                    <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {isConnected ? (health?.isWsConnected ? 'WS LIVE' : 'DEPTH POLL') : 'OFFLINE'}
                    </span>
                </span>
                {latency > 0 && (
                    <span className={`text-[11px] font-mono ${getLatencyColor(latency)}`}>
                        {latency}ms
                    </span>
                )}
                {health?.benchmarks?.USDINR && (
                    <span className="text-[11px] text-amber-300 font-mono hidden sm:inline">
                        USD/INR: ₹{health.benchmarks.USDINR}
                    </span>
                )}
                <button 
                    onClick={() => fetchHealth(true)} 
                    disabled={pinging}
                    title="Ping AllTick API"
                    className="p-1 hover:text-white text-slate-400 transition-colors">
                    <RefreshCw className={`w-3 h-3 ${pinging ? 'animate-spin text-blue-400' : ''}`} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r from-slate-900/95 via-[#131b31]/95 to-slate-900/95 backdrop-blur-md p-3 sm:p-4 shadow-xl mb-3">
            {/* Ambient background glow */}
            <div className={`absolute -right-16 -top-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Section 1: Engine Status & Mode */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner ${isConnected ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/40 border-rose-500/40 text-rose-400'}`}>
                        {isConnected ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                                AllTick Market Feed Engine
                                <ShieldCheck className="w-4 h-4 text-blue-400" />
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                isConnected 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}>
                                {isConnected ? (health?.isWsConnected ? '🟢 WebSocket Active' : '🟡 Depth Polling (3s)') : '🔴 Disconnected'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>Protocol: <strong className="text-slate-200">{mode}</strong></span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3 text-slate-400" />
                                Roundtrip Latency: 
                                <strong className={`font-mono ${getLatencyColor(latency)}`}>
                                    {latency > 0 ? `${latency} ms` : 'Measuring...'}
                                </strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Key Real-time Benchmarks */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3 py-1">
                    {/* USD/INR */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-lg px-2.5 py-1.5 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">USD / INR</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-amber-300">
                            {health?.benchmarks?.USDINR ? `₹${health.benchmarks.USDINR}` : '96.08'}
                        </span>
                    </div>

                    {/* BTC/USDT */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-lg px-2.5 py-1.5 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">BTC / USDT</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                            {health?.benchmarks?.BTCUSDT ? `$${Number(health.benchmarks.BTCUSDT).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '---'}
                        </span>
                    </div>

                    {/* Gold Spot */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-lg px-2.5 py-1.5 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">GOLD (XAU)</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-yellow-400">
                            {health?.benchmarks?.GOLD ? `$${Number(health.benchmarks.GOLD).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '---'}
                        </span>
                    </div>

                    {/* Monitored Symbols */}
                    <div className="bg-slate-800/50 border border-white/5 rounded-lg px-2.5 py-1.5 flex flex-col">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">Streams Active</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-blue-300">
                            {health?.symbolsCount?.total || 21} Symbols
                        </span>
                    </div>
                </div>

                {/* Section 3: Diagnostic Actions */}
                <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    <button
                        onClick={() => fetchHealth(true)}
                        disabled={pinging || loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        title="Ping AllTick API server for fresh roundtrip latency"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-blue-400' : ''}`} />
                        <span>{pinging ? 'Pinging...' : 'Ping Test'}</span>
                    </button>

                    <button
                        onClick={handleReconnect}
                        disabled={reconnecting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        title="Force restart the WebSocket & Depth polling feed"
                    >
                        <RotateCcw className={`w-3.5 h-3.5 ${reconnecting ? 'animate-spin' : ''}`} />
                        <span>{reconnecting ? 'Reconnecting...' : 'Reconnect'}</span>
                    </button>
                </div>
            </div>

            {/* Notification Messages */}
            {reconnectMsg && (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-md animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{reconnectMsg}</span>
                </div>
            )}

            {error && (
                <div className="mt-2 text-xs flex items-center gap-1.5 text-rose-400 bg-rose-950/40 border border-rose-500/30 px-3 py-1 rounded-md">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
};

export default AllTickHealthCard;
