import React from 'react';
import { MessageCircle, Search, Mail, ShieldCheck } from 'lucide-react';

const Messages = ({ user }) => {
    if (!user || user.mode === 'guest') {
        return (
            <div className="messages-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
                <div className="empty-icon-bg float">
                    <Mail size={32} color="var(--emerald-400)" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>تسجيل الدخول مطلوب</h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>يجب أن تكون مسجلاً لإرسال واستقبال الرسائل المباشرة.</p>
            </div>
        );
    }

    return (
        <div className="messages-page animate-fade-in" style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <MessageCircle size={24} color="var(--emerald-400)" /> الرسائل
            </h2>

            <div className="search-bar" style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="ابحث عن أصدقاء أو رسائل..."
                    style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '15px' }}
                />
            </div>

            <div className="messages-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-xl)', padding: '40px', background: 'var(--bg-card)' }}>
                <div className="empty-icon-bg float" style={{ background: 'rgba(212, 175, 55, 0.1)', marginBottom: '24px' }}>
                    <ShieldCheck size={40} color="var(--gold-500)" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', textAlign: 'center' }}>الرسائل المشفرة قريباً</h3>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px', lineHeight: 1.6, marginBottom: '24px' }}>
                    نحن نعمل على بناء نظام مراسلة آمن ومشفر بالكامل لضمان خصوصيتك. ستتمكن من الدردشة مع أصدقائك بخصوصية تامة قريباً!
                </p>
                <div className="demo-contacts" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gradient-brand)', opacity: 0.5, border: '2px solid rgba(255,255,255,0.1)' }} />
                    ))}
                </div>
                <span className="pulse-dot" style={{ marginTop: '24px', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-400)', boxShadow: '0 0 10px var(--emerald-400)' }} />
            </div>
        </div>
    );
};

export default Messages;
