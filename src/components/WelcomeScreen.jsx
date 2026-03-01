import React, { useState } from 'react';
import { authService, userService } from '../services/puterService';

const WelcomeScreen = ({ onLogin, onGuest }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePuterLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const user = await authService.signIn();
            // Fetch the full profile we just created/updated
            const profile = await userService.getProfile(user.username);
            onLogin({
                id: user.username,
                name: user.username,
                displayName: profile?.displayName || user.username,
                avatar: null,
                channelId: profile?.channelId || null,
                source: 'puter',
            });
        } catch (err) {
            console.error('Puter login error:', err);
            setError('تعذّر تسجيل الدخول. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = () => {
        onGuest();
    };

    return (
        <div className="welcome-screen">
            {/* Background effects */}
            <div className="welcome-glow welcome-glow-1" />
            <div className="welcome-glow welcome-glow-2" />

            {/* Card */}
            <div className="welcome-card animate-fade-up">

                {/* Logo */}
                <div className="welcome-logo-wrapper">
                    <div className="welcome-logo-icon animate-pulse-glow">ص</div>
                    <div>
                        <h1 className="welcome-logo-name">صُحبة</h1>
                        <p className="welcome-logo-tagline">Suhba — Islamic Social</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="welcome-divider" />

                {/* Headline */}
                <div className="welcome-headline">
                    <h2>أهلاً بك 👋</h2>
                    <p>
                        منصة اجتماعية إسلامية آمنة للمحتوى الهادف.
                        <br />سجّل دخولك أو تابع كضيف.
                    </p>
                </div>

                {/* Features quick list */}
                <div className="welcome-features">
                    {[
                        { icon: '🛡️', text: 'محتوى آمن خالٍ من الحرام' },
                        { icon: '📿', text: 'مقاطع دينية وأناشيد' },
                        { icon: '🤝', text: 'تواصل مع أهل الخير' },
                    ].map((f, i) => (
                        <div key={i} className={`welcome-feature-item stagger-${i + 1} animate-fade-up`}>
                            <span className="feature-icon">{f.icon}</span>
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="welcome-actions">
                    <button
                        className="btn-welcome-primary"
                        onClick={handlePuterLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="btn-spinner" />
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                        )}
                        {loading ? 'جاري الدخول...' : 'تسجيل الدخول عبر Puter'}
                    </button>

                    <div className="welcome-or">
                        <span>أو</span>
                    </div>

                    <button
                        className="btn-welcome-ghost"
                        onClick={handleGuest}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        المتابعة كضيف
                    </button>

                    {error && (
                        <p className="welcome-error animate-fade-in">{error}</p>
                    )}
                </div>

                {/* Footer note */}
                <p className="welcome-footer-note">
                    بالمتابعة فأنت توافق على{' '}
                    <span style={{ color: 'var(--emerald-400)', cursor: 'pointer' }}>سياسة الاستخدام</span>
                    {' '}الإسلامية لصُحبة
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
