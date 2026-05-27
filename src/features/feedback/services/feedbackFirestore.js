// src/features/feedback/services/feedbackFirestore.js
//
// Firestore service for FAQ management and user questions.
// Collections: 'faqs', 'userQuestions'

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
// FAQ CRUD
// ════════════════════════════════════════════

/**
 * Real-time listener for all FAQ items (admin view — includes inactive).
 */
export const subscribeFaqs = (callback) => {
  const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
};

/**
 * Load only active FAQ items, sorted by order (for landing page).
 */
export const loadActiveFaqs = async () => {
  const q = query(
    collection(db, 'faqs'),
    where('isActive', '==', true),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Add a new FAQ item.
 */
export const addFaq = async ({ question, answer, order }) => {
  return addDoc(collection(db, 'faqs'), {
    question,
    answer,
    order: order ?? 999,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Update an existing FAQ item.
 */
export const updateFaq = async (id, updates) => {
  const ref = doc(db, 'faqs', id);
  return updateDoc(ref, { ...updates, updatedAt: serverTimestamp() });
};

/**
 * Delete a FAQ item.
 */
export const deleteFaq = async (id) => {
  return deleteDoc(doc(db, 'faqs', id));
};

/**
 * Batch update FAQ order (after drag-reorder).
 */
export const reorderFaqs = async (orderedIds) => {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(doc(db, 'faqs', id), {
      order: index,
      updatedAt: serverTimestamp(),
    });
  });
  return batch.commit();
};

/**
 * Seed FAQs from the static data file (one-time migration).
 */
export const seedFaqsFromStatic = async (faqItems) => {
  const existing = await getDocs(collection(db, 'faqs'));
  if (!existing.empty) return false; // Already seeded

  const batch = writeBatch(db);
  faqItems.forEach((item, index) => {
    const ref = doc(collection(db, 'faqs'));
    batch.set(ref, {
      question: item.question,
      answer: item.answer,
      order: index,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return true;
};

// ════════════════════════════════════════════
// USER QUESTIONS
// ════════════════════════════════════════════

/**
 * Submit a question from the landing page (public).
 */
export const submitUserQuestion = async ({ name, email, question }) => {
  return addDoc(collection(db, 'userQuestions'), {
    name,
    email,
    question,
    status: 'new', // 'new' | 'read' | 'answered'
    answer: null,
    promotedToFaq: false,
    createdAt: serverTimestamp(),
  });
};

/**
 * Real-time listener for user questions (admin view).
 */
export const subscribeUserQuestions = (callback) => {
  const q = query(
    collection(db, 'userQuestions'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
};

/**
 * Mark a question as read.
 */
export const markQuestionRead = async (id) => {
  return updateDoc(doc(db, 'userQuestions', id), { status: 'read' });
};

/**
 * Answer a user question.
 */
export const answerQuestion = async (id, answer) => {
  return updateDoc(doc(db, 'userQuestions', id), {
    answer,
    status: 'answered',
    answeredAt: serverTimestamp(),
  });
};

/**
 * Promote a user question to FAQ.
 * Creates a new FAQ entry and marks the question as promoted.
 */
export const promoteToFaq = async (questionDoc, faqCount) => {
  await addFaq({
    question: questionDoc.question,
    answer: questionDoc.answer,
    order: faqCount,
  });
  return updateDoc(doc(db, 'userQuestions', questionDoc.id), {
    promotedToFaq: true,
  });
};

/**
 * Delete a user question.
 */
export const deleteUserQuestion = async (id) => {
  return deleteDoc(doc(db, 'userQuestions', id));
};
