import React, { useState, useEffect } from 'react';
import { X, ArrowLeftRight, Loader2, AlertCircle, CheckCircle, UserCheck } from 'lucide-react';
import * as api from '../services/api';

const TransferFundModal = ({ isOpen, onClose, onSuccess, currentUser, allUsers = [] }) => {
    const [toUserId, setToUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setToUserId('');
            setAmount('');
            setNotes('');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter out current user from destination list to prevent self-transfer
    const availableRecipients = allUsers.filter(u => String(u.id) !== String(currentUser?.id || currentUser?.userId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        // 1. Client-Side Input Validation
        if (!toUserId) {
            setError('Please select a recipient account');
            return;
        }

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError('Please enter a valid transfer amount greater than ₹0');
            return;
        }

        if (String(toUserId) === String(currentUser?.id || currentUser?.userId)) {
            setError('Cannot transfer funds to your own account');
            return;
        }

        setSubmitting(true);

        try {
            // 2. Strict API Payload (Only toUserId, amount, notes)
            const payload = {
                toUserId: parseInt(toUserId, 10),
                amount: parsedAmount,
                notes: notes.trim()
            };

            const res = await api.internalTransfer(payload);

            if (res?.success !== false) {
                setSuccessMessage(res?.message || 'Transfer completed successfully');
                setTimeout(() => {
                    if (onSuccess) onSuccess(res);
                    onClose();
                }, 1200);
            } else {
                setError(res?.message || 'Transfer failed');
            }
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || 'Failed to process internal transfer');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedRecipient = availableRecipients.find(u => String(u.id) === String(toUserId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#1f283e] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden text-white">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a2035]/80">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                            <ArrowLeftRight className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold tracking-wide">Internal Fund Transfer</h2>
                            <p className="text-xs text-slate-400">Atomic balance transfer between trader accounts</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Error / Success Alerts */}
                    {error && (
                        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-start gap-2.5 text-xs text-red-300">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {successMessage && (
                        <div className="p-3 bg-green-500/15 border border-green-500/30 rounded-lg flex items-center gap-2.5 text-xs text-green-300">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Source Account Details */}
                    <div className="bg-[#161c2e] p-3.5 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">From Account (Source)</span>
                            <span className="font-bold text-slate-200">{currentUser?.full_name || currentUser?.username || 'Current User'} (ID: {currentUser?.id || currentUser?.userId})</span>
                        </div>
                        <div className="text-right">
                            <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Sender Balance</span>
                            <span className="font-bold text-emerald-400">₹{parseFloat(currentUser?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Destination Account Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                            Recipient Account (Destination) <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={toUserId}
                            onChange={(e) => setToUserId(e.target.value)}
                            disabled={submitting}
                            className="w-full bg-[#161c2e] border border-slate-600 focus:border-blue-400 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
                        >
                            <option value="">-- Select Recipient User --</option>
                            {availableRecipients.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.username} — {u.full_name || u.name || 'User'} (ID: {u.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Transfer Amount */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                            Transfer Amount (₹) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            step="any"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount (e.g. 10000)"
                            disabled={submitting}
                            className="w-full bg-[#161c2e] border border-slate-600 focus:border-blue-400 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
                        />
                        {/* Quick select chips */}
                        <div className="flex gap-2 mt-2">
                            {[1000, 5000, 10000, 50000].map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setAmount(String(val))}
                                    disabled={submitting}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 rounded border border-white/10 transition-colors"
                                >
                                    +₹{val.toLocaleString('en-IN')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes / Remarks */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                            Transfer Remarks / Notes (Optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Reason for internal transfer (e.g. Ledger settlement)"
                            disabled={submitting}
                            className="w-full bg-[#161c2e] border border-slate-600 focus:border-blue-400 rounded-lg px-3.5 py-2 text-sm text-white outline-none transition-colors"
                        />
                    </div>

                    {/* Summary Preview */}
                    {selectedRecipient && parseFloat(amount) > 0 && (
                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs space-y-1 text-slate-300">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Transferring To:</span>
                                <span className="font-semibold text-white">{selectedRecipient.username} ({selectedRecipient.full_name || ''})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Net Transfer Amount:</span>
                                <span className="font-bold text-emerald-400">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    )}

                    {/* Modal Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !toUserId || !amount}
                            className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <ArrowLeftRight className="w-4 h-4" />
                                    <span>Confirm Transfer</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferFundModal;
