import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/api';
import { BASE_URL } from '../constants/Config';
import { useTrades } from '../context/TradeContext';
import { Eye, EyeOff } from 'lucide-react';
import iconImage from '../assets/icon.png';
import useResponsive from '../hooks/useResponsive';

export function Login() {
    const navigate = useNavigate();
    const { fetchInitialData } = useTrades();
    const { isMobile } = useResponsive();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await api.login(username, password, { deviceInfo: 'Mobile App WebView' });
            window.location.hash = '#/';
            window.location.reload();
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.authContainer}>
            <div style={styles.logoSection}>
                <div style={styles.logoContainer}>
                    <img src={iconImage} style={styles.logoImg} alt="VTRKM" />
                </div>
                <h1 style={styles.appName}>VTRKM</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ ...styles.form, maxWidth: isMobile ? '100%' : '380px', padding: isMobile ? '0 8px' : '0 16px' }}>
                {error && <div style={styles.errorAlert}>{error}</div>}

                <div style={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="User Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        className="auth-input"
                        required
                    />
                </div>

                <div style={styles.inputGroup}>
                    <div style={styles.passwordWrapper}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ ...styles.input, paddingRight: '40px' }}
                            className="auth-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={styles.eyeBtn}
                        >
                            {showPassword ? <EyeOff size={20} color="rgba(255, 255, 255, 0.6)" /> : <Eye size={20} color="rgba(255, 255, 255, 0.6)" />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn} className="auth-submit-btn">
                    {loading ? 'LOGGING IN...' : 'LOG IN'}
                </button>

                <p style={styles.disclaimerText}>
                    No real money involved. This is a Virtual Trading Application which has all the features to trade.
                    <br /><br />
                    This Application is used for exchanging views on markets for individual students for training purpose only.
                </p>

                <div style={styles.gotQuestionsRow}>
                    Got any questions? <span style={styles.contactLink} onClick={() => navigate('/signup')}>Contact Us</span>
                </div>
            </form>
        </div>
    );
}

export function SignUp() {
    const navigate = useNavigate();
    const { isMobile } = useResponsive();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username || !password || !email) {
            setError('Please fill in username, password, and email.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, phone })
            }).then(async res => {
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.message || 'Registration failed');
                }
            });
            
            setSuccess('Account created! Redirecting...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.authContainer}>
            <div style={styles.logoSection}>
                <div style={styles.logoContainer}>
                    <img src={iconImage} style={styles.logoImg} alt="VTRKM" />
                </div>
                <h1 style={styles.appName}>CREATE ACCOUNT</h1>
            </div>

            <form onSubmit={handleSubmit} style={{ ...styles.form, maxWidth: isMobile ? '100%' : '380px', padding: isMobile ? '0 8px' : '0 16px' }}>
                {error && <div style={styles.errorAlert}>{error}</div>}
                {success && <div style={styles.successAlert}>{success}</div>}

                <div style={styles.inputGroup}>
                    <input
                        type="text"
                        placeholder="User Name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        className="auth-input"
                        required
                    />
                </div>

                <div style={styles.inputGroup}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={styles.input}
                        className="auth-input"
                        required
                    />
                </div>

                <div style={styles.inputGroup}>
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={styles.input}
                        className="auth-input"
                    />
                </div>

                <div style={styles.inputGroup}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        className="auth-input"
                        required
                    />
                </div>

                <button type="submit" disabled={loading} style={styles.submitBtn} className="auth-submit-btn">
                    {loading ? 'CREATING...' : 'SIGN UP'}
                </button>

                <div style={styles.gotQuestionsRow}>
                    Already have account? <span style={styles.contactLink} onClick={() => navigate('/login')}>Log In</span>
                </div>
            </form>
        </div>
    );
}

export function ChangePassword() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await api.changePassword(currentPassword, newPassword);
            setSuccess('Password updated successfully!');
            setTimeout(() => navigate('/account'), 1500);
        } catch (err) {
            setError(err.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.changePasswordContainer}>
            <div style={styles.changePasswordHeader}>
                <button onClick={() => navigate('/account')} style={styles.changePasswordBackBtn}>←</button>
                <h3 style={styles.changePasswordTitle}>CHANGE PASSWORD</h3>
            </div>

            <form onSubmit={handleSubmit} style={styles.changePasswordForm}>
                {error && <div style={styles.errorAlert}>{error}</div>}
                {success && <div style={styles.successAlert}>{success}</div>}

                <div style={styles.changePasswordInputGroup}>
                    <label style={styles.changePasswordLabel}>Current Password</label>
                    <div style={styles.changePasswordWrapper}>
                        <input
                            type={showCurrent ? "text" : "password"}
                            placeholder="Enter Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            style={styles.changePasswordInput}
                            className="deposit-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowCurrent(!showCurrent)}
                            style={styles.changePasswordEyeBtn}
                        >
                            {showCurrent ? <EyeOff size={18} color="rgba(255, 255, 255, 0.6)" /> : <Eye size={18} color="rgba(255, 255, 255, 0.6)" />}
                        </button>
                    </div>
                </div>

                <div style={styles.changePasswordInputGroup}>
                    <label style={styles.changePasswordLabel}>New Password</label>
                    <div style={styles.changePasswordWrapper}>
                        <input
                            type={showNew ? "text" : "password"}
                            placeholder="Enter New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            style={styles.changePasswordInput}
                            className="deposit-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNew(!showNew)}
                            style={styles.changePasswordEyeBtn}
                        >
                            {showNew ? <EyeOff size={18} color="rgba(255, 255, 255, 0.6)" /> : <Eye size={18} color="rgba(255, 255, 255, 0.6)" />}
                        </button>
                    </div>
                </div>

                <div style={styles.changePasswordInputGroup}>
                    <label style={styles.changePasswordLabel}>Confirm New Password</label>
                    <div style={styles.changePasswordWrapper}>
                        <input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Enter Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            style={styles.changePasswordInput}
                            className="deposit-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            style={styles.changePasswordEyeBtn}
                        >
                            {showConfirm ? <EyeOff size={18} color="rgba(255, 255, 255, 0.6)" /> : <Eye size={18} color="rgba(255, 255, 255, 0.6)" />}
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} style={styles.changePasswordSubmitBtn}>
                    {loading ? 'UPDATING...' : 'CHANGE PASSWORD'}
                </button>
            </form>
        </div>
    );
}

const styles = {
    authContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        minHeight: '100%',
        position: 'relative',
        boxSizing: 'border-box',
        overflowY: 'auto',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '32px',
        width: '100%',
        maxWidth: '360px',
    },
    backBtn: {
        fontSize: '22px',
        color: '#ffffff',
        marginRight: '14px',
        backgroundColor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        cursor: 'pointer',
        width: '38px',
        height: '38px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    headerTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#f0f4ff',
        letterSpacing: '0.3px',
    },
    logoSection: {
        textAlign: 'center',
        marginBottom: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    logoContainer: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#000000',
        border: '2px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    },
    logoImg: {
        width: '90%',
        height: '90%',
        objectFit: 'contain',
    },
    appName: {
        fontSize: '34px',
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: '0.8px',
        margin: '8px 0 0 0',
        textAlign: 'center',
    },
    form: {
        width: '100%',
        maxWidth: '380px',
        backgroundColor: 'transparent',
        borderRadius: '0',
        border: 'none',
        padding: '0 16px',
        boxShadow: 'none',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        display: 'flex',
        flexDirection: 'column',
    },
    formBody: {
        width: '100%',
        backgroundColor: 'rgba(10, 12, 28, 0.82)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
    },
    inputGroup: {
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
    },
    passwordWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        padding: '12px 16px',
        color: '#ffffff',
        fontSize: '15px',
        width: '100%',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    },
    inputField: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '10px',
        padding: '12px 14px',
        color: '#f0f4ff',
        fontSize: '15px',
        width: '100%',
        transition: 'border-color 0.2s ease, background 0.2s ease',
    },
    label: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#9CA3AF',
        marginBottom: '8px',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
    },
    eyeBtn: {
        position: 'absolute',
        right: '12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        color: '#9CA3AF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtn: {
        backgroundColor: '#10B981',
        color: '#000000',
        fontSize: '15px',
        fontWeight: 'bold',
        padding: '14px',
        borderRadius: '10px',
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        marginTop: '24px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        transition: 'all 0.2s ease',
    },
    disclaimerText: {
        color: 'rgba(255, 255, 255, 0.75)',
        fontSize: '12.5px',
        lineHeight: '1.6',
        textAlign: 'center',
        marginTop: '24px',
        fontWeight: '400',
    },
    gotQuestionsRow: {
        marginTop: '64px',
        textAlign: 'center',
        fontSize: '14px',
        color: '#ffffff',
    },
    contactLink: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: '4px',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    errorAlert: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.35)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#FF6B6B',
        fontSize: '13px',
        marginBottom: '20px',
        lineHeight: '1.5',
        textAlign: 'center',
    },
    successAlert: {
        backgroundColor: 'rgba(0, 214, 143, 0.10)',
        border: '1px solid rgba(0, 214, 143, 0.35)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#00d68f',
        fontSize: '13px',
        marginBottom: '20px',
        lineHeight: '1.5',
        textAlign: 'center',
    },
    changePasswordContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        minHeight: '100%',
    },
    changePasswordHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        marginBottom: '28px',
        width: '100%',
    },
    changePasswordBackBtn: {
        fontSize: '24px',
        color: '#ffffff',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
    },
    changePasswordTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: '#ffffff',
        letterSpacing: '0.5px',
        margin: 0,
    },
    changePasswordForm: {
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
    },
    changePasswordInputGroup: {
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        textAlign: 'left',
    },
    changePasswordLabel: {
        color: '#9CA3AF',
        fontSize: '13px',
        fontWeight: '600',
    },
    changePasswordWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    changePasswordInput: {
        backgroundColor: '#5c708c',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 42px 12px 16px',
        color: '#ffffff',
        fontSize: '15px',
        outline: 'none',
        height: '48px',
        width: '100%',
        boxSizing: 'border-box',
    },
    changePasswordEyeBtn: {
        position: 'absolute',
        right: '12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    changePasswordSubmitBtn: {
        backgroundColor: '#ef5350',
        color: '#ffffff',
        border: 'none',
        borderRadius: '8px',
        height: '48px',
        fontSize: '15px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        boxSizing: 'border-box',
        marginTop: '24px',
    },
};
