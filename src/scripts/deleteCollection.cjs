// src/scripts/deleteCollection.cjs
const admin = require('firebase-admin');

// --- KONFIGURASI ---
const serviceAccount = require('./serviceAccountKey.json');
const collectionName = 'games';
// -------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteCollection() {
  console.log(`Mulai proses penghapusan koleksi: ${collectionName}`);
  const collectionRef = db.collection(collectionName);
  const snapshot = await collectionRef.limit(500).get(); // Ambil hingga 500 dokumen sekaligus

  if (snapshot.size === 0) {
    console.log("Koleksi sudah kosong. Tidak ada yang perlu dihapus.");
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  try {
    await batch.commit();
    console.log(`Berhasil menghapus ${snapshot.size} dokumen.`);
    // Jika masih ada sisa, panggil fungsi ini lagi
    if (snapshot.size > 0) {
      await deleteCollection();
    }
  } catch (error) {
    console.error("Gagal menghapus batch:", error);
  }
}

// Konfirmasi sebelum menjalankan
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[31m%s\x1b[0m', `PERINGATAN: Skrip ini akan menghapus SEMUA data di dalam koleksi "${collectionName}".`);
readline.question('Apakah Anda yakin ingin melanjutkan? (ketik "hapus" untuk konfirmasi): ', async (answer) => {
  if (answer.toLowerCase() === 'hapus') {
    await deleteCollection();
    console.log("Proses penghapusan selesai.");
  } else {
    console.log("Proses dibatalkan.");
  }
  readline.close();
});