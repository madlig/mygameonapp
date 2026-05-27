// src/features/content/services/contentFirestore.js
//
// Firestore service for landing page content management.
// Collections: 'tutorials', 'downloads', 'prerequisites'

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';

// ════════════════════════════════════════════
// GENERIC HELPERS
// ════════════════════════════════════════════

const createCRUD = (collectionName) => {
  const col = () => collection(db, collectionName);

  return {
    /** Real-time listener — all items sorted by order (admin view). */
    subscribe: (callback) => {
      const q = query(col(), orderBy('order', 'asc'));
      return onSnapshot(q, (snap) => {
        callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });
    },

    /** Load active items only (landing page). */
    loadActive: async () => {
      const q = query(
        col(),
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },

    /** Add a new item. */
    add: async (data) => {
      return addDoc(col(), {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },

    /** Update an existing item. */
    update: async (id, updates) => {
      return updateDoc(doc(db, collectionName, id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    },

    /** Delete an item. */
    remove: async (id) => {
      return deleteDoc(doc(db, collectionName, id));
    },

    /** Batch reorder. */
    reorder: async (orderedIds) => {
      const batch = writeBatch(db);
      orderedIds.forEach((id, i) => {
        batch.update(doc(db, collectionName, id), {
          order: i,
          updatedAt: serverTimestamp(),
        });
      });
      return batch.commit();
    },

    /** Seed from static data if collection is empty. Returns true if seeded. */
    seed: async (items, transform) => {
      const snap = await getDocs(col());
      if (!snap.empty) return false;
      const batch = writeBatch(db);
      items.forEach((item, i) => {
        const ref = doc(col());
        batch.set(ref, {
          ...transform(item, i),
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      return true;
    },
  };
};

// ════════════════════════════════════════════
// TUTORIALS (Video)
// ════════════════════════════════════════════

export const tutorialsCRUD = createCRUD('tutorials');

export const seedTutorials = (staticItems) =>
  tutorialsCRUD.seed(staticItems, (item, i) => ({
    title: item.title,
    description: item.description,
    youtubeId: item.youtubeId || null,
    category: item.category || 'general',
    order: i,
  }));

// ════════════════════════════════════════════
// DOWNLOADS (App)
// ════════════════════════════════════════════

export const downloadsCRUD = createCRUD('downloads');

export const seedDownloads = (staticItems) =>
  downloadsCRUD.seed(staticItems, (item, i) => ({
    name: item.name,
    description: item.description,
    version: item.version || null,
    size: item.size || null,
    downloadUrl: item.downloadUrl || null,
    icon: item.icon || 'download',
    requirements: item.requirements || '',
    isAvailable: item.isAvailable ?? true,
    comingSoonNote: item.comingSoonNote || null,
    order: i,
  }));

// ════════════════════════════════════════════
// PREREQUISITES (Software)
// ════════════════════════════════════════════

export const prerequisitesCRUD = createCRUD('prerequisites');

export const seedPrerequisites = (staticItems) =>
  prerequisitesCRUD.seed(staticItems, (item, i) => ({
    name: item.name,
    description: item.description,
    url: item.url || '',
    icon: item.icon || 'monitor',
    order: i,
  }));
