// src/scripts/bulkUpload.cjs
const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// --- KONFIGURASI ---
const serviceAccount = require('./serviceAccountKey.json');
const collectionName = 'games';
const csvFilePath = './LIST GAME(SELLER) - Sheet1.csv'; // Pastikan nama file CSV ini benar
// -------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const gamesMap = new Map();

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (row) => {
    const gameName = row['Nama Game'];
    if (!gameName) return;

    if (!gamesMap.has(gameName)) {
      gamesMap.set(gameName, { ...row, locations: [] });
    }
    
    const location = row['Lokasi Gdrive'];
    if (location) {
      gamesMap.get(gameName).locations.push(location);
    }
  })
  .on('end', async () => {
    console.log(`Membaca file CSV selesai. Ditemukan ${gamesMap.size} game unik.`);
    const batch = db.batch();
    
    for (const [name, details] of gamesMap.entries()) {
      
      // *** PERBAIKAN UTAMA ADA DI SINI ***
      let dateAdded;
      const dateString = details['Tanggal DIupload'] ? details['Tanggal DIupload'].trim() : null;

      // Cek apakah string tanggal ada dan valid
      if (dateString && new Date(dateString).toString() !== 'Invalid Date') {
        // Buat tanggal sebagai UTC untuk menghindari masalah zona waktu
        const parts = dateString.split('-');
        dateAdded = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      } else {
        // Jika tanggal kosong atau tidak valid, gunakan tanggal hari ini sebagai fallback
        dateAdded = new Date(); 
        if (dateString) { // Beri peringatan jika ada data tapi formatnya salah
            console.warn(`\x1b[33m[PERINGATAN] Format tanggal tidak valid untuk game "${name}" (Nilai: "${dateString}"). Menggunakan tanggal hari ini.\x1b[0m`);
        }
      }

      const gameData = {
        name: details['Nama Game'],
        type: details['Tipe'],
        status: details['Status'] || '',
        locations: details.locations,
        version: details['Versi'] || '',
        jumlahPart: parseInt(details['Jumlah Part'], 10) || 1,
        size: `${details['Size'] || ''} ${details['Unit'] || ''}`.trim(),
        dateAdded: dateAdded, // Gunakan tanggal yang sudah divalidasi dan di-handle
        description: details['Catatan'] || '',
        platform: 'PC',
        shopeeLink: '',
        coverArtUrl: '',
        genre: details['Genre'] ? details['Genre'].split(',').map(g => g.trim()) : [],
      };
      
      const docRef = db.collection(collectionName).doc();
      batch.set(docRef, gameData);
      console.log(`Menyiapkan: ${name}`);
    }

    try {
      console.log("Mengirim data ke Firestore...");
      await batch.commit();
      console.log(`\x1b[32m[BERHASIL] ${gamesMap.size} dokumen game unik telah diunggah.\x1b[0m`);
    } catch (error) {
      console.error("\x1b[31m[GAGAL] Gagal mengunggah data:\x1b[0m", error);
    }
  });