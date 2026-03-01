import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Film } from 'lucide-react';
import { shortsService, followService, notificationService } from '../services/puterService';
import PuterMedia from './PuterMedia';
import CommentsSection from './CommentsSection';

const ShortsFeed = ({ user }) => {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeComments, setActiveComments] = useState(null);
    const [followedChannels, setFollowedChannels] = useState(new Set());
    const [loadingFollow, setLoadingFollow] = useState(false);

    useEffect(() => {
        loadShorts();
        if (user && user.mode !== 'guest') {
            loadFollowing();
        }
    }, [user]);

    const loadFollowing = async () => {
        try {
            const list = await followService.getFollowing(user.id);
            setFollowedChannels(new Set(list));
        } catch (err) {
            console.error('Error loading following channels:', err);
        }
    };

    const loadShorts = async () => {
        setLoading(true);
        try {
            const data = await shortsService.getFeed(10);
            setShorts(data);
        } catch (err) {
            console.error('Error loading shorts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (short) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للإعجاب بالمحتوى');
            return;
        }

        // Optimistic UI update
        const diff = short.likedBy?.includes(user.id) ? -1 : 1;
        setShorts(prev => prev.map(s => {
            if (s.id === short.id) {
                return {
                    ...s,
                    likes: Math.max(0, s.likes + diff),
                    likedBy: diff > 0
                        ? [...(s.likedBy || []), user.id]
                        : (s.likedBy || []).filter(id => id !== user.id)
                };
            }
            return s;
        }));

        try {
            await shortsService.toggleLike(short.id, user.id);

            // Send Notification ifLiked
            if (diff > 0 && short.authorId !== user.id) {
                await notificationService.push(short.authorId, {
                    type: 'like',
                    message: `أعجب بمقطعك القصير`,
                    fromUser: user.name,
                    contentId: short.id
                });
            }
        } catch (err) {
            console.error('Like error:', err);
            loadShorts(); // revert on error
        }
    };

    const handleShare = (short) => {
        const url = window.location.origin + '?short=' + short.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المقطع إلى الحافظة!');
        }).catch(err => {
            console.error('Failed to copy share link:', err);
        });
    };

    const handleCommentClick = (shortId) => {
        setActiveComments(activeComments === shortId ? null : shortId);
    };

    const handleFollow = async (short) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للمتابعة.');
            return;
        }

        setLoadingFollow(true);
        try {
            const result = await followService.toggleFollow(user.id, short.channelId);
            setFollowedChannels(prev => {
                const next = new Set(prev);
                if (result.following) next.add(short.channelId);
                else next.delete(short.channelId);
                return next;
            });

            // Send Notification ifFollowed
            if (result.following) {
                await notificationService.push(short.authorId, {
                    type: 'follow',
                    message: `بدأ بمتابعة قناتك`,
                    fromUser: user.name
                });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setLoadingFollow(false);
        }
    };

    if (loading) {
        return (
            <div className="shorts-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    if (shorts.length === 0) {
        return (
            <div className="shorts-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <div className="empty-state animate-fade-up">
                    <div className="empty-icon-bg float">
                        <Film size={32} color="var(--emerald-400)" />
                    </div>
                    <p className="empty-text">لا توجد مقاطع قصيرة حتى الآن.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="shorts-page">
            <div className="shorts-container">
                {shorts.map((short, i) => (
                    <div key={short.id} className="short-item">
                        {/* Video Layer */}
                        <div className="short-video-container">
                            <PuterMedia
                                path={short.videoUrl}
                                type="video"
                                controls={true}
                                className="short-video"
                            />
                        </div>

                        {/* Overlay: Bottom Info */}
                        <div className="short-info-overlay">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div className="post-avatar" style={{ width: '36px', height: '36px', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                    {short.authorName?.[0] || '؟'}
                                </div>
                                <span style={{ fontWeight: 600, fontSize: '15px' }}>{short.authorName}</span>
                                {user?.id !== short.authorId && (
                                    <button
                                        className={followedChannels.has(short.channelId) ? "btn-outline" : "btn-brand"}
                                        style={followedChannels.has(short.channelId) ? { padding: '4px 12px', fontSize: '13px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)', border: 'none' } : { padding: '4px 12px', fontSize: '13px', borderRadius: '20px' }}
                                        onClick={() => handleFollow(short)}
                                        disabled={loadingFollow}
                                    >
                                        {followedChannels.has(short.channelId) ? 'تم المتابعة' : 'متابعة'}
                                    </button>
                                )}
                            </div>
                            <p style={{ fontSize: '14px', lineHeight: 1.5 }}>
                                {short.caption}
                            </p>
                        </div>

                        {/* Overlay: Right Actions */}
                        <div className="short-actions-overlay">
                            <button
                                className="short-action-btn"
                                onClick={() => handleLike(short)}
                            >
                                <div className={`action-icon-bg ${short.likedBy?.includes(user?.id) ? 'active' : ''}`}>
                                    <Heart size={24} fill={short.likedBy?.includes(user?.id) ? '#f43f5e' : 'none'} color={short.likedBy?.includes(user?.id) ? '#f43f5e' : 'white'} />
                                </div>
                                <span>{short.likes || 0}</span>
                            </button>

                            <button
                                className={`short-action-btn ${activeComments === short.id ? 'active' : ''}`}
                                onClick={() => handleCommentClick(short.id)}
                            >
                                <div className="action-icon-bg" style={activeComments === short.id ? { background: 'white' } : {}}>
                                    <MessageCircle size={24} color={activeComments === short.id ? '#1e293b' : 'white'} />
                                </div>
                                <span>{short.comments || 0}</span>
                            </button>

                            <button className="short-action-btn" onClick={() => handleShare(short)}>
                                <div className="action-icon-bg">
                                    <Share2 size={24} />
                                </div>
                                <span>مشاركة</span>
                            </button>

                            <button className="short-action-btn mt-4">
                                <div className="action-icon-bg" style={{ background: 'transparent' }}>
                                    <MoreHorizontal size={24} />
                                </div>
                            </button>
                        </div>

                        {/* Overlay: Comments Panel */}
                        {activeComments === short.id && (
                            <div className="short-comments-panel animate-fade-up" style={{
                                position: 'absolute', bottom: '0', left: '0', right: '0', height: '60%',
                                background: 'var(--bg-main)', borderTopLeftRadius: 'var(--radius-xl)',
                                borderTopRightRadius: 'var(--radius-xl)', zIndex: 10, padding: '16px',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>التعليقات</h3>
                                    <button onClick={() => setActiveComments(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '24px' }}>&times;</button>
                                </div>
                                <div style={{ height: 'calc(100% - 40px)', overflowY: 'auto' }}>
                                    <CommentsSection
                                        contentId={short.id}
                                        contentType="short"
                                        contentOwnerId={short.authorId}
                                        user={user}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShortsFeed;
