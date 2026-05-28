// src/features/content/services/contentFirestore.js
//
// Firestore service for landing page content management.
// Collections: 'tutorials', 'downloads', 'prerequisites'

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
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
import { db, storage } from '../../../config/firebaseConfig';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

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

// ════════════════════════════════════════════
// BLOGS (Articles)
// ════════════════════════════════════════════

export const blogsCRUD = createCRUD('blogs');

export const seedBlogs = (staticItems) =>
  blogsCRUD.seed(staticItems, (item, i) => ({
    slug: item.slug,
    category: item.category,
    categoryColor: item.categoryColor || '#F97316',
    title: item.title,
    excerpt: item.excerpt || '',
    date: item.date,
    readTime: item.readTime || '3 min',
    author: item.author || 'Admin MyGameON',
    featured: item.featured ?? false,
    trending: item.trending ?? false,
    coverGradient: item.coverGradient || ['#0d0f14', '#1e3a5f', '#2563eb'],
    body: item.body || '',
    order: i,
  }));

// ════════════════════════════════════════════
// WINNING PRODUCT (single document)
// ════════════════════════════════════════════

const wpDocRef = () => doc(db, 'winningProduct', 'current');

/** Recommended cover: 800×500 (8:5). Max 2 MB. Auto-resized on client. */
const WP_IMG = { w: 800, h: 500, maxBytes: 2 * 1024 * 1024 };

/**
 * Resize an image File to target dimensions via OffscreenCanvas / Canvas.
 * Returns a JPEG Blob that fits within maxW × maxH while covering the area
 * (center-crop if aspect ratio differs).
 */
const resizeImage = (file, maxW = WP_IMG.w, maxH = WP_IMG.h) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = maxW;
      canvas.height = maxH;
      const ctx = canvas.getContext('2d');

      // Cover-crop: scale to fill, then center
      const srcRatio = img.width / img.height;
      const dstRatio = maxW / maxH;
      let sx = 0,
        sy = 0,
        sw = img.width,
        sh = img.height;
      if (srcRatio > dstRatio) {
        sw = img.height * dstRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dstRatio;
        sy = (img.height - sh) / 2;
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxW, maxH);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        0.88
      );
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });

export const winningProductService = {
  IMG_SPEC: WP_IMG,

  /** Load current winning product (public landing page). */
  load: async () => {
    const snap = await getDoc(wpDocRef());
    return snap.exists() ? snap.data() : null;
  },

  /** Real-time listener (admin). */
  subscribe: (callback) =>
    onSnapshot(wpDocRef(), (snap) =>
      callback(snap.exists() ? snap.data() : null)
    ),

  /** Save / overwrite the winning product. */
  save: async (data) =>
    setDoc(wpDocRef(), { ...data, updatedAt: serverTimestamp() }),

  /**
   * Upload cover image → Firebase Storage → return download URL.
   * Auto-resizes to 800×500 JPEG.
   */
  uploadCover: async (file) => {
    const blob = await resizeImage(file);
    const storageRef = ref(storage, `winning_product/cover_${Date.now()}.jpg`);
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(storageRef);
  },

  /** Delete old cover from Storage (best-effort). */
  deleteCover: async (url) => {
    if (!url) return;
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch {
      // ignore — file may already be gone
    }
  },
};
