import React, { useState, useEffect } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import { commentService, notificationService } from '../services/puterService';

const CommentsSection = ({ contentId, contentType, contentOwnerId, user }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [contentId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await commentService.getAll(contentId);
            setComments(data || []);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || user.mode === 'guest') return;

        setSubmitting(true);
        try {
            const comment = await commentService.add(contentId, {
                authorId: user.id,
                authorName: user.name,
                text: newComment.trim()
            });

            setComments(prev => [...prev, comment]);
            setNewComment('');

            // Send Notification if we aren't commenting on our own post
            if (contentOwnerId && contentOwnerId !== user.id) {
                await notificationService.push(contentOwnerId, {
                    type: 'comment',
                    message: `علّق على ${contentType === 'post' ? 'منشورك' : 'الفيديو الخاص بك'}: "${comment.text.substring(0, 30)}..."`,
                    fromUser: user.name,
                    contentId
                });
            }

        } catch (err) {
            console.error('Error adding comment:', err);
            alert('حدث خطأ أثناء إضافة التعليق.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                <Loader2 size={24} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="comments-section" style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>

            {/* Comments List */}
            <div className="comments-list" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', margin: '16px 0' }}>لا توجد تعليقات بعد. كن أول من يعلق!</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="comment-item animate-fade-in" style={{ display: 'flex', gap: '8px' }}>
                            <div className="comment-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>
                                {c.authorName?.[0] || '؟'}
                            </div>
                            <div className="comment-bubble" style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '4px 16px 16px 16px', flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--emerald-400)' }}>{c.authorName}</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p style={{ fontSize: '14px', color: '#fff', lineHeight: 1.5 }}>{c.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Input */}
            {user && user.mode !== 'guest' ? (
                <form onSubmit={handleSubmit} className="comment-form" style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="أضف تعليقاً..."
                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)', padding: '12px', color: '#fff', outline: 'none', resize: 'none', minHeight: '44px', fontSize: '14px' }}
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight) + 'px';
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        style={{ height: '44px', width: '44px', borderRadius: 'var(--radius-md)', background: 'var(--gradient-brand)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: !newComment.trim() || submitting ? 0.5 : 1, transition: 'all 0.2s', flexShrink: 0 }}
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} style={{ transform: 'rotate(180deg)' }} />}
                    </button>
                </form>
            ) : (
                <div style={{ textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <span>يجب تسجيل الدخول لإضافة تعليق.</span>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
