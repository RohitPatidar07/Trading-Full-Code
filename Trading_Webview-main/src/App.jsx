import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { TradeProvider } from './context/TradeContext';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import Portfolio from './pages/Portfolio';
import Account from './pages/Account';
import OrderDetail from './pages/OrderDetail';
import AiAssistant from './pages/AiAssistant';
import { Login, SignUp, ChangePassword } from './pages/AuthPages';
import * as api from './services/api';
import { IndianRupee, FileText, Briefcase, User, LogOut, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import iconImage from './assets/icon.png';
import AppBackground from './components/AppBackground';
import useResponsive from './hooks/useResponsive';

// Protected Route Guard
function ProtectedRoute({ children }) {
    const hasSession = api.hasSession();
    if (!hasSession) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

// Layout wrapper including bottom tabs or desktop sidebar
function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Use responsive hook for breakpoint flags
    const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();

    const currentUser = api.getSessionUser();
    // Collapse sidebar on tablet devices by default
    const [isCollapsed, setIsCollapsed] = React.useState(isTablet);
    // Hide bottom tabs for sub-pages on mobile
    const showTabs = ['/', '/trades', '/portfolio', '/account'].includes(location.pathname);

    const handleLogout = () => {
        api.clearSession();
        navigate('/login');
    };

    // Show bottom tabs on all screens instead of sidebar
    const showSidebar = false;
    const showBottomTabs = true;

    return (
        <div style={{ ...styles.appLayout, flexDirection: 'column' }}>

            {/* Viewport content */}
            <div style={styles.viewContent}>
                <Routes>
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/trades" element={<ProtectedRoute><Trades /></ProtectedRoute>} />
                    <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
                    <Route path="/account/*" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                    <Route path="/ai-assistant" element={<ProtectedRoute><AiAssistant /></ProtectedRoute>} />
                    <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
                </Routes>
            </div>

            {/* Bottom Tab Bar (Mobile only) */}
            {showTabs && showBottomTabs && (
                <nav style={styles.tabBar}>
                    <Link to="/" style={{ ...styles.tabLink, color: location.pathname === '/' ? '#ffffff' : '#557599' }}>
                        <IndianRupee size={22} color={location.pathname === '/' ? '#ffffff' : '#557599'} />
                        <span style={styles.tabLabel}>Watchlist</span>
                    </Link>
                    <Link to="/trades" style={{ ...styles.tabLink, color: location.pathname === '/trades' ? '#ffffff' : '#557599' }}>
                        <FileText size={22} color={location.pathname === '/trades' ? '#ffffff' : '#557599'} />
                        <span style={styles.tabLabel}>Trades</span>
                    </Link>
                    <Link to="/portfolio" style={{ ...styles.tabLink, color: location.pathname === '/portfolio' ? '#ffffff' : '#557599' }}>
                        <Briefcase size={22} color={location.pathname === '/portfolio' ? '#ffffff' : '#557599'} />
                        <span style={styles.tabLabel}>Portfolio</span>
                    </Link>
                    <Link to="/account" style={{ ...styles.tabLink, color: location.pathname.startsWith('/account') ? '#ffffff' : '#557599' }}>
                        <User size={22} color={location.pathname.startsWith('/account') ? '#ffffff' : '#557599'} />
                        <span style={styles.tabLabel}>Account</span>
                    </Link>
                </nav>
            )}
        </div>
    );
}

function App() {
    return (
        <AppBackground>
            <Router>
                <TradeProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/*" element={<Layout />} />
                    </Routes>
                </TradeProvider>
            </Router>
        </AppBackground>
    );
}

const styles = {
    appLayout: {
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        backgroundColor: 'transparent',
        overflow: 'hidden',
        position: 'relative',
    },
    viewContent: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        position: 'relative',
        boxSizing: 'border-box',
    },
    tabBar: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '66px',
        backgroundColor: '#000000',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: '4px',
        zIndex: 50,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
    },
    tabLink: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        textDecoration: 'none',
        flex: 1,
        padding: '6px 0',
        transition: 'all 0.2s ease',
    },
    tabLabel: {
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '0.3px',
    },
    sidebar: {
        width: '260px',
        height: '100%',
        backgroundColor: 'rgba(6, 8, 20, 0.85)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        boxSizing: 'border-box',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 100,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
    },
    brandContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '40px',
        paddingLeft: '8px',
    },
    logoIcon: {
        width: '42px',
        height: '42px',
        borderRadius: '50%',
        backgroundColor: '#000000',
        border: '1.5px solid rgba(255, 255, 255, 0.25)',
        objectFit: 'contain',
    },
    brandName: {
        fontSize: '18px',
        fontWeight: '800',
        letterSpacing: '1px',
        color: '#ffffff',
    },
    sidebarNav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flex: 1,
    },
    sidebarLink: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        color: '#9ca3af',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.2s ease',
    },
    sidebarLinkActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        color: '#ffffff',
    },
    sidebarFooter: {
        marginTop: 'auto',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: '8px',
    },
    userName: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#ffffff',
    },
    userRole: {
        fontSize: '11px',
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginTop: '2px',
    },
    logoutBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        color: '#ff4d4d',
        padding: '10px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '700',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
    },
    logoutIconBtn: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.15)',
        width: '38px',
        height: '38px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        margin: '0 auto',
    },
    sidebarToggleBtn: {
        position: 'absolute',
        right: '-12px',
        top: '28px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#0a0c1c',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
        zIndex: 110,
        transition: 'all 0.2s ease',
    },
};

export default App;
