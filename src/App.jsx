import React, { useState, useEffect } from 'react';
import { Home, Compass, PlaySquare, Bell, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import HomeFeed from './components/HomeFeed';
import ShortsFeed from './components/ShortsFeed';
import RightPanel from './components/RightPanel';
import WelcomeScreen from './components/WelcomeScreen';
import CreateChannel from './components/CreateChannel';
import ChannelView from './components/ChannelView';
import CreateContent from './components/CreateContent';
import Explore from './components/Explore';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import Messages from './components/Messages';
import { channelService } from './services/puterService';
import './index.css';

function App() {
  const [authState, setAuthState] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [userChannel, setUserChannel] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);

  // Load Auth Stated channel info
  const [loadingChannel, setLoadingChannel] = useState(false);

  const mobileNavItems = [
    { icon: Home, view: 'home', label: 'الرئيسية' },
    { icon: Compass, view: 'explore', label: 'استكشف' },
    { icon: PlaySquare, view: 'shorts', label: 'مقاطع' },
    { icon: Bell, view: 'notifications', label: 'الإشعارات' },
    { icon: User, view: 'profile', label: 'حسابي' },
  ];

  // Load user channel when logged in (not guest)
  useEffect(() => {
    if (authState && authState.mode === 'user') {
      loadUserChannel(authState.id);
    }
  }, [authState]);

  const loadUserChannel = async (userId) => {
    setLoadingChannel(true);
    try {
      const channel = await channelService.getByOwner(userId);
      setUserChannel(channel);
    } catch (err) {
      console.error('Error loading channel:', err);
    } finally {
      setLoadingChannel(false);
    }
  };

  // Handlers
  const handleLogin = (userData) => {
    setAuthState({ mode: 'user', ...userData });
  };

  const handleGuest = () => {
    setAuthState({ mode: 'guest', id: 'guest', name: 'ضيف' });
  };

  const handleChannelCreated = (channel) => {
    setUserChannel(channel);
    setCurrentView('my-channel');
  };

  const handleNavigate = (view, payload = null) => {
    if (view === 'view-channel' && payload) {
      setSelectedChannelId(payload);
    }
    setCurrentView(view);
  };

  // ─── Show Welcome Screen if not authenticated ─────────────────────────────
  if (!authState) {
    return <WelcomeScreen onLogin={handleLogin} onGuest={handleGuest} />;
  }

  // ─── Main App ─────────────────────────────────────────────────────────────
  return (
    <>
      <div className="app-layout">
        <Sidebar
          setView={setCurrentView}
          currentView={currentView}
          user={authState}
          hasChannel={!!userChannel}
        />

        <main className="main-content">
          {currentView === 'home' && (
            <div className="home-grid">
              <HomeFeed user={authState} />
              <div className="aside-column">
                <RightPanel />
              </div>
            </div>
          )}

          {currentView === 'shorts' && <ShortsFeed user={authState} />}

          {/* Create Channel */}
          {currentView === 'create-channel' && (
            authState.mode === 'guest' ? (
              <div className="coming-soon-page">
                <h2 className="coming-soon-title">🔒</h2>
                <p className="coming-soon-desc">يجب تسجيل الدخول لإنشاء قناة</p>
              </div>
            ) : userChannel ? (
              // Already has channel → show it
              <ChannelView
                user={authState}
                channelId={userChannel.id}
                onNavigate={setCurrentView}
              />
            ) : (
              <CreateChannel
                user={authState}
                onCreated={handleChannelCreated}
                onCancel={() => setCurrentView('home')}
              />
            )
          )}

          {/* My Channel View */}
          {currentView === 'my-channel' && userChannel && (
            <ChannelView
              user={authState}
              channelId={userChannel.id}
              onNavigate={handleNavigate}
            />
          )}

          {/* Create Content View */}
          {currentView === 'create' && (
            authState.mode === 'guest' ? (
              <div className="coming-soon-page">
                <h2 className="coming-soon-title">🔒</h2>
                <p className="coming-soon-desc">يجب تسجيل الدخول لنشر محتوى</p>
              </div>
            ) : (
              <CreateContent
                user={authState}
                hasChannel={!!userChannel}
                channelId={userChannel?.id}
                onNavigate={handleNavigate}
              />
            )
          )}

          {/* Phase 5 Pages */}
          {currentView === 'explore' && <Explore onNavigate={handleNavigate} />}
          {currentView === 'notifications' && <Notifications user={authState} />}
          {currentView === 'profile' && <Profile user={authState} onNavigate={handleNavigate} />}
          {currentView === 'messages' && <Messages user={authState} />}

          {/* View Public Channel */}
          {currentView === 'view-channel' && (
            <ChannelView
              user={authState}
              channelId={selectedChannelId}
              onNavigate={handleNavigate}
            />
          )}

        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {mobileNavItems.map(item => (
          <button
            key={item.view}
            className={`mobile-nav-item ${currentView === item.view ? 'active' : ''}`}
            onClick={() => setCurrentView(item.view)}
          >
            <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default App;
