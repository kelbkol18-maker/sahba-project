import React, { useState } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/supabaseService';

const WelcomeScreen = ({ onLogin, onGuest }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!email || !password || !displayName) {
                setError('يرجى ملء جميع الحقول');
                setLoading(false);
                return;
            }
            const user = await authService.signUp(email, password);
            // Create user profile in Supabase
            const profile = {
                id: user.id,
                email: user.email,
                display_name: displayName,
                avatar_url: null,
                created_at: new Date().toISOString(),
            };
            await userService.update(user.id, profile);
            onLogin({
                id: user.id,
                email: user.email,
                name: displayName,
                displayName: displayName,
                avatar: null,
                source: 'supabase',
            });
        } catch (err) {
            console.error('Sign up error:', err);
            setError(err.message || 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!email || !password) {
                setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
                setLoading(false);
                return;
            }
            const user = await authService.signIn(email, password);
            // Fetch user profile
            const profile = await userService.getById(user.id);
            onLogin({
                id: user.id,
                email: user.email,
                name: profile?.display_name || user.email,
                displayName: profile?.display_name || user.email,
                avatar: profile?.avatar_url || null,
                source: 'supabase',
            });
        } catch (err) {
            console.error('Sign in error:', err);
            setError(err.message || 'تعذّر تسجيل الدخول. تحقق من بيانات الدخول.');
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

                {/* Auth Form */}
                <form className="welcome-auth-form" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="اسم المستخدم"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={loading}
                            className="auth-input"
                        />
                    )}
                    <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="auth-input"
                    />
                    <input
                        type="password"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="auth-input"
                    />

                    {/* CTA Buttons */}
                    <div className="welcome-actions">
                        <button
                            type="submit"
                            className="btn-welcome-primary"
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
                            {loading ? 'جاري المعالجة...' : (isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول')}
                        </button>

                        <button
                            type="button"
                            className="btn-welcome-ghost"
                            onClick={() => setIsSignUp(!isSignUp)}
                            disabled={loading}
                        >
                            {isSignUp ? 'لديك حساب بالفعل؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ واحداً'}
                        </button>

                        <div className="welcome-or">
                            <span>أو</span>
                        </div>

                        <button
                            type="button"
                            className="btn-welcome-ghost"
                            onClick={handleGuest}
                            disabled={loading}
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
                </form>

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
