import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Video, ImagePlus, Loader2, PlayCircle } from 'lucide-react';
import { postService, videoService, bookmarkService, notificationService } from '../services/puterService';
import PuterMedia from './PuterMedia';
import CommentsSection from './CommentsSection';

const HomeFeed = ({ user }) => {
    const [feedData, setFeedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeComments, setActiveComments] = useState(null); // ID of post with open comments
    const [savedItems, setSavedItems] = useState(new Set()); // Set of saved item IDs
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    useEffect(() => {
        loadFeed();
        if (user && user.mode !== 'guest') {
            loadBookmarks();
        }
    }, [user]);

    const loadBookmarks = async () => {
        try {
            const items = await bookmarkService.getAll(user.id);
            const itemIds = items.map(b => b.contentId);
            setSavedItems(new Set(itemIds));
        } catch (err) {
            console.error('Error loading bookmarks:', err);
        }
    };

    const loadFeed = async () => {
        setLoading(true);
        try {
            // Load both posts and videos
            const [posts, videos] = await Promise.all([
                postService.getFeed(20),
                videoService.getFeed(20)
            ]);

            // Tag type, combine, and sort by date descending
            const combined = [
                ...posts.map(p => ({ ...p, _type: 'post' })),
                ...videos.map(v => ({ ...v, _type: 'video' }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            setFeedData(combined);
        } catch (err) {
            console.error('Error loading feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentClick = (itemId) => {
        setActiveComments(activeComments === itemId ? null : itemId);
    };

    const handleBookmark = async (item) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول لحفظ المحتوى');
            return;
        }

        try {
            setLoadingBookmarks(true);
            const isSaved = savedItems.has(item.id);

            if (isSaved) {
                // Remove bookmark
                await bookmarkService.remove(user.id, item.id);
                setSavedItems(prev => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                });
            } else {
                // Add bookmark
                await bookmarkService.add(user.id, {
                    contentId: item.id,
                    contentType: item._type,
                    title: item.title || item.content?.substring(0, 50) || 'محتوى محفوظ',
                    thumbUrl: item.thumbnailUrl || item.imageUrl || null
                });
                setSavedItems(prev => new Set(prev).add(item.id));
            }
        } catch (err) {
            console.error('Bookmark error:', err);
            alert('حدث خطأ أثناء حفظ المحتوى.');
        } finally {
            setLoadingBookmarks(false);
        }
    };

    const handleLike = async (item) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للإعجاب بالمحتوى');
            return;
        }

        // Optimistic UI update
        const diff = item.likedBy?.includes(user.id) ? -1 : 1;
        setFeedData(prev => prev.map(p => {
            if (p.id === item.id) {
                return {
                    ...p,
                    likes: Math.max(0, p.likes + diff),
                    likedBy: diff > 0
                        ? [...(p.likedBy || []), user.id]
                        : (p.likedBy || []).filter(id => id !== user.id)
                };
            }
            return p;
        }));

        try {
            if (item._type === 'post') {
                await postService.toggleLike(item.id, user.id);
            } else {
                await videoService.toggleLike(item.id, user.id);
            }

            // Send Notification ifLiked
            if (diff > 0 && item.authorId !== user.id) {
                await notificationService.push(item.authorId, {
                    type: 'like',
                    message: `أعجب بـ ${item._type === 'post' ? 'منشورك' : 'الفيديو الخاص بك'}`,
                    fromUser: user.name,
                    contentId: item.id
                });
            }
        } catch (err) {
            console.error('Like error:', err);
            loadFeed(); // revert on error
        }
    };

    const handleShare = (item) => {
        const url = window.location.origin + '?id=' + item.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المحتوى إلى الحافظة!');
        }).catch(err => {
            console.error('Failed to copy share link:', err);
        });
    };

    if (loading) {
        return (
            <div className="feed-column" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="feed-column">
            {/* Stories Placeholder */}
            <div className="glass" style={{ marginBottom: '28px', overflow: 'hidden' }}>
                <div className="stories-bar" style={{ minHeight: '100px', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                        <span className="text-secondary text-sm">القصص — قريباً</span>
                    </div>
                </div>
            </div>

            {feedData.length === 0 ? (
                <div className="empty-state animate-fade-up">
                    <div className="empty-icon-bg float">
                        <MessageCircle size={32} color="var(--emerald-400)" />
                    </div>
                    <p className="empty-text">لا توجد منشورات حتى الآن.</p>
                    <p className="empty-subtext">كن أول من ينشر محتوى نافع في صُحبة!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {feedData.map((item, i) => (
                        <article key={item.id} className={`post-card animate-fade-up stagger-${(i % 5) + 1}`}>

                            {/* Header */}
                            <div className="post-header">
                                <div className="post-user-info">
                                    <div className="post-avatar" style={{ background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                        {item.authorName?.[0] || '؟'}
                                    </div>
                                    <div>
                                        <div className="post-user-name">{item.authorName}</div>
                                        <div className="post-user-meta">
                                            <span>{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                                            {item._type === 'video' && (
                                                <>
                                                    <span>·</span>
                                                    <span style={{ color: 'var(--gold-500)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                        <Video size={12} /> فيديو
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-ghost" title="خيارات">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="post-body">
                                {item._type === 'video' ? (
                                    <>
                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>{item.title}</h3>
                                        <p style={{ marginBottom: '16px' }}>{item.description}</p>
                                        <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000', position: 'relative' }}>
                                            <PuterMedia
                                                path={item.videoUrl}
                                                type="video"
                                                controls={true}
                                                style={{ width: '100%', display: 'block' }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>{item.content}</p>
                                        {item.imageUrl && (
                                            <div className="post-media mt-3">
                                                <PuterMedia
                                                    path={item.imageUrl}
                                                    type="image"
                                                    style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer / Actions */}
                            <div className="post-footer">
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button
                                        className={`btn-action ${item.likedBy?.includes(user?.id) ? 'active' : ''}`}
                                        onClick={() => handleLike(item)}
                                    >
                                        <Heart size={20} fill={item.likedBy?.includes(user?.id) ? 'currentColor' : 'none'} />
                                        <span>{item.likes || 0}</span>
                                    </button>
                                    <button
                                        className={`btn-action ${activeComments === item.id ? 'active' : ''}`}
                                        onClick={() => handleCommentClick(item.id)}
                                        style={activeComments === item.id ? { color: 'var(--emerald-400)' } : {}}
                                    >
                                        <MessageCircle size={20} />
                                        <span>{item.comments || 0}</span>
                                    </button>
                                    <button className="btn-action" onClick={() => handleShare(item)} title="مشاركة">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                                <button
                                    className={`btn-action ${savedItems.has(item.id) ? 'active' : ''}`}
                                    onClick={() => handleBookmark(item)}
                                    disabled={loadingBookmarks}
                                    style={savedItems.has(item.id) ? { color: 'var(--gold-500)' } : {}}
                                >
                                    <Bookmark size={20} fill={savedItems.has(item.id) ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeComments === item.id && (
                                <CommentsSection
                                    contentId={item.id}
                                    contentType={item._type}
                                    contentOwnerId={item.authorId}
                                    user={user}
                                />
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomeFeed;
