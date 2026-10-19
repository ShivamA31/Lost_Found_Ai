import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Check } from 'lucide-react';
import api from '../api/client';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications')
      .then(res => setNotifications(res.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-beige font-inter">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-text hover:text-ink-black"><ArrowLeft size={20} /></Link>
        <h1 className="font-oswald text-2xl flex items-center gap-2">
          <Bell size={20} /> Notifications {unread > 0 && <span className="bg-brand-red text-white text-xs rounded-full px-2 py-0.5">{unread}</span>}
        </h1>
        {unread > 0 && (
          <button onClick={markAllRead} className="ml-auto text-sm text-brand-red hover:underline font-medium">Mark all read</button>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-20 text-muted-text">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-muted-text">No notifications yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all border-l-4 ${n.is_read ? 'border-transparent opacity-70' : 'border-brand-red'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{n.title}</p>
                    <p className="text-muted-text text-sm mt-0.5">{n.message}</p>
                  </div>
                  {n.is_read && <Check size={14} className="text-green-500 flex-shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-muted-text mt-2">{new Date(n.created_at).toLocaleString()}</p>
                {n.link && (
                  <Link to={n.link} className="text-xs text-brand-red hover:underline mt-1 inline-block" onClick={e => e.stopPropagation()}>
                    View →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
