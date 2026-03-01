import React, { useState, useEffect } from 'react';
import { Compass, Search, Tv, TrendingUp, Loader2 } from 'lucide-react';
import { channelService, videoService } from '../services/puterService';
import PuterMedia from './PuterMedia';

const Explore = ({ onNavigate }) => {
    const [channels, setChannels] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadExploreData();
    }, []);

    const loadExploreData = async () => {
        setLoading(true);
        try {
            const [fetchedChannels, fetchedVideos] = await Promise.all([
                channelService.listAll(),
                videoService.getFeed(30) // Get more videos for explore
            ]);

            setChannels(fetchedChannels || []);
            setVideos(fetchedVideos || []);
        } catch (err) {
            console.error('Error loading explore data:', err);
        } finally {
            setLoading(false);
        }
    };

    const query = searchQuery.toLowerCase();
    const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(query));
    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(query) ||
        (v.description && v.description.toLowerCase().includes(query)) ||
        v.authorName.toLowerCase().includes(query)
    );

    if (loading) {
        return (
            <div className="explore-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="explore-page animate-fade-in" style={{ padding: '24px 16px' }}>
            {/* Search Header */}
            <div className="explore-header" style={{ marginBottom: '32px' }}>
                <div className="search-bar-large" style={{
                    display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-full)', padding: '12px 24px', gap: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="ابحث عن قنوات، مقاطع، أو مواضيع..."
                        style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '16px' }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Popular Channels */}
            {(filteredChannels.length > 0) && (
                <div className="explore-section" style={{ marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Tv size={20} color="var(--emerald-400)" /> القنوات البارزة
                    </h2>
                    <div className="channels-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px'
                    }}>
                        {filteredChannels.map(channel => (
                            <div key={channel.id} className="channel-card glass-card" style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius-lg)' }} onClick={() => onNavigate('view-channel', channel.id)}>
                                <div className="channel-avatar-lg" style={{
                                    width: '64px', height: '64px', borderRadius: '50%', background: 'var(--gradient-brand)',
                                    margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', fontWeight: 'bold', color: '#fff'
                                }}>
                                    {channel.name[0]}
                                </div>
                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{channel.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    اضغط لزيارة القناة
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Trending Videos */}
            <div className="explore-section">
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={20} color="var(--gold-500)" /> فيديوهات رائجة
                </h2>

                {filteredVideos.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 0', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)' }}>
                        <Compass size={32} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <p style={{ color: 'var(--text-muted)' }}>لا توجد فيديوهات للعرض حالياً.</p>
                    </div>
                ) : (
                    <div className="videos-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px'
                    }}>
                        {filteredVideos.map((video, idx) => (
                            <div
                                key={video.id}
                                className="video-card glass-card animate-fade-up stagger-1"
                                style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => onNavigate('view-channel', video.channelId)}
                            >
                                <div className="video-thumbnail" style={{ height: '160px', background: '#000', position: 'relative' }}>
                                    <PuterMedia path={video.videoUrl} type="video" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                                    <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                                        فيديو
                                    </div>
                                </div>
                                <div className="video-info" style={{ padding: '16px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {video.title}
                                    </h3>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>{video.authorName}</span>
                                        <span>{video.likes || 0} إعجاب</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Explore;
