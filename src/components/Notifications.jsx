import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, Heart, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { notificationService } from '../services/puterService';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadNotifications();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getAll(user.id);
            // Sort newest first
            data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setNotifications(data);

            // Mark all as read after loading them once seen
            setTimeout(() => {
                notificationService.markAllRead(user.id);
            }, 3000);
        } catch (err) {
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.mode === 'guest') {
        return (
            <div className="notifications-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
                <div className="empty-icon-bg float">
                    <AlertCircle size={32} color="var(--gold-500)" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>تسجيل الدخول مطلوب</h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>يجب أن تكون مسجلاً لترى إشعاراتك وتفاعلات أصدقائك.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="notifications-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={20} color="#f43f5e" />;
            case 'comment': return <MessageCircle size={20} color="var(--emerald-400)" />;
            case 'follow': return <UserPlus size={20} color="var(--brand-primary)" />;
            default: return <Bell size={20} color="var(--gold-500)" />;
        }
    };

    return (
        <div className="notifications-page animate-fade-in" style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Bell size={24} color="var(--emerald-400)" /> الإشعارات
            </h2>

            {notifications.length === 0 ? (
                <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)' }}>
                    <div className="float" style={{ width: '64px', height: '64px', background: 'rgba(5,150,105,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Bell size={32} color="var(--emerald-400)" />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>لا توجد إشعارات جديدة</h3>
                    <p style={{ color: 'var(--text-muted)' }}>عندما يتفاعل شخص ما مع محتواك، سيظهر إشعاره هنا.</p>
                </div>
            ) : (
                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {notifications.map((notif, i) => (
                        <div key={notif.id} className={`notification-card glass-card animate-fade-up stagger-${(i % 5) + 1}`} style={{
                            display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
                            borderRadius: 'var(--radius-lg)', background: notif.read ? 'var(--bg-card)' : 'rgba(5,150,105,0.05)',
                            borderLeft: notif.read ? 'transparent' : '4px solid var(--emerald-400)'
                        }}>
                            <div className="notif-icon" style={{
                                width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                {getIcon(notif.type)}
                            </div>
                            <div className="notif-content" style={{ flex: 1 }}>
                                <p style={{ fontSize: '15px', color: '#fff', marginBottom: '4px', lineHeight: 1.5 }}>
                                    {notif.fromUser && <strong style={{ color: 'var(--emerald-400)' }}>{notif.fromUser}</strong>}
                                    {' '}{notif.message}
                                </p>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    {new Date(notif.createdAt).toLocaleDateString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                                </span>
                            </div>
                            {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--emerald-400)' }} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
