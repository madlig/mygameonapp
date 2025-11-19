import { readFileSync } from 'fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Inisialisasi Test Environment
const testEnv = await initializeTestEnvironment({
  projectId: "mygameonwebsite", // Pastikan ini adalah Project ID Anda
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: 'localhost',
    port: 8080,
  },
});

describe("MyGameON Security Rules", () => {
  // Membersihkan data emulator sebelum setiap tes untuk memastikan isolasi
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // Membersihkan environment setelah semua tes selesai
  after(async () => {
    await testEnv.cleanup();
  });

  // --- Aturan untuk Koleksi 'games' ---
  it("Harus mengizinkan SIAPA SAJA membaca koleksi 'games'", async () => {
    // Setup: Sebagai admin, buat dulu dokumen untuk dibaca
    const adminDb = testEnv.authenticatedContext("admin_user").firestore();
    await setDoc(doc(adminDb, "games/testGame1"), {
    name: "Public Game",
    size: "1 GB",
    status: "Gdrive",
    genre: ["Adventure"],
    dateAdded: new Date()
});
    
    // Test: Sebagai pengguna tidak login (anonim), coba baca dokumen tersebut
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const testDocRef = doc(unauthedDb, "games/testGame1");
    await assertSucceeds(getDoc(testDocRef), "Pengguna anonim seharusnya bisa membaca.");
  });

  it("TIDAK BOLEH mengizinkan pengguna anonim menulis ke 'games'", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const testDocRef = doc(unauthedDb, "games/testGame2");
    await assertFails(setDoc(testDocRef, { name: "Hacker Game" }), "Pengguna anonim seharusnya TIDAK bisa menulis.");
  });

  it("HARUS mengizinkan pengguna yang login untuk menulis ke 'games' dengan data valid", async () => {
    const authedDb = testEnv.authenticatedContext("admin_user").firestore();
    const testDocRef = doc(authedDb, "games/testGame3");
    await assertSucceeds(setDoc(testDocRef, {
        name: "Valid Game",
        size: "10 GB",
        status: "Shopee",
        genre: ["RPG"],
        dateAdded: new Date() // Firestore akan mengkonversinya ke Timestamp
    }), "Pengguna terautentikasi seharusnya BISA menulis data yang valid.");
  });

  it("TIDAK BOLEH mengizinkan pengguna yang login menulis data TIDAK VALID ke 'games'", async () => {
    const authedDb = testEnv.authenticatedContext("admin_user").firestore();
    const testDocRef = doc(authedDb, "games/testGame4");
    // Tes dengan 'name' yang bukan string (seharusnya gagal berdasarkan aturan validasi kita)
    await assertFails(setDoc(testDocRef, { 
        name: 12345, // Tipe data salah
        size: "10 GB",
        status: "Shopee",
        genre: ["RPG"],
        dateAdded: new Date()
    }), "Menulis dengan tipe data 'name' yang salah seharusnya GAGAL.");
  });

});