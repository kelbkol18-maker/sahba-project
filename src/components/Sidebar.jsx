import React from 'react';
import { Home, Compass, PlaySquare, Bell, User, Settings, Search, MessageCircle, PlusSquare, Tv } from 'lucide-react';
import { notificationService } from '../services/puterService';

const Sidebar = ({ setView, currentView, user, hasChannel }) => {
    const [unreadCount, setUnreadCount] = React.useState(0);

    React.useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadUnreadCount();
            const interval = setInterval(loadUnreadCount, 30000); // Check every 30s
            return () => clearInterval(interval);
        }
    }, [user, currentView]); // Refetch on view change too

    const loadUnreadCount = async () => {
        try {
            const count = await notificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (err) {
            console.error('Sidebar notification fetch error:', err);
        }
    };

    const navItems = [
        { name: 'الرئيسية', icon: Home, view: 'home' },
        { name: 'استكشف', icon: Compass, view: 'explore' },
        { name: 'مقاطع', icon: PlaySquare, view: 'shorts' },
        { name: 'الرسائل', icon: MessageCircle, view: 'messages' },
        { name: 'الإشعارات', icon: Bell, view: 'notifications', badge: unreadCount },
        { name: 'إنشاء', icon: PlusSquare, view: 'create' },
    ];

    return (
        <aside className="sidebar">
            {/* Header with Logo + Search */}
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <div className="logo-icon animate-pulse-glow">ص</div>
                    <span className="logo-text">صُحبة</span>
                </div>
                <div className="search-box">
                    <Search size={18} color="var(--text-muted)" />
                    <input type="text" placeholder="ابحث في صحبة..." />
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setView(item.view)}
                        >
                            <span className="nav-icon">
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                {item.badge > 0 && (
                                    <span className="notification-badge animate-pulse">{item.badge}</span>
                                )}
                            </span>
                            <span>{item.name}</span>
                        </button>
                    );
                })}

                {/* Channel Button — only for logged-in users */}
                {user && user.mode === 'user' && (
                    <button
                        className={`nav-item ${['my-channel', 'create-channel'].includes(currentView) ? 'active' : ''}`}
                        onClick={() => setView(hasChannel ? 'my-channel' : 'create-channel')}
                    >
                        <span className="nav-icon">
                            <Tv size={22} strokeWidth={['my-channel', 'create-channel'].includes(currentView) ? 2.5 : 1.8} />
                        </span>
                        <span>{hasChannel ? 'قناتي' : 'إنشاء قناة'}</span>
                        {!hasChannel && (
                            <span style={{
                                marginRight: 'auto',
                                marginLeft: '0',
                                background: 'var(--gradient-brand)',
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-full)',
                                color: '#fff',
                                fontWeight: 700,
                            }}>جديد</span>
                        )}
                    </button>
                )}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setView('profile')}
                >
                    <span className="nav-icon">
                        <User size={22} strokeWidth={1.8} />
                    </span>
                    <span>الملف الشخصي</span>
                </button>
                <button className="nav-item">
                    <span className="nav-icon">
                        <Settings size={22} strokeWidth={1.8} />
                    </span>
                    <span>الإعدادات</span>
                </button>

                {/* User / Guest info strip */}
                {user && (
                    <div style={{
                        marginTop: '8px',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '50%',
                            background: user.mode === 'guest' ? 'rgba(212,175,55,0.15)' : 'var(--gradient-brand)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '15px', flexShrink: 0
                        }}>
                            {user.mode === 'guest' ? '👤' : (user.name ? user.name[0].toUpperCase() : '؟')}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.mode === 'guest' ? 'ضيف' : user.name}
                            </div>
                            {user.mode === 'guest' && (
                                <div className="guest-badge" style={{ fontSize: '11px', padding: '2px 8px', marginTop: '2px' }}>وضع الضيف</div>
                            )}
                            {user.mode === 'user' && hasChannel && (
                                <div style={{ fontSize: '11px', color: 'var(--emerald-400)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Tv size={12} /> صاحب قناة
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
