import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrades } from '../context/TradeContext';
import { formatPrice } from '../utils/formatPrice';
import {
    IndianRupee, User, Key, FileText, LogOut, ChevronRight,
    Briefcase, BookText, BookOpen, Bell, LifeBuoy, Landmark,
    Clock, CheckCircle, XCircle, AlertCircle, Trash2, Send, Play, Copy,
    CreditCard, Smartphone, Target, TrendingUp, Zap, Plus, RefreshCw
} from 'lucide-react';
import * as api from '../services/api';
import useResponsive from '../hooks/useResponsive';

export default function Account() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isMobile } = useResponsive();
    const {
        ledgerBalance, marginAvailable, dynamicMarginBySegment,
        withdrawalRequests, addWithdrawalRequest, watchlist, includedPins,
        userAlerts, addUserAlert, removeUserAlert, resetUserAlert,
        alertSettings, updateAlertSetting, refreshAlerts
    } = useTrades();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const currentUser = api.getSessionUser();
    
    // Determine active sub-view based on trailing hash/route
    const subRoute = location.pathname.split('/')[2] || 'menu';

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        api.logout();
        navigate('/login');
    };

    // Sub-view renders
    let content;
    if (subRoute === 'funds') {
        content = <FundsView ledger={ledgerBalance} available={marginAvailable} segments={dynamicMarginBySegment} onBack={() => navigate('/account')} />;
    } else if (subRoute === 'profile') {
        content = <ProfileView user={currentUser} onBack={() => navigate('/account')} />;
    } else if (subRoute === 'bank') {
        content = <BankView onBack={() => navigate('/account')} />;
    } else if (subRoute === 'support') {
        content = <SupportView onBack={() => navigate('/account')} />;
    } else if (subRoute === 'deposit') {
        content = <DepositView onBack={() => navigate('/account')} />;
    } else if (subRoute === 'withdraw') {
        content = <WithdrawView balance={ledgerBalance} requests={withdrawalRequests} onSubmit={addWithdrawalRequest} onBack={() => navigate('/account')} />;
    } else if (subRoute === 'calendar') {
        content = <CalendarView onBack={() => navigate('/account')} />;
    } else if (subRoute === 'alerts') {
        content = (
            <AlertsView
                alerts={userAlerts}
                settings={alertSettings}
                symbols={[...new Set(watchlist.filter(w => includedPins.has(w.name)).map(w => w.name))]}
                onAdd={addUserAlert}
                onRemove={removeUserAlert}
                onReset={resetUserAlert}
                onUpdateSetting={updateAlertSetting}
                onRefresh={refreshAlerts}
                onBack={() => navigate('/account')}
            />
        );
    } else if (subRoute === 'learning') {
        content = <LearningView onBack={() => navigate('/account')} />;
    } else {
        content = (
            <>
                <header style={styles.header}>
                    <h2 style={styles.headerTitle}>MY ACCOUNT</h2>
                </header>

                <div style={styles.usernameLabel}>
                    User ({currentUser?.username || 'client'})
                </div>

                <div style={styles.menuList}>
                    <button onClick={() => navigate('/account/funds')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Funds</span>
                        <IndianRupee size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/profile')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Profile</span>
                        <User size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/bank')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Bank Details</span>
                        <Landmark size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/support')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Support</span>
                        <LifeBuoy size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/deposit')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Deposit Request</span>
                        <Key size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/withdraw')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Withdrawal Request</span>
                        <IndianRupee size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/change-password')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Change Password</span>
                        <Key size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => window.open('https://www.forexfactory.com', '_blank')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Economic Calendar</span>
                        <FileText size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/alerts')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Price Alerts</span>
                        <Bell size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={() => navigate('/account/learning')} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Learning Module</span>
                        <BookOpen size={18} style={styles.menuItemIcon} />
                    </button>
                    <button onClick={handleLogout} style={styles.apkMenuItem} className="account-menu-btn">
                        <span style={styles.menuItemText}>Log Out</span>
                        <LogOut size={18} style={styles.menuItemIcon} />
                    </button>
                    <div style={styles.apkMenuItem}>
                        <span style={styles.menuItemText}>App Version</span>
                        <span style={styles.versionText}>1.9.0</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div style={{ ...styles.container, paddingBottom: '90px' }}>
            <div style={styles.contentWrapper}>
                {content}
            </div>

            {showLogoutConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.supportDialogCard}>
                        <h3 style={{ ...styles.supportDialogTitleText, fontSize: '18px', marginBottom: '12px', textAlign: 'center' }}>
                            Confirm Logout
                        </h3>
                        <p style={{ color: '#b8c5d6', fontSize: '14px', marginBottom: '24px', textAlign: 'center', lineHeight: '1.5' }}>
                            Are you sure you want to log out of your account?
                        </p>
                        <div style={styles.modalButtonsRow}>
                            <button 
                                onClick={() => setShowLogoutConfirm(false)} 
                                style={styles.modalCancelBtn}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout}
                                style={{
                                    ...styles.modalConfirmBtn,
                                    backgroundColor: '#EF4444',
                                    color: '#ffffff',
                                    borderColor: 'transparent',
                                }}
                            >
                                <LogOut size={16} style={{ marginRight: '6px' }} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── SUB-VIEWS ──

function FundsView({ ledger, available, segments, onBack }) {
    const roundedLedger = Math.round(ledger);
    const amountStr = `+${roundedLedger}`;

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3 style={styles.subHeaderTitle}>FUNDS</h3>
            </header>

            <div style={styles.fundsBalanceSummary}>
                <div style={styles.fundsBalanceLabel}>Current Ledger Balance</div>
                <div style={styles.fundsBalanceValue}>₹ {roundedLedger}</div>
            </div>

            <div style={styles.fundsList}>
                <div style={styles.fundsItem}>
                    <div style={styles.fundsDate}>2026-02-23 00:00:00</div>
                    <div style={styles.fundsAmountBox}>
                        {amountStr}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProfileView({ user, onBack }) {
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSegments = async () => {
            try {
                if (user?.id) {
                    const data = await api.getUserSegments(user.id);
                    setSegments(data);
                }
            } catch (error) {
                console.error('Error fetching segments:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSegments();
    }, [user?.id]);

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3 style={styles.subHeaderTitle}>PROFILE DETAILS</h3>
            </header>

            {loading ? (
                <div style={styles.centeredContainer}>Loading...</div>
            ) : segments.length === 0 ? (
                <div style={styles.centeredContainer}>No trading segments assigned to your profile yet.</div>
            ) : (
                <div style={styles.profileSegmentList}>
                    {segments.map((seg, index) => (
                        <div key={seg.segment + index} style={styles.profileSegmentWrapper}>
                            <div style={styles.profileSegmentTitleHeader}>
                                {seg.segment}: {seg.is_enabled ? 'ENABLED' : 'DISABLED'}
                            </div>
                            <div style={styles.profileSegmentCard}>
                                <div style={styles.profileSegmentDetailRow}>
                                    <span style={styles.profileSegmentLabel}>Brokerage</span>
                                    <span style={styles.profileSegmentValue}>{seg.brokerage_value} / {seg.brokerage_type.toLowerCase()}</span>
                                </div>
                                <div style={styles.profileSegmentDetailRow}>
                                    <span style={styles.profileSegmentLabel}>Exposure Multiplier</span>
                                    <span style={styles.profileSegmentValue}>{seg.exposure_multiplier}x</span>
                                </div>
                                <div style={styles.profileSegmentDetailRow}>
                                    <span style={styles.profileSegmentLabel}>Max Lot Per Scrip</span>
                                    <span style={styles.profileSegmentValue}>{seg.max_lot_per_scrip}</span>
                                </div>
                                <div style={{ ...styles.profileSegmentDetailRow, borderBottom: 'none' }}>
                                    <span style={styles.profileSegmentLabel}>Auto Square Off</span>
                                    <span style={styles.profileSegmentValue}>{seg.auto_square_off ? `Yes (${seg.square_off_time || 'N/A'})` : 'No'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function BankView({ onBack }) {
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getBanks().then(data => {
            setBanks(data.filter(b => b.status === 'Active'));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const copyText = (txt) => {
        navigator.clipboard.writeText(txt);
        alert('Copied to clipboard!');
    };

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3>Official Bank Accounts</h3>
            </header>
            {loading ? <p style={styles.loadingText}>Fetching details...</p> : banks.map(b => (
                <div key={b.id} style={styles.card}>
                    <div style={styles.rowBetween}>
                        <span style={styles.bold}>{b.bank_name}</span>
                        <span style={styles.activeBadge}>Verified</span>
                    </div>
                    <div style={styles.divider} />
                    <div style={styles.bankDetailField}>
                        <label>Account Holder</label>
                        <div>{b.account_holder}</div>
                    </div>
                    <div style={styles.bankDetailField}>
                        <label>Account Number</label>
                        <div style={styles.copyRow}>
                            {b.account_number}
                            <button onClick={() => copyText(b.account_number)} style={styles.copyBtn}><Copy size={12} /></button>
                        </div>
                    </div>
                    <div style={styles.bankDetailField}>
                        <label>IFSC Code</label>
                        <div style={styles.copyRow}>
                            {b.ifsc}
                            <button onClick={() => copyText(b.ifsc)} style={styles.copyBtn}><Copy size={12} /></button>
                        </div>
                    </div>
                    <div style={styles.bankDetailField}>
                        <label>Branch</label>
                        <div>{b.branch}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

const SUPPORT_CATEGORIES = [
    'Order Not Executed', 'Wrong P&L', 'Margin / Balance', 'Withdrawal Issue', 'Position Not Closed', 'Login / Access'
];

function SupportView({ onBack }) {
    const [subTab, setSubTab] = useState('tickets'); // 'tickets' | 'support'
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'resolved'
    const [showRaiseModal, setShowRaiseModal] = useState(false);

    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);

    // Form states
    const [category, setCategory] = useState(SUPPORT_CATEGORIES[0]);
    const [subject, setSubject] = useState('');
    const [desc, setDesc] = useState('');

    const fetchTickets = () => {
        api.getSupportTickets().then(data => {
            setTickets(data || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const handleCreateTicket = async () => {
        if (!subject.trim() || !desc.trim()) {
            alert('Subject and description are required.');
            return;
        }
        try {
            await api.createSupportTicket({
                category: category,
                subject: subject.trim(),
                message: desc.trim(),
                priority: 'HIGH'
            });
            alert('Support request submitted!');
            setSubject('');
            setDesc('');
            setShowRaiseModal(false);
            fetchTickets();
        } catch (err) {
            alert(err.message || 'Failed to submit ticket');
        }
    };

    const handleDeleteTicket = async (ticketId) => {
        if (window.confirm('Are you sure you want to delete this support ticket?')) {
            try {
                await api.deleteTicket(ticketId);
                alert('Ticket deleted.');
                fetchTickets();
            } catch (err) {
                alert('Failed to delete ticket.');
            }
        }
    };

    const handleLongPress = (e, ticketId) => {
        e.preventDefault();
        handleDeleteTicket(ticketId);
    };

    const handleOpenChat = (ticket) => {
        setActiveTicket(ticket);
        setSubTab('chat');
        api.getTicketMessages(ticket.id).then(msgs => {
            setChatMessages(msgs || []);
        });
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        try {
            await api.sendTicketMessage(activeTicket.id, inputText.trim());
            setInputText('');
            const updated = await api.getTicketMessages(activeTicket.id);
            setChatMessages(updated || []);
        } catch {
            alert('Failed to send message.');
        }
    };

    const pendingCount = tickets.filter(t => t.status !== 'RESOLVED').length;
    const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
    const totalCount = tickets.length;

    const filteredTickets = tickets.filter(t => {
        if (filter === 'pending') return t.status !== 'RESOLVED';
        if (filter === 'resolved') return t.status === 'RESOLVED';
        return true;
    });

    if (subTab === 'chat' && activeTicket) {
        return (
            <div style={styles.subContainer}>
                <header style={styles.subHeader}>
                    <button onClick={() => setSubTab('tickets')} style={styles.backBtn}>←</button>
                    <h3 style={styles.subHeaderTitle}>{activeTicket.subject.toUpperCase()}</h3>
                </header>
                <div style={styles.chatArea}>
                    {chatMessages.map((m, idx) => {
                        const isMine = m.sender_id === api.getSessionUser()?.id;
                        return (
                            <div key={idx} style={{
                                ...styles.chatBubbleRow,
                                justifyContent: isMine ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    ...styles.chatBubble,
                                    backgroundColor: isMine ? '#10B981' : '#1C1C1E',
                                    color: isMine ? '#000000' : '#ffffff'
                                }}>
                                    <div>{m.message}</div>
                                    <span style={styles.chatTime}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {activeTicket.status !== 'RESOLVED' && (
                    <div style={styles.chatInputRow}>
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={inputText}
                            onChange={e => setInputText(e.target.value)}
                            style={styles.chatInput}
                        />
                        <button onClick={handleSendMessage} style={styles.chatSendBtn}><Send size={16} /></button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3 style={styles.subHeaderTitle}>SUPPORT CENTER</h3>
            </header>

            <div style={styles.supportTabSwitcher}>
                <button
                    onClick={() => setSubTab('tickets')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(subTab === 'tickets' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <FileText size={16} style={styles.supportTabIcon} />
                    <span>My Tickets</span>
                    {pendingCount > 0 && (
                        <span style={styles.supportTabBadge}>{pendingCount}</span>
                    )}
                </button>
                <button
                    onClick={() => setSubTab('support')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(subTab === 'support' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <LifeBuoy size={16} style={styles.supportTabIcon} />
                    <span>Support</span>
                </button>
            </div>

            {subTab === 'tickets' ? (
                <>
                    <div style={styles.supportStatsRow}>
                        <div style={styles.supportStatBox}>
                            <span style={styles.supportStatVal}>{totalCount}</span>
                            <span style={styles.supportStatLabel}>TOTAL</span>
                        </div>
                        <div style={styles.supportStatBox}>
                            <span style={{ ...styles.supportStatVal, color: '#FFB74D' }}>{pendingCount}</span>
                            <span style={styles.supportStatLabel}>PENDING</span>
                        </div>
                        <div style={styles.supportStatBox}>
                            <span style={{ ...styles.supportStatVal, color: '#10B981' }}>{resolvedCount}</span>
                            <span style={styles.supportStatLabel}>RESOLVED</span>
                        </div>
                    </div>

                    <div style={styles.supportFiltersRow}>
                        <button
                            onClick={() => setFilter('all')}
                            style={{
                                ...styles.supportFilterPill,
                                ...(filter === 'all' ? styles.supportFilterPillActive : {})
                            }}
                        >
                            All ({totalCount})
                        </button>
                        <button
                            onClick={() => setFilter('pending')}
                            style={{
                                ...styles.supportFilterPill,
                                ...(filter === 'pending' ? styles.supportFilterPillActive : {})
                            }}
                        >
                            Pending ({pendingCount})
                        </button>
                        <button
                            onClick={() => setFilter('resolved')}
                            style={{
                                ...styles.supportFilterPill,
                                ...(filter === 'resolved' ? styles.supportFilterPillActive : {})
                            }}
                        >
                            Resolved ({resolvedCount})
                        </button>
                    </div>

                    <div style={styles.supportTicketsList}>
                        {loading ? (
                            <div style={styles.centeredContainer}>Loading...</div>
                        ) : filteredTickets.length === 0 ? (
                            <div style={styles.centeredContainer}>No support tickets found.</div>
                        ) : (
                            filteredTickets.map(t => (
                                <div
                                    key={t.id}
                                    style={styles.supportTicketCard}
                                    onClick={() => handleOpenChat(t)}
                                    onContextMenu={(e) => handleLongPress(e, t.id)}
                                >
                                    <div style={styles.supportTicketIconBg}>
                                        <FileText size={18} color="#10B981" />
                                    </div>
                                    <div style={styles.supportTicketMiddle}>
                                        <span style={styles.supportTicketId}>#{t.id}</span>
                                        <span style={styles.supportTicketTitle}>{t.subject}</span>
                                        <span style={styles.supportTicketDate}>
                                            {new Date(t.created_at || Date.now()).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={styles.supportTicketRight}>
                                        <span
                                            style={{
                                                ...styles.supportTicketStatusBadge,
                                                backgroundColor: t.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 183, 77, 0.15)',
                                                color: t.status === 'RESOLVED' ? '#10B981' : '#FFB74D'
                                            }}
                                        >
                                            ● {t.status}
                                        </span>
                                        <ChevronRight size={16} color="#8A99AD" style={{ marginLeft: '4px' }} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setShowRaiseModal(true)}
                        style={styles.supportRaiseBtn}
                    >
                        + Raise a New Ticket
                    </button>
                    <div style={styles.supportDeleteHelper}>
                        Long press/Right click a ticket to delete it
                    </div>
                </>
            ) : (
                <div style={styles.supportHelpTabContainer}>
                    <div style={styles.supportTeamCard}>
                        <LifeBuoy size={42} color="#ffffff" style={{ marginBottom: '16px' }} />
                        <h4 style={styles.supportTeamTitle}>Dedicated Support Team</h4>
                        <p style={styles.supportTeamSub}>
                            Our team is available 24/7 to assist you with your trading needs.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowRaiseModal(true)}
                        style={styles.supportActionItemCard}
                    >
                        <div style={styles.supportActionIconBg}>
                            <Send size={18} color="#ffffff" />
                        </div>
                        <div style={styles.supportActionTextCol}>
                            <span style={styles.supportActionTitle}>Raise a Ticket</span>
                            <span style={styles.supportActionSub}>Get help from your broker/admin</span>
                        </div>
                        <ChevronRight size={18} color="#8A99AD" />
                    </button>

                    <button
                        onClick={() => setSubTab('tickets')}
                        style={styles.supportActionItemCard}
                    >
                        <div style={styles.supportActionIconBg}>
                            <FileText size={18} color="#ffffff" />
                        </div>
                        <div style={styles.supportActionTextCol}>
                            <span style={styles.supportActionTitle}>My Tickets</span>
                            <span style={styles.supportActionSub}>
                                {pendingCount} pending, {resolvedCount} resolved
                            </span>
                        </div>
                        <ChevronRight size={18} color="#8A99AD" />
                    </button>
                </div>
            )}

            {showRaiseModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.supportDialogCard}>
                        <div style={styles.supportDialogHeader}>
                            <span style={styles.supportDialogTitleText}>RAISE NEW TICKET</span>
                            <button onClick={() => setShowRaiseModal(false)} style={styles.supportDialogCloseBtn}>✕</button>
                        </div>

                        <div style={styles.supportFormField}>
                            <label style={styles.supportFormLabel}>ISSUE CATEGORY</label>
                            <div style={styles.supportCategoryGrid}>
                                {SUPPORT_CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCategory(c)}
                                        style={{
                                            ...styles.supportCategoryPill,
                                            ...(category === c ? styles.supportCategoryPillActive : {})
                                        }}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={styles.supportFormField}>
                            <label style={styles.supportFormLabel}>SUBJECT</label>
                            <input
                                type="text"
                                placeholder="Brief title of your issue"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                style={styles.supportInput}
                            />
                        </div>

                        <div style={styles.supportFormField}>
                            <label style={styles.supportFormLabel}>DESCRIPTION</label>
                            <textarea
                                placeholder="Explain your issue in detail..."
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                style={styles.supportTextarea}
                                rows={4}
                            />
                        </div>

                        <div style={styles.supportFormActions}>
                            <button
                                onClick={() => {
                                    setSubject('');
                                    setDesc('');
                                    setCategory(SUPPORT_CATEGORIES[0]);
                                }}
                                style={styles.supportResetBtn}
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleCreateTicket}
                                style={styles.supportSubmitConfirmBtn}
                            >
                                <Send size={14} style={{ marginRight: '6px' }} /> Submit Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DepositView({ onBack }) {
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            alert('Please enter a valid amount.');
            return;
        }
        if (!file) {
            alert('Please attach payment screenshot.');
            return;
        }

        setUploading(true);
        try {
            await api.createDeposit(amount, file);
            alert('Screenshot uploaded successfully! Request pending admin review.');
            setAmount('');
            setFile(null);
            onBack();
        } catch (err) {
            alert(err.message || 'Submit failed.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3 style={styles.subHeaderTitle}>DEPOSIT REQUEST</h3>
            </header>

            <div style={styles.depositContent}>
                <button
                    onClick={() => alert('Online gateways are busy. Please use screenshot proof deposit.')}
                    style={styles.depositOnlineBtn}
                >
                    Add funds online
                </button>

                <div style={styles.depositDividerText}>OR Upload Deposit Proof</div>

                <div style={styles.depositField}>
                    <label style={styles.depositLabel}>Amount (₹)</label>
                    <input
                        type="number"
                        placeholder="Enter Amount"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        style={styles.depositInput}
                        className="deposit-input"
                    />
                </div>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                />

                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.depositAttachBox}
                >
                    {file ? (
                        <div style={styles.depositAttachPreview}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Screenshot Selected:</span>
                            <span style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>{file.name}</span>
                        </div>
                    ) : (
                        <div style={styles.depositAttachPlaceholder}>
                            <span>Attach</span>
                            <span style={{ marginTop: '4px' }}>Screenshot</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={styles.depositUploadBtn}
                >
                    {uploading ? 'Uploading Proof...' : 'UPLOAD SCREENSHOT'}
                </button>
            </div>
        </div>
    );
}

function WithdrawView({ balance, requests, onSubmit, onBack }) {
    const [tab, setTab] = useState('new'); // 'new' | 'history'
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bank'); // 'Bank' | 'UPI'
    const [bankName, setBankName] = useState('');
    const [acNum, setAcNum] = useState('');
    const [ifsc, setIfsc] = useState('');
    const [acHolder, setAcHolder] = useState('');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async () => {
        const amtVal = parseFloat(amount);
        if (!amount || isNaN(amtVal) || amtVal < 500) {
            alert('Minimum withdrawal amount is ₹500.');
            return;
        }
        if (amtVal > balance) {
            alert('Insufficient ledger balance.');
            return;
        }

        setLoading(true);
        try {
            await onSubmit({
                amount,
                method: method === 'Bank' ? 'Bank Transfer' : 'UPI',
                bankName: method === 'Bank' ? bankName : '',
                accountNumber: method === 'Bank' ? acNum : '',
                ifsc: method === 'Bank' ? ifsc : '',
                accountHolder: method === 'Bank' ? acHolder : '',
                upiId: method === 'UPI' ? upiId : '',
            });
            alert('Withdrawal request submitted!');
            setAmount('');
            setBankName('');
            setAcNum('');
            setIfsc('');
            setAcHolder('');
            setUpiId('');
            setTab('history');
        } catch (err) {
            alert(err.message || 'Failed to submit request.');
        } finally {
            setLoading(false);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'Pending');
    const pendingCount = pendingRequests.length;

    // Check if form is valid
    const isFormValid = () => {
        const amtVal = parseFloat(amount);
        if (!amount || isNaN(amtVal) || amtVal < 500) return false;
        if (method === 'Bank') {
            return acHolder.trim() !== '' && bankName.trim() !== '' && acNum.trim() !== '' && ifsc.trim() !== '';
        } else {
            return upiId.trim() !== '';
        }
    };

    const formattedBalance = balance < 0
        ? `₹-${Math.abs(Math.round(balance)).toLocaleString()}`
        : `₹${Math.round(balance).toLocaleString()}`;

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3 style={styles.subHeaderTitle}>WITHDRAWAL REQUEST</h3>
            </header>

            {/* Tab Switcher */}
            <div style={styles.supportTabSwitcher}>
                <button
                    onClick={() => setTab('new')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(tab === 'new' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <span>New Request</span>
                </button>
                <button
                    onClick={() => setTab('history')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(tab === 'history' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <span>My Requests</span>
                    {pendingCount > 0 && (
                        <span style={styles.supportTabBadge}>{pendingCount}</span>
                    )}
                </button>
            </div>

            {tab === 'new' ? (
                <div style={styles.withdrawFormContainer}>
                    {/* Available Balance card */}
                    <div style={styles.withdrawBalanceCard}>
                        <span style={styles.withdrawBalanceLabel}>Available Balance</span>
                        <span style={styles.withdrawBalanceValue}>{formattedBalance}</span>
                    </div>

                    {/* Withdrawal Amount underline */}
                    <div style={styles.withdrawField}>
                        <label style={styles.withdrawInputLabel}>Withdrawal Amount (₹)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={styles.withdrawBigInput}
                            className="auth-input"
                        />
                        <span style={styles.withdrawMinLabel}>Minimum: ₹500</span>
                    </div>

                    {/* Payment Method */}
                    <div style={{ ...styles.withdrawField, marginTop: '16px' }}>
                        <label style={styles.withdrawInputLabel}>Payment Method</label>
                        <div style={styles.withdrawMethodRow}>
                            <button
                                onClick={() => setMethod('Bank')}
                                style={{
                                    ...styles.withdrawMethodBtn,
                                    ...(method === 'Bank' ? styles.withdrawMethodActiveBtn : {})
                                }}
                            >
                                <CreditCard size={16} style={{ marginRight: '8px' }} />
                                <span>Bank Transfer</span>
                            </button>
                            <button
                                onClick={() => setMethod('UPI')}
                                style={{
                                    ...styles.withdrawMethodBtn,
                                    ...(method === 'UPI' ? styles.withdrawMethodActiveBtn : {})
                                }}
                            >
                                <Smartphone size={16} style={{ marginRight: '8px' }} />
                                <span>UPI</span>
                            </button>
                        </div>
                    </div>

                    {/* Details subform */}
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={styles.withdrawSectionHeader}>
                            {method === 'Bank' ? 'Bank Details' : 'UPI Details'}
                        </h4>

                        {method === 'Bank' ? (
                            <>
                                <div style={styles.withdrawField}>
                                    <label style={styles.withdrawSubLabel}>Account Holder Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Account Holder Name"
                                        value={acHolder}
                                        onChange={e => setAcHolder(e.target.value)}
                                        style={styles.withdrawUnderlineInput}
                                        className="auth-input"
                                    />
                                </div>
                                <div style={styles.withdrawField}>
                                    <label style={styles.withdrawSubLabel}>Bank Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Bank Name"
                                        value={bankName}
                                        onChange={e => setBankName(e.target.value)}
                                        style={styles.withdrawUnderlineInput}
                                        className="auth-input"
                                    />
                                </div>
                                <div style={styles.withdrawField}>
                                    <label style={styles.withdrawSubLabel}>Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Account Number"
                                        value={acNum}
                                        onChange={e => setAcNum(e.target.value)}
                                        style={styles.withdrawUnderlineInput}
                                        className="auth-input"
                                    />
                                </div>
                                <div style={styles.withdrawField}>
                                    <label style={styles.withdrawSubLabel}>IFSC Code</label>
                                    <input
                                        type="text"
                                        placeholder="Enter IFSC Code"
                                        value={ifsc}
                                        onChange={e => setIfsc(e.target.value)}
                                        style={styles.withdrawUnderlineInput}
                                        className="auth-input"
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={styles.withdrawField}>
                                <label style={styles.withdrawSubLabel}>UPI Address</label>
                                <input
                                    type="text"
                                    placeholder="Enter UPI Address (e.g. name@upi)"
                                    value={upiId}
                                    onChange={e => setUpiId(e.target.value)}
                                    style={styles.withdrawUnderlineInput}
                                    className="auth-input"
                                />
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleWithdraw}
                        disabled={loading || !isFormValid()}
                        style={{
                            ...styles.withdrawSubmitBtn,
                            ...(isFormValid() ? styles.withdrawSubmitBtnActive : styles.withdrawSubmitBtnDisabled)
                        }}
                    >
                        {loading ? 'Submitting...' : 'SUBMIT REQUEST'}
                    </button>
                    <p style={styles.withdrawDisclaimer}>
                        Requests are processed within 24 business hours. Ensure your details are correct before submitting.
                    </p>
                </div>
            ) : (
                /* History List */
                <div style={styles.withdrawHistoryList}>
                    {requests.length === 0 ? (
                        <div style={styles.centeredContainer}>No withdrawal history found.</div>
                    ) : (
                        requests.map(r => (
                            <div key={r.id} style={styles.withdrawHistoryCard}>
                                <div style={styles.withdrawHistoryHeader}>
                                    <span style={styles.withdrawHistoryAmount}>
                                        ₹{parseFloat(r.amount).toLocaleString()}
                                    </span>
                                    <span
                                        style={{
                                            ...styles.withdrawHistoryStatus,
                                            backgroundColor: r.status === 'Completed' ? 'rgba(16, 185, 129, 0.12)' : r.status === 'Rejected' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 167, 38, 0.12)',
                                            color: r.status === 'Completed' ? '#10B981' : r.status === 'Rejected' ? '#EF4444' : '#FFA726'
                                        }}
                                    >
                                        ● {r.status}
                                    </span>
                                </div>

                                <div style={styles.withdrawHistoryBody}>
                                    <div>{r.method || 'Bank Transfer'}</div>
                                    {r.bank_name && <div>Bank: {r.bank_name}</div>}
                                    {r.account_number && <div>A/C: {r.account_number}</div>}
                                    {r.ifsc && <div>IFSC: {r.ifsc}</div>}
                                    {r.upi_id && <div>UPI: {r.upi_id}</div>}
                                </div>

                                <div style={styles.withdrawHistoryDivider} />

                                <div style={styles.withdrawHistoryFooter}>
                                    <div>Submitted: {new Date(r.created_at || r.createdAt || Date.now()).toLocaleString()}</div>
                                    <div>Updated: {new Date(r.updated_at || r.updatedAt || r.created_at || Date.now()).toLocaleString()}</div>
                                </div>

                                {r.remark && (
                                    <div style={{ ...styles.withdrawHistoryBody, color: '#FC8181', marginTop: '6px' }}>
                                        Reason: {r.remark}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function CalendarView({ onBack }) {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        containerRef.current.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
        script.type = 'text/javascript';
        script.async = true;
        script.innerHTML = JSON.stringify({
            "colorTheme": "dark",
            "isMaximized": true,
            "width": "100%",
            "height": "100%",
            "locale": "en",
            "importanceFilter": "-1,0,1"
        });

        containerRef.current.appendChild(script);
    }, []);

    const openForexFactory = () => {
        window.open('https://www.forexfactory.com/calendar', '_blank');
    };

    return (
        <div style={styles.calendarSubContainer}>
            <header style={styles.calendarSubHeader}>
                <button onClick={onBack} style={styles.calendarBackBtn}>←</button>
                <h3 style={styles.calendarSubHeaderTitle}>ECONOMIC CALENDAR</h3>
                <button onClick={openForexFactory} style={styles.calendarOpenSiteBtn}>
                    Forex Factory ↗
                </button>
            </header>
            <div style={styles.calendarIframeContainer}>
                <div 
                    ref={containerRef} 
                    className="tradingview-widget-container" 
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
}

function AlertsView({ alerts, settings, symbols, onAdd, onRemove, onReset, onUpdateSetting, onRefresh, onBack }) {
    const [tab, setTab] = useState('active'); // 'active' | 'config'
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Form states for adding alert
    const defaultSymbols = symbols && symbols.length > 0 ? symbols : ['XAU/USD', 'GOLD 26JUN', 'ADA/USD', 'AVAX/USD'];
    const [selSymbol, setSelSymbol] = useState(defaultSymbols[0] || '');
    const [alertType, setAlertType] = useState('above'); // 'above' | 'below'
    const [targetPrice, setTargetPrice] = useState('');

    const handleCreateAlert = () => {
        if (!selSymbol) {
            alert('Please select a symbol.');
            return;
        }
        const priceVal = parseFloat(targetPrice);
        if (!targetPrice || isNaN(priceVal) || priceVal <= 0) {
            alert('Please enter a valid target price.');
            return;
        }

        onAdd({
            symbol: selSymbol,
            type: alertType,
            targetPrice: priceVal
        });

        // Reset states
        setTargetPrice('');
        setShowAddModal(false);
        alert('Alert configured successfully!');
    };

    const categoriesOnCount = 
        (settings.priceAlerts ? 1 : 0) + 
        (settings.percentChange ? 1 : 0) + 
        (settings.marketTiming ? 1 : 0) + 
        (settings.technical ? 1 : 0) + 
        (settings.tradeAlerts ? 1 : 0);

    return (
        <div style={styles.alertsContainer}>
            <header style={styles.alertsHeader}>
                <button onClick={onBack} style={styles.alertsBackBtn}>←</button>
                <h3 style={styles.alertsTitle}>PRICE ALERTS</h3>
                <button 
                    onClick={() => {
                        setSelSymbol(defaultSymbols[0]);
                        setShowAddModal(true);
                    }} 
                    style={styles.alertsAddBtn}
                >
                    <Plus size={24} />
                </button>
            </header>

            {/* Stats Summary Bar */}
            <div style={styles.alertsStatsBar}>
                <div style={styles.alertsStatCol}>
                    <span style={styles.alertsStatNum}>{alerts.length}</span>
                    <span style={styles.alertsStatLabel}>Active</span>
                </div>
                <div style={styles.alertsStatDivider} />
                <div style={styles.alertsStatCol}>
                    <span style={styles.alertsStatNum}>0</span>
                    <span style={styles.alertsStatLabel}>Triggered</span>
                </div>
                <div style={styles.alertsStatDivider} />
                <div style={styles.alertsStatCol}>
                    <span style={styles.alertsStatNum}>{categoriesOnCount}</span>
                    <span style={styles.alertsStatLabel}>Categories ON</span>
                </div>
            </div>

            {/* Tab Switcher */}
            <div style={styles.supportTabSwitcher}>
                <button
                    onClick={() => setTab('active')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(tab === 'active' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <span>🔔 My Alerts</span>
                </button>
                <button
                    onClick={() => setTab('config')}
                    style={{
                        ...styles.supportTabBtn,
                        ...(tab === 'config' ? styles.supportTabActiveBtn : {})
                    }}
                >
                    <span>⚙️ Settings</span>
                </button>
            </div>

            {tab === 'active' ? (
                /* My Alerts list */
                <div style={styles.alertsList}>
                    {alerts.length === 0 ? (
                        <div style={styles.alertsEmpty}>
                            <span>No active price alerts configured.</span>
                            <button 
                                onClick={() => setShowAddModal(true)} 
                                style={styles.alertsEmptyBtn}
                            >
                                Create First Alert
                            </button>
                        </div>
                    ) : (
                        alerts.map(a => (
                            <div key={a.id} style={styles.alertCard}>
                                <div style={{
                                    ...styles.alertIconBg,
                                    backgroundColor: a.type === 'above' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)'
                                }}>
                                    <TrendingUp 
                                        size={20} 
                                        color={a.type === 'above' ? '#10B981' : '#EF4444'} 
                                        style={{ transform: a.type === 'above' ? 'none' : 'rotate(90deg) scaleY(-1)' }}
                                    />
                                </div>
                                <div style={styles.alertInfo}>
                                    <div style={styles.alertSymbol}>{a.symbol}</div>
                                    <div style={{
                                        ...styles.alertCondition,
                                        color: a.type === 'above' ? '#10B981' : '#EF4444'
                                    }}>
                                        {a.type === 'above' ? 'Above' : 'Below'} ₹{a.targetPrice.toLocaleString()}
                                    </div>
                                    <div style={styles.alertWatching}>
                                        ⌛ Watching...
                                    </div>
                                </div>
                                <button onClick={() => onRemove(a.id)} style={styles.alertDeleteBtn}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                /* Settings Categories List */
                <div style={styles.alertsSettingsList}>
                    <div style={styles.alertsSettingsHeading}>ALERT CATEGORIES</div>

                    {/* Price Level Alerts */}
                    <div style={styles.categoryCard}>
                        <div style={{ ...styles.categoryIconBg, backgroundColor: 'rgba(66, 153, 225, 0.1)' }}>
                            <Target size={20} color="#4299E1" />
                        </div>
                        <div style={styles.categoryInfo}>
                            <div style={styles.categoryTitle}>Price Level Alerts</div>
                            <div style={styles.categoryDesc}>Alert when stock crosses your target price</div>
                        </div>
                        <Switch 
                            checked={!!settings.priceAlerts} 
                            onChange={e => onUpdateSetting('priceAlerts', e.target.checked)} 
                            activeColor="#4299E1"
                        />
                    </div>

                    {/* % Change Alerts */}
                    <div style={styles.categoryCard}>
                        <div style={{ ...styles.categoryIconBg, backgroundColor: 'rgba(72, 187, 120, 0.1)' }}>
                            <TrendingUp size={20} color="#48BB78" />
                        </div>
                        <div style={styles.categoryInfo}>
                            <div style={styles.categoryTitle}>% Change Alerts</div>
                            <div style={styles.categoryDesc}>Alert when stock moves significantly from open</div>
                        </div>
                        <Switch 
                            checked={!!settings.percentChange} 
                            onChange={e => onUpdateSetting('percentChange', e.target.checked)} 
                            activeColor="#48BB78"
                        />
                    </div>

                    {/* Market Timing */}
                    <div style={styles.categoryCard}>
                        <div style={{ ...styles.categoryIconBg, backgroundColor: 'rgba(237, 137, 54, 0.1)' }}>
                            <Clock size={20} color="#ED8936" />
                        </div>
                        <div style={styles.categoryInfo}>
                            <div style={styles.categoryTitle}>Market Timing</div>
                            <div style={styles.categoryDesc}>Open (9:15), Soon (3:15), Closed (3:30)</div>
                        </div>
                        <Switch 
                            checked={!!settings.marketTiming} 
                            onChange={e => onUpdateSetting('marketTiming', e.target.checked)} 
                            activeColor="#ED8936"
                        />
                    </div>

                    {/* Technical Signals */}
                    <div style={styles.categoryCard}>
                        <div style={{ ...styles.categoryIconBg, backgroundColor: 'rgba(245, 101, 101, 0.1)' }}>
                            <Zap size={20} color="#F56565" />
                        </div>
                        <div style={styles.categoryInfo}>
                            <div style={styles.categoryTitle}>Technical Signals</div>
                            <div style={styles.categoryDesc}>RSI overbought / oversold signals</div>
                        </div>
                        <Switch 
                            checked={!!settings.technical} 
                            onChange={e => onUpdateSetting('technical', e.target.checked)} 
                            activeColor="#F56565"
                        />
                    </div>

                    {/* Trade Execution */}
                    <div style={styles.categoryCard}>
                        <div style={{ ...styles.categoryIconBg, backgroundColor: 'rgba(160, 174, 192, 0.1)' }}>
                            <Bell size={20} color="#A0AEC0" />
                        </div>
                        <div style={styles.categoryInfo}>
                            <div style={styles.categoryTitle}>Trade Execution</div>
                            <div style={styles.categoryDesc}>Buy, Sell, SL, Target hit alerts</div>
                        </div>
                        <Switch 
                            checked={!!settings.tradeAlerts} 
                            onChange={e => onUpdateSetting('tradeAlerts', e.target.checked)} 
                            activeColor="#A0AEC0"
                        />
                    </div>

                    {/* Threshold selector (visible only if percentChange is checked) */}
                    {settings.percentChange && (
                        <div style={{ marginTop: '24px', textAlign: 'left' }}>
                            <div style={styles.alertsSettingsHeading}>% CHANGE THRESHOLD</div>
                            <p style={styles.categoryDesc}>Alert when stock moves this much from open:</p>
                            <div style={styles.thresholdGrid}>
                                {[1, 2, 3, 5].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => onUpdateSetting('percentThreshold', val)}
                                        style={{
                                            ...styles.thresholdBtn,
                                            ...(settings.percentThreshold === val ? styles.thresholdBtnActive : {})
                                        }}
                                    >
                                        {val}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning disclaimer */}
                    <div style={styles.alertsWarningBox}>
                        <AlertCircle size={18} color="#ED8936" style={{ marginTop: '2px' }} />
                        <span style={styles.alertsWarningText}>
                            Market Timing alerts fire automatically at 9:15, 15:15, and 15:30 IST based on your device clock.
                        </span>
                    </div>
                </div>
            )}

            {/* Set Price Alert Dialog Drawer Modal */}
            {showAddModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.supportDialogCard}>
                        <h3 style={{ ...styles.supportDialogTitleText, fontSize: '18px', marginBottom: '20px' }}>
                            Set Price Alert
                        </h3>

                        {/* Select Symbol */}
                        <div style={styles.withdrawField}>
                            <label style={styles.withdrawInputLabel}>Select Symbol</label>
                            <div style={styles.modalSymbolsRow}>
                                {defaultSymbols.map(sym => (
                                    <button
                                        key={sym}
                                        type="button"
                                        onClick={() => setSelSymbol(sym)}
                                        style={{
                                            ...styles.symbolChip,
                                            ...(selSymbol === sym ? styles.symbolChipActive : {})
                                        }}
                                    >
                                        {sym}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Alert Condition Type */}
                        <div style={{ ...styles.withdrawField, marginTop: '16px' }}>
                            <label style={styles.withdrawInputLabel}>Alert When Price</label>
                            <div style={styles.withdrawMethodRow}>
                                <button
                                    type="button"
                                    onClick={() => setAlertType('above')}
                                    style={{
                                        ...styles.withdrawMethodBtn,
                                        borderColor: alertType === 'above' ? '#10B981' : 'rgba(255,255,255,0.12)',
                                        color: alertType === 'above' ? '#10B981' : '#8e9aa8',
                                        backgroundColor: alertType === 'above' ? 'rgba(16, 185, 129, 0.06)' : 'transparent',
                                    }}
                                >
                                    📈 Goes Above
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAlertType('below')}
                                    style={{
                                        ...styles.withdrawMethodBtn,
                                        borderColor: alertType === 'below' ? '#EF4444' : 'rgba(255,255,255,0.12)',
                                        color: alertType === 'below' ? '#EF4444' : '#8e9aa8',
                                        backgroundColor: alertType === 'below' ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
                                    }}
                                >
                                    📉 Falls Below
                                </button>
                            </div>
                        </div>

                        {/* Target Price */}
                        <div style={{ ...styles.withdrawField, marginTop: '16px' }}>
                            <label style={styles.withdrawInputLabel}>Target Price (₹)</label>
                            <input
                                type="number"
                                placeholder="e.g. 5800"
                                value={targetPrice}
                                onChange={e => setTargetPrice(e.target.value)}
                                style={styles.withdrawBigInput}
                                className="auth-input"
                                autoFocus
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div style={styles.modalButtonsRow}>
                            <button 
                                onClick={() => setShowAddModal(false)} 
                                style={styles.modalCancelBtn}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateAlert}
                                style={styles.modalConfirmBtn}
                            >
                                <Bell size={16} style={{ marginRight: '6px' }} />
                                Set Alert
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Switch Component Helper
function Switch({ checked, onChange, activeColor }) {
    return (
        <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '40px',
            height: '22px',
            cursor: 'pointer',
            flexShrink: 0,
        }}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange} 
                style={{ opacity: 0, width: 0, height: 0 }} 
            />
            <span style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: checked ? activeColor : 'rgba(255, 255, 255, 0.16)',
                borderRadius: '22px',
                transition: 'background-color 0.2s',
            }} />
            <span style={{
                position: 'absolute',
                height: '16px',
                width: '16px',
                left: checked ? '21px' : '3px',
                bottom: '3px',
                backgroundColor: '#ffffff',
                borderRadius: '50%',
                transition: 'left 0.2s',
            }} />
        </label>
    );
}

const SEGMENTS = [
    { id: '1', title: 'Introduction to Trading', start: 0, end: 180 },
    { id: '2', title: 'What is the Stock Market?', start: 180, end: 450 },
    { id: '3', title: 'Types of Orders', start: 450, end: 780 },
    { id: '4', title: 'Technical Analysis Basics', start: 780, end: 1200 },
    { id: '5', title: 'Risk Management Rules', start: 1200, end: 1650 },
    { id: '6', title: 'Building a Trading Plan', start: 1650, end: 2100 },
];

function LearningView({ onBack }) {
    const iframeRef = useRef(null);

    const seekTo = (startSecs) => {
        if (iframeRef.current) {
            // Standard YouTube iframe API message interface
            iframeRef.current.contentWindow.postMessage(
                JSON.stringify({ event: 'command', func: 'seekTo', args: [startSecs, true] }),
                '*'
            );
        }
    };

    return (
        <div style={styles.subContainer}>
            <header style={styles.subHeader}>
                <button onClick={onBack} style={styles.backBtn}>←</button>
                <h3>Trading Academy</h3>
            </header>

            <div style={styles.iframeContainer}>
                <iframe
                    ref={iframeRef}
                    src="https://www.youtube.com/embed/grAMOvn4pFM?enablejsapi=1&rel=0"
                    title="Trading Academy Video Course"
                    style={styles.iframe}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                />
            </div>

            <div style={styles.segmentList}>
                {SEGMENTS.map(s => (
                    <button key={s.id} onClick={() => seekTo(s.start)} style={styles.segmentCard}>
                        <div style={styles.segmentDetails}>
                            <span style={styles.bold}>{s.title}</span>
                            <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                Start: {Math.floor(s.start / 60)}m {s.start % 60}s
                            </span>
                        </div>
                        <Play size={16} color="#10B981" />
                    </button>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: 'transparent',
        minHeight: '100%',
        padding: '0',
        paddingBottom: '90px',
        display: 'flex',
        flexDirection: 'column',
    },
    contentWrapper: {
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    subContainer: {
        backgroundColor: 'transparent',
        minHeight: '100%',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: '90px',
        paddingLeft: '16px',
        paddingRight: '16px',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
    },
    header: {
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: '16px',
        paddingLeft: '16px',
        paddingRight: '16px',
        backgroundColor: 'rgba(8, 10, 22, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: '18px',
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: '1px',
        margin: 0,
    },
    subHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '20px',
    },
    backBtn: {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'transparent',
    },
    usernameLabel: {
        fontSize: '14px',
        color: '#ffffff',
        fontWeight: '500',
        padding: '16px 16px 8px 16px',
        textAlign: 'left',
    },
    menuList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
        gap: '12px',
        padding: '8px 16px',
    },
    apkMenuItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        height: '48px',
        padding: '0 16px',
        cursor: 'pointer',
        width: '100%',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        textDecoration: 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    menuItemText: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#ffffff',
    },
    menuItemIcon: {
        color: '#10B981',
    },
    versionText: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#9CA3AF',
    },
    card: {
        backgroundColor: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    divider: {
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        margin: '6px 0',
    },
    rowBetween: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
    },
    bold: {
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#9CA3AF',
        marginBottom: '10px',
        textTransform: 'uppercase',
    },
    formField: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '12px',
    },
    fieldLabel: {
        fontSize: '11px',
        color: '#9CA3AF',
        marginBottom: '4px',
        fontWeight: 'bold',
    },
    fieldVal: {
        color: '#ffffff',
        fontSize: '14px',
    },
    subHeaderTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: '0.5px',
        margin: 0,
    },
    fundsBalanceSummary: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '24px 16px',
        textAlign: 'center',
        margin: '16px',
    },
    fundsBalanceLabel: {
        color: '#a1aab3',
        fontSize: '13px',
        marginBottom: '8px',
        fontWeight: '500',
    },
    fundsBalanceValue: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: '700',
    },
    fundsList: {
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 16px',
        marginTop: '8px',
    },
    fundsItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '48px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    },
    fundsDate: {
        color: '#a1aab3',
        fontSize: '13px',
    },
    fundsAmountBox: {
        backgroundColor: '#2E7D32',
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '13px',
        padding: '4px 10px',
        borderRadius: '4px',
        minWidth: '60px',
        textAlign: 'center',
    },
    centeredContainer: {
        color: '#b8c5d6',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'center',
        padding: '40px 20px',
    },
    profileSegmentList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
    },
    profileSegmentWrapper: {
        display: 'flex',
        flexDirection: 'column',
    },
    profileSegmentTitleHeader: {
        color: '#a1aab3',
        fontSize: '13px',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: '8px',
        paddingLeft: '4px',
    },
    profileSegmentCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '4px 16px',
    },
    profileSegmentDetailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '42px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    },
    profileSegmentLabel: {
        color: '#a1aab3',
        fontSize: '13px',
    },
    profileSegmentValue: {
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: '600',
    },
    loadingText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '13px',
        marginTop: '30px',
    },
    activeBadge: {
        fontSize: '9px',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        color: '#10B981',
        padding: '2px 6px',
        borderRadius: '4px',
        fontWeight: 'bold',
    },
    copyRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#ffffff',
        fontSize: '14px',
    },
    copyBtn: {
        color: '#9CA3AF',
        padding: '4px',
    },
    bankDetailField: {
        fontSize: '12px',
        marginBottom: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    tabOuter: {
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '10px',
        padding: '4px',
        marginBottom: '16px',
        border: '1px solid rgba(255,255,255,0.09)',
    },
    tabPart: {
        flex: 1,
        textAlign: 'center',
        padding: '8px 0',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#9CA3AF',
        borderRadius: '6px',
        backgroundColor: 'transparent',
    },
    bgActive: {
        backgroundColor: '#ffffff',
        color: '#000000',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px',
        color: '#f0f4ff',
    },
    select: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px',
        color: '#f0f4ff',
    },
    textarea: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px',
        color: '#f0f4ff',
        resize: 'none',
    },
    submitBtn: {
        backgroundColor: '#10B981',
        color: '#000000',
        padding: '12px',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '13px',
    },
    ticketList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    statusBadgeText: {
        fontSize: '10px',
        fontWeight: 'bold',
    },
    ticketDesc: {
        fontSize: '12px',
        color: '#9CA3AF',
        lineHeight: '1.4',
        marginTop: '6px',
    },
    chatArea: {
        height: '60vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.09)',
        marginBottom: '10px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
    },
    chatBubbleRow: {
        display: 'flex',
        width: '100%',
    },
    chatBubble: {
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '13px',
    },
    chatTime: {
        fontSize: '8px',
        alignSelf: 'flex-end',
        marginTop: '4px',
        opacity: 0.6,
    },
    chatInputRow: {
        display: 'flex',
        gap: '10px',
    },
    chatInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '8px',
        padding: '10px',
        color: '#f0f4ff',
    },
    chatSendBtn: {
        backgroundColor: '#10B981',
        color: '#000000',
        width: '42px',
        height: '42px',
        borderRadius: '21px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fileInput: {
        color: '#9CA3AF',
        fontSize: '12px',
    },
    helperText: {
        fontSize: '11px',
        color: '#FFB74D',
        marginTop: '2px',
    },
    historyList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    timeText: {
        fontSize: '11px',
        color: '#9CA3AF',
    },
    remarkText: {
        fontSize: '11px',
        color: '#FC8181',
        marginTop: '4px',
    },
    iframeContainer: {
        width: '100%',
        height: '350px',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.09)',
        marginBottom: '20px',
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
    },
    toggleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        padding: '8px 0',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
    },
    segmentList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    segmentCard: {
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '10px',
        padding: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        textAlign: 'left',
        color: '#f0f4ff',
    },
    segmentDetails: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    supportTabSwitcher: {
        display: 'flex',
        backgroundColor: '#0a0d1d',
        borderRadius: '8px',
        padding: '3px',
        margin: '0 16px 16px 16px',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    supportTabBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '8px 0',
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#b8c5d6',
        borderRadius: '6px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
    },
    supportTabActiveBtn: {
        backgroundColor: '#2C3242',
        color: '#ffffff',
    },
    supportTabIcon: {
        opacity: 0.8,
    },
    supportTabBadge: {
        backgroundColor: '#EF4444',
        color: '#ffffff',
        fontSize: '9px',
        fontWeight: 'bold',
        borderRadius: '10px',
        padding: '1px 6px',
        marginLeft: '4px',
    },
    supportStatsRow: {
        display: 'flex',
        gap: '10px',
        padding: '0 16px',
        marginBottom: '16px',
    },
    supportStatBox: {
        flex: 1,
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '14px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
    },
    supportStatVal: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    supportStatLabel: {
        fontSize: '10px',
        fontWeight: '600',
        color: '#9CA3AF',
    },
    supportFiltersRow: {
        display: 'flex',
        gap: '8px',
        padding: '0 16px',
        marginBottom: '12px',
        overflowX: 'auto',
    },
    supportFilterPill: {
        padding: '4px 12px',
        borderRadius: '16px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#b8c5d6',
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    supportFilterPillActive: {
        color: '#10B981',
        border: '1px solid #10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    supportTicketsList: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: '12px',
        padding: '0 16px',
        marginBottom: '16px',
    },
    supportTicketCard: {
        display: 'flex',
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '14px 16px',
        alignItems: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    supportTicketIconBg: {
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        flexShrink: 0,
    },
    supportTicketMiddle: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    supportTicketId: {
        fontSize: '11px',
        color: '#10B981',
        fontWeight: 'bold',
    },
    supportTicketTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#ffffff',
    },
    supportTicketDate: {
        fontSize: '11px',
        color: '#9CA3AF',
        marginTop: '2px',
    },
    supportTicketRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
    },
    supportTicketStatusBadge: {
        fontSize: '9px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    supportRaiseBtn: {
        backgroundColor: '#10B981',
        color: '#ffffff',
        border: 'none',
        borderRadius: '12px',
        height: '46px',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: '16px 16px 8px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 'calc(100% - 32px)',
        boxSizing: 'border-box',
    },
    supportDeleteHelper: {
        fontSize: '11px',
        color: '#b8c5d6',
        textAlign: 'center',
        marginBottom: '20px',
    },
    supportHelpTabContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '0 16px',
    },
    supportTeamCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '24px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '8px',
    },
    supportTeamTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        margin: '0 0 6px 0',
    },
    supportTeamSub: {
        fontSize: '12px',
        color: '#9CA3AF',
        margin: 0,
        lineHeight: '1.4',
    },
    supportActionItemCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        border: 'none',
        width: '100%',
        textAlign: 'left',
    },
    supportActionIconBg: {
        width: '38px',
        height: '38px',
        borderRadius: '19px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        flexShrink: 0,
    },
    supportActionTextCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    supportActionTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#ffffff',
    },
    supportActionSub: {
        fontSize: '11px',
        color: '#9CA3AF',
    },
    supportDialogCard: {
        backgroundColor: 'rgba(8, 10, 22, 0.94)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '16px',
        padding: '20px 24px',
        width: '90%',
        maxWidth: '440px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
    },
    supportDialogHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    supportDialogTitleText: {
        fontSize: '15px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    supportDialogCloseBtn: {
        backgroundColor: 'transparent',
        border: 'none',
        color: '#9CA3AF',
        fontSize: '16px',
        cursor: 'pointer',
    },
    supportFormField: {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
        textAlign: 'left',
    },
    supportFormLabel: {
        fontSize: '11px',
        color: '#9CA3AF',
        marginBottom: '8px',
        fontWeight: 'bold',
    },
    supportCategoryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px',
    },
    supportCategoryPill: {
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.12)',
        color: '#b8c5d6',
        borderRadius: '8px',
        padding: '8px 4px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'center',
    },
    supportCategoryPillActive: {
        borderColor: '#10B981',
        color: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    supportInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '10px 12px',
        color: '#ffffff',
        fontSize: '13px',
        outline: 'none',
    },
    supportTextarea: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '8px',
        padding: '10px 12px',
        color: '#ffffff',
        fontSize: '13px',
        resize: 'none',
        outline: 'none',
    },
    supportFormActions: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
    supportResetBtn: {
        flex: 1,
        backgroundColor: 'transparent',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#b8c5d6',
        borderRadius: '8px',
        padding: '10px 0',
        fontWeight: 'bold',
        fontSize: '13px',
        cursor: 'pointer',
    },
    supportSubmitConfirmBtn: {
        flex: 2,
        backgroundColor: '#10B981',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 0',
        fontWeight: 'bold',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    depositContent: {
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
    },
    depositOnlineBtn: {
        backgroundColor: '#66bb6a',
        color: '#000000',
        border: 'none',
        borderRadius: '8px',
        height: '46px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
    depositDividerText: {
        margin: '24px 0',
        textAlign: 'center',
        color: '#ffffff',
        fontSize: '15px',
        fontWeight: '500',
    },
    depositField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '20px',
        textAlign: 'left',
    },
    depositLabel: {
        color: '#9CA3AF',
        fontSize: '14px',
        fontWeight: '500',
    },
    depositInput: {
        backgroundColor: '#5c708c',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#ffffff',
        fontSize: '15px',
        outline: 'none',
        height: '48px',
        boxSizing: 'border-box',
    },
    depositAttachBox: {
        height: '170px',
        borderRadius: '8px',
        backgroundColor: '#d6d9ce',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        marginBottom: '20px',
        boxSizing: 'border-box',
        padding: '16px',
        textAlign: 'center',
    },
    depositAttachPlaceholder: {
        color: '#000000',
        fontSize: '15px',
        fontWeight: 'bold',
        display: 'flex',
        flexDirection: 'column',
        lineHeight: '1.3',
    },
    depositAttachPreview: {
        color: '#000000',
        display: 'flex',
        flexDirection: 'column',
    },
    depositUploadBtn: {
        backgroundColor: '#ef5350',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        height: '48px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
    withdrawFormContainer: {
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
    },
    withdrawBalanceCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
    },
    withdrawBalanceLabel: {
        color: '#a1aab3',
        fontSize: '14px',
        fontWeight: '500',
    },
    withdrawBalanceValue: {
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: '700',
    },
    withdrawField: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginBottom: '16px',
        textAlign: 'left',
    },
    withdrawInputLabel: {
        color: '#9CA3AF',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '6px',
    },
    withdrawBigInput: {
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        color: '#ffffff',
        fontSize: '28px',
        fontWeight: 'bold',
        padding: '8px 0',
        outline: 'none',
        width: '100%',
    },
    withdrawMinLabel: {
        color: '#b8c5d6',
        fontSize: '11px',
        marginTop: '4px',
    },
    withdrawMethodRow: {
        display: 'flex',
        gap: '12px',
        marginTop: '6px',
    },
    withdrawMethodBtn: {
        flex: 1,
        height: '46px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'transparent',
        color: '#b8c5d6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
    },
    withdrawMethodActiveBtn: {
        backgroundColor: '#d6d9ce',
        color: '#1e201e',
        border: 'none',
    },
    withdrawSectionHeader: {
        color: '#a1aab3',
        fontSize: '13px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: '12px',
    },
    withdrawSubLabel: {
        color: '#b8c5d6',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: '8px',
    },
    withdrawUnderlineInput: {
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        color: '#ffffff',
        fontSize: '14px',
        padding: '8px 0',
        outline: 'none',
        width: '100%',
    },
    withdrawSubmitBtn: {
        height: '48px',
        borderRadius: '8px',
        border: 'none',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '24px',
        width: '100%',
        transition: 'all 0.2s ease',
    },
    withdrawSubmitBtnDisabled: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: '#b8c5d6',
        cursor: 'not-allowed',
    },
    withdrawSubmitBtnActive: {
        backgroundColor: '#10B981',
        color: '#ffffff',
    },
    withdrawDisclaimer: {
        color: '#b8c5d6',
        fontSize: '11px',
        lineHeight: '1.4',
        textAlign: 'center',
        marginTop: '12px',
        marginBottom: '32px',
    },
    withdrawHistoryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '0 16px',
        paddingBottom: '32px',
    },
    withdrawHistoryCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '16px',
        borderLeft: '4px solid #FFA726',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        textAlign: 'left',
    },
    withdrawHistoryHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    withdrawHistoryAmount: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#ffffff',
    },
    withdrawHistoryStatus: {
        fontSize: '10px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '10px',
    },
    withdrawHistoryBody: {
        fontSize: '13px',
        color: '#a1aab3',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        marginTop: '4px',
    },
    withdrawHistoryDivider: {
        height: '1px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        margin: '6px 0',
    },
    withdrawHistoryFooter: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        fontSize: '11px',
        color: '#b8c5d6',
    },
    calendarSubContainer: {
        backgroundColor: 'transparent',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    calendarSubHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backgroundColor: 'rgba(4, 6, 16, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },
    calendarBackBtn: {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
    },
    calendarSubHeaderTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: '0.5px',
        margin: 0,
        textTransform: 'uppercase',
    },
    calendarIframeContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        position: 'relative',
    },
    calendarIframe: {
        width: '100%',
        height: '100%',
        border: 'none',
    },
    calendarOpenSiteBtn: {
        marginLeft: 'auto',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#10B981',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
    },
    alertsContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    alertsHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '16px',
        width: '100%',
        boxSizing: 'border-box',
    },
    alertsBackBtn: {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
    },
    alertsTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: '0.5px',
        margin: 0,
    },
    alertsAddBtn: {
        marginLeft: 'auto',
        background: 'transparent',
        border: 'none',
        color: '#ffffff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertsStatsBar: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        margin: '0 16px 20px 16px',
        padding: '16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    alertsStatCol: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
    },
    alertsStatNum: {
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: 'bold',
    },
    alertsStatLabel: {
        color: '#9CA3AF',
        fontSize: '11px',
        marginTop: '4px',
    },
    alertsStatDivider: {
        width: '1px',
        height: '24px',
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    alertsList: {
        padding: '0 16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: '12px',
        paddingBottom: '32px',
    },
    alertsEmpty: {
        padding: '40px 16px',
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: '14px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    alertsEmptyBtn: {
        backgroundColor: '#d6d9ce',
        color: '#1e201e',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    alertCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    alertIconBg: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertInfo: {
        flex: 1,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    alertSymbol: {
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
    },
    alertCondition: {
        fontSize: '13px',
        fontWeight: '600',
    },
    alertWatching: {
        color: '#9CA3AF',
        fontSize: '11px',
        marginTop: '2px',
    },
    alertDeleteBtn: {
        background: 'transparent',
        border: 'none',
        color: '#9CA3AF',
        cursor: 'pointer',
        padding: '8px',
    },
    alertsSettingsList: {
        padding: '0 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '32px',
    },
    alertsSettingsHeading: {
        color: '#a1aab3',
        fontSize: '11px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        textAlign: 'left',
        letterSpacing: '0.5px',
        marginTop: '8px',
        marginBottom: '4px',
    },
    categoryCard: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    categoryIconBg: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    categoryInfo: {
        flex: 1,
        textAlign: 'left',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    categoryTitle: {
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '600',
    },
    categoryDesc: {
        color: '#9CA3AF',
        fontSize: '11px',
        lineHeight: '1.3',
    },
    thresholdGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '10px',
        marginTop: '8px',
    },
    thresholdBtn: {
        height: '38px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'transparent',
        color: '#b8c5d6',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    thresholdBtnActive: {
        borderColor: '#10B981',
        color: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    alertsWarningBox: {
        backgroundColor: 'rgba(237, 137, 54, 0.06)',
        border: '1px solid rgba(237, 137, 54, 0.15)',
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        gap: '10px',
        marginTop: '24px',
        textAlign: 'left',
    },
    alertsWarningText: {
        color: '#ED8936',
        fontSize: '11px',
        lineHeight: '1.4',
        flex: 1,
    },
    modalSymbolsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '6px',
    },
    symbolChip: {
        padding: '6px 14px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'transparent',
        color: '#b8c5d6',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    symbolChipActive: {
        backgroundColor: '#d6d9ce',
        color: '#1e201e',
        border: 'none',
    },
    modalButtonsRow: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px',
    },
    modalCancelBtn: {
        flex: 1,
        height: '44px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: 'transparent',
        color: '#b8c5d6',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    modalConfirmBtn: {
        flex: 2,
        height: '44px',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#d6d9ce',
        color: '#1e201e',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
};
