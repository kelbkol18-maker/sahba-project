import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Settings, Grid, Bookmark, Loader2, LayoutPanelLeft, Share2 } from 'lucide-react';
import { userService, postService, bookmarkService } from '../services/puterService';

const Profile = ({ user, onNavigate }) => {
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [savedItems, setSavedItems] = useState([]);
    const [activeTab, setActiveTab] = useState('posts'); // posts, saved
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profile, posts, saved] = await Promise.all([
                userService.getProfile(user.id),
                postService.getByUser(user.id),
                bookmarkService.getAll(user.id)
            ]);

            setProfileData(profile);
            setUserPosts((posts || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setSavedItems(saved || []);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (post) => {
        const url = window.location.origin + '?id=' + post.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المنشور!');
        });
    };

    if (!user || user.mode === 'guest') {
        return (
            <div className="profile-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
                <div className="empty-icon-bg float">
                    <User size={32} color="var(--emerald-400)" />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', color: '#fff' }}>تسجيل الدخول مطلوب</h2>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>يجب أن تكون مسجلاً لعرض وتعديل ملفك الشخصي.</p>
            </div>
        );
    }

    if (loading || !profileData) {
        return (
            <div className="profile-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="profile-page animate-fade-in" style={{ padding: '24px 16px', maxWidth: '800px', margin: '0 auto' }}>

            {/* Header Profile Section */}
            <div className="profile-header glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', marginBottom: '32px', textAlign: 'center' }}>
                <div className="profile-avatar" style={{
                    width: '100px', height: '100px', borderRadius: '50%', background: 'var(--gradient-brand)',
                    margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', fontWeight: 'bold', color: '#fff', border: '4px solid rgba(255,255,255,0.1)',
                    position: 'relative'
                }}>
                    {profileData.displayName?.[0] || '?'}
                    <button style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', padding: '6px', color: '#fff', cursor: 'pointer' }}>
                        <Edit3 size={14} />
                    </button>
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                    {profileData.displayName}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Mail size={16} /> @{profileData.username}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={16} /> انضم {new Date(profileData.joinedAt).toLocaleDateString('ar-EG')}
                    </span>
                </div>

                <div className="profile-bio" style={{ maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {profileData.bio || 'لا توجد نبذة شخصية بعد. يمكنك إضافة نبذة ليتعرف عليك الآخرون بسهولة.'}
                </div>

                <div className="profile-actions" style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button className="btn-brand" style={{ padding: '10px 24px' }}>
                        تعديل الملف
                    </button>
                    <button className="btn-ghost" style={{ padding: '10px 16px' }}>
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Profile Statistics */}
            <div className="profile-stats glass-card" style={{ display: 'flex', justifyContent: 'space-around', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--emerald-400)', marginBottom: '4px' }}>{userPosts.length}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>منشور</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--emerald-400)', marginBottom: '4px' }}>{savedItems.length}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>محفوظات</div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="profile-tabs" style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
                <button
                    className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                    style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: activeTab === 'posts' ? 'var(--emerald-400)' : 'var(--text-muted)', borderBottom: activeTab === 'posts' ? '2px solid var(--emerald-400)' : '2px solid transparent', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <Grid size={18} /> منشوراتي
                </button>
                <button
                    className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                    style={{ flex: 1, padding: '16px', background: 'transparent', border: 'none', color: activeTab === 'saved' ? 'var(--emerald-400)' : 'var(--text-muted)', borderBottom: activeTab === 'saved' ? '2px solid var(--emerald-400)' : '2px solid transparent', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    <Bookmark size={18} /> العناصر المحفوظة
                </button>
            </div>

            {/* Tab Content */}
            <div className="profile-content">
                {activeTab === 'posts' && (
                    <div className="posts-tab animate-fade-up">
                        {userPosts.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                                <LayoutPanelLeft size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)' }}>لم تقم بنشر أي شيء بعد.</p>
                                <button className="btn-brand mt-4" onClick={() => onNavigate('create')} style={{ marginTop: '16px' }}>
                                    إنشاء منشور جديد
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {userPosts.map((post, i) => (
                                    <div key={post.id} className="post-card glass-card" style={{ padding: '16px', borderRadius: 'var(--radius-lg)' }}>
                                        <p style={{ color: '#fff', fontSize: '15px', lineHeight: 1.6 }}>{post.content}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <span>{new Date(post.createdAt).toLocaleDateString('ar-EG')}</span>
                                                <span>{post.likes || 0} إعجاب</span>
                                            </div>
                                            <button onClick={() => handleShare(post)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="saved-tab animate-fade-up">
                        {savedItems.length === 0 ? (
                            <div className="empty-state" style={{ padding: '40px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                                <Bookmark size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-muted)' }}>لم تقم بحفظ أي عناصر بعد.</p>
                            </div>
                        ) : (
                            <div className="saved-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                                {savedItems.map(item => (
                                    <div key={item.id} className="saved-item-card glass-card" style={{ padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {item.thumbUrl ? (
                                            <div style={{ width: '100%', height: '100px', borderRadius: 'var(--radius-sm)', background: '#000', overflow: 'hidden' }}>
                                                <img src={item.thumbUrl instanceof Blob ? URL.createObjectURL(item.thumbUrl) : item.thumbUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%', height: '100px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <LayoutPanelLeft size={24} color="var(--text-muted)" />
                                            </div>
                                        )}
                                        <h4 style={{ fontSize: '13px', color: '#fff', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</h4>
                                        <span style={{ fontSize: '11px', color: 'var(--emerald-400)', textTransform: 'uppercase' }}>{item.contentType}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Profile;
