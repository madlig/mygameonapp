// src/features/notifications/hooks/useNotifications.js
//
// Real-time notification listener for new requests & user questions.
// Plays a sound and tracks unread count via localStorage.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { useAuth } from '../../../contexts/AuthContext';
import { playNotificationSound } from '../utils/notificationSound';

const LS_KEY = 'mgo_notif_last_seen';

const getLastSeen = () => {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? new Date(v) : new Date(0);
  } catch {
    return new Date(0);
  }
};

const setLastSeen = (date) => {
  try {
    localStorage.setItem(LS_KEY, date.toISOString());
  } catch {
    // ignore
  }
};

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef(getLastSeen());
  const isInitialLoad = useRef({ requests: true, questions: true });

  // Merge items from both sources
  const requestsRef = useRef([]);
  const questionsRef = useRef([]);

  const rebuildItems = useCallback(() => {
    const merged = [...requestsRef.current, ...questionsRef.current].sort(
      (a, b) => b.timestamp - a.timestamp
    );
    setItems(merged.slice(0, 20));

    const unread = merged.filter(
      (item) => item.timestamp > lastSeenRef.current
    ).length;
    setUnreadCount(unread);
  }, []);

  // Listen to pending requests
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const newItems = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.() || new Date();
        return {
          id: `req_${d.id}`,
          type: 'request',
          title: data.title || 'Tanpa Judul',
          subtitle: 'Request game baru',
          timestamp: ts,
          href: '/requests',
        };
      });

      // Detect truly new items (not initial load)
      if (!isInitialLoad.current.requests && requestsRef.current.length > 0) {
        const existingIds = new Set(requestsRef.current.map((i) => i.id));
        const brandNew = newItems.filter((i) => !existingIds.has(i.id));
        if (brandNew.length > 0) {
          playNotificationSound();
        }
      }
      isInitialLoad.current.requests = false;

      requestsRef.current = newItems;
      rebuildItems();
    });

    return unsub;
  }, [currentUser, rebuildItems]);

  // Listen to new user questions
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'userQuestions'),
      where('status', '==', 'new'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const newItems = snap.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt?.toDate?.() || new Date();
        const preview =
          data.question?.length > 50
            ? data.question.slice(0, 50) + '...'
            : data.question || '';
        return {
          id: `q_${d.id}`,
          type: 'question',
          title: data.name || 'Anonim',
          subtitle: preview,
          timestamp: ts,
          href: '/feedback',
        };
      });

      if (!isInitialLoad.current.questions && questionsRef.current.length > 0) {
        const existingIds = new Set(questionsRef.current.map((i) => i.id));
        const brandNew = newItems.filter((i) => !existingIds.has(i.id));
        if (brandNew.length > 0) {
          playNotificationSound();
        }
      }
      isInitialLoad.current.questions = false;

      questionsRef.current = newItems;
      rebuildItems();
    });

    return unsub;
  }, [currentUser, rebuildItems]);

  const markAllRead = useCallback(() => {
    const now = new Date();
    lastSeenRef.current = now;
    setLastSeen(now);
    setUnreadCount(0);
  }, []);

  return { items, unreadCount, markAllRead };
};
