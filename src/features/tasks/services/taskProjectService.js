// src/services/taskProjectService.js
import {
  db,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  setDoc,
} from '../../../config/firebaseConfig';
import { query, where, orderBy, serverTimestamp } from 'firebase/firestore';

// --- PROJECT FUNCTIONS ---

// Fungsi untuk menambahkan proyek baru
export const addProject = async (
  userId,
  projectName,
  projectDescription = ''
) => {
  try {
    const projectsCollectionRef = collection(db, `users/${userId}/projects`);
    const docRef = await addDoc(projectsCollectionRef, {
      name: projectName,
      description: projectDescription,
      createdAt: serverTimestamp(), // Menggunakan timestamp dari server Firestore
    });
    console.log('Project written with ID: ', docRef.id);
    return {
      id: docRef.id,
      name: projectName,
      description: projectDescription,
      createdAt: new Date(),
    };
  } catch (e) {
    console.error('Error adding project: ', e);
    throw e;
  }
};

// Fungsi untuk mendapatkan semua proyek untuk user tertentu
export const getProjects = (userId, callback) => {
  const projectsCollectionRef = collection(db, `users/${userId}/projects`);
  const q = query(projectsCollectionRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const projects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(projects);
    },
    (error) => {
      console.error('Error fetching projects: ', error);
    }
  );

  return unsubscribe;
};

// Fungsi untuk mengedit proyek
export const updateProject = async (userId, projectId, updatedData) => {
  try {
    const projectDocRef = doc(db, `users/${userId}/projects`, projectId);
    await setDoc(projectDocRef, updatedData, { merge: true });
    console.log('Project successfully updated!');
  } catch (e) {
    console.error('Error updating project: ', e);
    throw e;
  }
};

// Fungsi untuk menghapus proyek
export const deleteProject = async (userId, projectId) => {
  try {
    // Opsional: Hapus semua tugas terkait sebelum menghapus proyek
    // Anda perlu mengimpor writeBatch dari firebase/firestore jika ingin menggunakan ini
    // const tasksQuery = query(collection(db, `users/${userId}/tasks`), where("projectId", "==", projectId));
    // const tasksSnapshot = await getDocs(tasksQuery);
    // const batch = writeBatch(db);
    // tasksSnapshot.docs.forEach(d => {
    //   batch.delete(d.ref);
    // });
    // await batch.commit();

    await deleteDoc(doc(db, `users/${userId}/projects`, projectId));
    console.log('Project successfully deleted!');
  } catch (e) {
    console.error('Error deleting project: ', e);
    throw e;
  }
};

// --- TASK FUNCTIONS ---

// Fungsi untuk menambahkan task baru
export const addTask = async (userId, taskData) => {
  try {
    const tasksCollectionRef = collection(db, `users/${userId}/tasks`);
    const docRef = await addDoc(tasksCollectionRef, {
      ...taskData, // <-- Ini akan menyimpan 'location' dan 'taskType'
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, ...taskData, createdAt: new Date() };
  } catch (e) {
    console.error('Error adding task: ', e);
    throw e;
  }
};

// CATATAN: Fungsi getTasks ini tidak akan lagi dipanggil langsung dari TaskPage.jsx
// Namun, tetap penting untuk memiliki definisi yang benar jika Anda ingin menggunakannya di tempat lain.
export const getTasks = (
  userId,
  callback,
  projectId = null,
  isDaily = false
) => {
  const tasksCollectionRef = collection(db, `users/${userId}/tasks`);
  let q;

  if (projectId) {
    q = query(
      tasksCollectionRef,
      where('projectId', '==', projectId),
      where('isDailyTask', '==', false),
      orderBy('createdAt', 'desc')
    );
  } else if (isDaily) {
    q = query(
      tasksCollectionRef,
      where('isDailyTask', '==', true),
      where('projectId', '==', null),
      orderBy('createdAt', 'desc')
    );
  } else {
    // Untuk "All Tasks"
    q = query(tasksCollectionRef, orderBy('createdAt', 'desc'));
  }

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const tasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        deadline: doc.data().deadline?.toDate(),
      }));
      callback(tasks);
    },
    (error) => {
      console.error('Error fetching tasks: ', error);
    }
  );

  return unsubscribe;
};

// Fungsi untuk mengedit task
export const updateTask = async (userId, taskId, updatedData) => {
  try {
    const taskDocRef = doc(db, `users/${userId}/tasks`, taskId);
    await setDoc(taskDocRef, updatedData, { merge: true });
    console.log('Task successfully updated!');
  } catch (e) {
    console.error('Error updating task: ', e);
    throw e;
  }
};

// Fungsi untuk menghapus task
export const deleteTask = async (userId, taskId) => {
  try {
    await deleteDoc(doc(db, `users/${userId}/tasks`, taskId));
    console.log('Task successfully deleted!');
  } catch (e) {
    console.error('Error deleting task: ', e);
    throw e;
  }
};
