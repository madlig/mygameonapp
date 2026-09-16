/**
 * scripts/test-shopee-parser.js
 * 
 * Test suite & simulator parser email Shopee toko MyGameON.
 * Memvalidasi logika regex yang dijalankan di n8n Code Node terhadap 3 email nyata.
 * 
 * Jalankan: node scripts/test-shopee-parser.js
 */

// ─── 1. FUNGSI PARSER UTAMA (Sama persis dengan n8n Code Node) ───
function parseShopeeEmail({ subject = '', bodyText = '', html = '' }) {
  const text = `${subject}\n${bodyText}\n${html}`;

  // 1. Ekstrak Nomor Pesanan (dari subject atau body)
  // Contoh subject: "Pesanan #2609167HFANPAD Siap Dikirim"
  // Contoh body: "No. Pesanan: #2609167HFANPAD" atau "No. Pesanan: 2609167HFANPAD"
  let invoice = null;
  const invoiceSubjectMatch = subject.match(/Pesanan\s*#?([A-Z0-9]{10,})/i);
  if (invoiceSubjectMatch) {
    invoice = invoiceSubjectMatch[1].trim().toUpperCase();
  } else {
    const invoiceBodyMatch = text.match(/(?:No\.\s*Pesanan:\s*#?|pembayaran\s+pesanan\s+#?)([A-Z0-9]{10,})/i);
    if (invoiceBodyMatch) {
      invoice = invoiceBodyMatch[1].trim().toUpperCase();
    }
  }

  // 2. Ekstrak Username Pembeli
  // Contoh: "Mohon segera kirimkan pesanan ke farrelajah." atau "ke ambraerikss1."
  let buyerUsername = 'Pembeli Shopee';
  const buyerMatch = text.match(/kirimkan\s+pesanan\s+ke\s+([a-zA-Z0-9._]+)/i);
  if (buyerMatch) {
    buyerUsername = buyerMatch[1].replace(/[.,]/g, '').trim();
  }

  // 3. Ekstrak Tanggal Pesanan
  // Contoh: "Tanggal Pesanan: 16 Sep 2026 20:22:19"
  let orderDate = new Date().toLocaleString('id-ID');
  const dateMatch = text.match(/Tanggal\s+Pesanan:\s*([^\n\r]+)/i);
  if (dateMatch) {
    orderDate = dateMatch[1].trim();
  }

  // 4. Ekstrak Setiap Item Game (Daftar bernomor 1., 2., 3., dst.)
  // Format Shopee:
  // 1. Marvel Spider Man 2 - Game PC Offline Action Adventure Full Version
  // Variasi: -
  // Jumlah: 1
  // Harga: Rp 10.122
  //
  // Batasi hanya di blok setelah "RINCIAN PESANAN" dan sebelum "Subtotal"
  // agar tidak keliru mencocokkan teks sambutan (misal: "ambraerikss1. Pembeli...")
  let itemsSection = text;
  const rincianIndex = text.search(/RINCIAN\s+PESANAN/i);
  if (rincianIndex !== -1) {
    itemsSection = text.slice(rincianIndex);
  }
  const subtotalIndex = itemsSection.search(/(?:Subtotal|LANGKAH\s+SELANJUTNYA)/i);
  if (subtotalIndex !== -1) {
    itemsSection = itemsSection.slice(0, subtotalIndex);
  }

  // Regex item bernomor yang diawali baris baru
  const itemRegex = /(?:^|[\r\n])\s*(\d+)\.\s+([^\n\r]+)(?:[\r\n]+\s*Variasi:\s*([^\n\r]*))?(?:[\r\n]+\s*Jumlah:\s*(\d+))?(?:[\r\n]+\s*Harga:\s*(Rp\s*[\d.,]+))?/g;
  const items = [];
  let match;

  while ((match = itemRegex.exec(itemsSection)) !== null) {
    const rawTitle = match[2].trim();
    const rawVariation = (match[3] || '').trim();
    const quantity = parseInt(match[4] || '1', 10);
    const price = (match[5] || '').trim();

    // Normalisasi variasi (hilangkan tanda hubung '-')
    const variation = rawVariation === '-' ? '' : rawVariation;

    // Bersihkan embel-embel judul panjang khas listing Shopee
    let cleanTitle = rawTitle
      .replace(/\s*-\s*Game PC.*$/i, '')
      .replace(/\s*-\s*PC Offline.*$/i, '')
      .replace(/\s*-\s*PC Game.*$/i, '')
      .replace(/\s*-\s*Bisa Auto Update.*$/i, '')
      .trim();

    // Cek apakah game adalah The Sims 4
    const isSims4 = /sims\s*4/i.test(cleanTitle) || /sims\s*4/i.test(rawTitle);

    // Cek apakah variasi mengizinkan Mod/CC
    const allowCC = /CC/i.test(variation) || /CC/i.test(rawTitle);

    items.push({
      index: parseInt(match[1], 10),
      title: cleanTitle,
      rawTitle: rawTitle,
      variation: variation,
      quantity: quantity,
      price: price,
      isSims4: isSims4,
      allowCC: allowCC,
    });
  }

  if (!invoice || items.length === 0) {
    return null;
  }

  return {
    invoice,
    buyerUsername,
    orderDate,
    items,
    totalGames: items.length,
    hasSims4: items.some((i) => i.isSims4),
    status: 'ready',
    source: 'n8n_gmail_automation',
    createdAt: new Date().toISOString(),
  };
}

// ─── 2. SAMPEL DATA DARI SCREENSHOT EMAIL NYATA ─────────────────

const SAMPLE_EMAILS = [
  {
    name: 'Sample 1: Single Game PC (Age of Empires 3)',
    subject: 'Pesanan #2609142PXHW1PB Siap Dikirim',
    bodyText: `
Hai mygameon,

Pembayaran pesanan #2609142PXHW1PB telah dikonfirmasi. Mohon segera kirimkan pesanan ke muhammadfakih01_. Pembeli mengharapkan pesanan diterima pada 23 September.

RINCIAN PESANAN
No. Pesanan: #2609142PXHW1PB
Tanggal Pesanan: 14 Sep 2026 20:56:07

1. Age of Empires 3 Definitive Edition - Game PC Offline Simulation Full Version
Variasi: -
Jumlah: 1
Harga: Rp 11.000

Subtotal: Rp 12.000
    `,
    expected: {
      invoice: '2609142PXHW1PB',
      buyerUsername: 'muhammadfakih01_',
      totalGames: 1,
      hasSims4: false,
      firstGameTitle: 'Age of Empires 3 Definitive Edition',
      allowCC: false,
    },
  },
  {
    name: 'Sample 2: Multi-Item Bundling (Spider-Man 2 + The Sims 3)',
    subject: 'Pesanan #2609167NYXSXQF Siap Dikirim',
    bodyText: `
Hai mygameon,

Pembayaran pesanan #2609167NYXSXQF telah dikonfirmasi. Mohon segera kirimkan pesanan ke farrelajah. Pembeli mengharapkan pesanan diterima pada 25 September.

RINCIAN PESANAN
No. Pesanan: #2609167NYXSXQF
Tanggal Pesanan: 16 Sep 2026 20:22:19

1. Marvel Spider Man 2 - Game PC Offline Action Adventure Full Version
Variasi: -
Jumlah: 1
Harga: Rp 10.122

2. The Sims 3 - Game PC Offline Simulation Full Version
Variasi: -
Jumlah: 1
Harga: Rp 9.277

Subtotal Rp 20.399
Ongkos Kirim Rp 0
Total Pembayaran Rp 21.370
    `,
    expected: {
      invoice: '2609167NYXSXQF',
      buyerUsername: 'farrelajah',
      totalGames: 2,
      hasSims4: false,
      firstGameTitle: 'Marvel Spider Man 2',
      secondGameTitle: 'The Sims 3',
      allowCC: false,
    },
  },
  {
    name: 'Sample 3: The Sims 4 with CC Variation',
    subject: 'Pesanan #2609167HFANPAD Siap Dikirim',
    bodyText: `
Hai mygameon,

Pembayaran pesanan 2609167HFANPAD telah dikonfirmasi. Mohon segera kirimkan pesanan ke ambraerikss1. Pembeli mengharapkan pesanan diterima pada 26 September.

RINCIAN PESANAN
No. Pesanan: 2609167HFANPAD
Tanggal Pesanan: 16 Sep 2026 10:01:27

1. The Sims 4 All DLC + Online Gallery + CC - Bisa Auto Update Lengkap PC
Variasi: ONLINE FULLPACK + CC
Jumlah: 1
Harga: Rp 84.399

Subtotal Rp 85.399
Ongkos Kirim Rp 0
Total Pembayaran Rp 83.399
    `,
    expected: {
      invoice: '2609167HFANPAD',
      buyerUsername: 'ambraerikss1',
      totalGames: 1,
      hasSims4: true,
      firstGameTitle: 'The Sims 4 All DLC + Online Gallery + CC',
      allowCC: true,
    },
  },
];

// ─── 3. RUNNER TEST SUITE ────────────────────────────────────────

console.log('====================================================');
console.log('🧪 MYGAMEON — SHOPEE EMAIL PARSER TEST SUITE');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;

SAMPLE_EMAILS.forEach((sample, idx) => {
  console.log(`[TEST ${idx + 1}] ${sample.name}`);
  const result = parseShopeeEmail({
    subject: sample.subject,
    bodyText: sample.bodyText,
  });

  if (!result) {
    console.error(`❌ GAGAL: Parser mengembalikan null untuk ${sample.name}`);
    failedCount++;
    return;
  }

  const exp = sample.expected;
  let testPassed = true;

  // Assert Invoice
  if (result.invoice !== exp.invoice) {
    console.error(`  ❌ Mismatch Invoice: got "${result.invoice}", expected "${exp.invoice}"`);
    testPassed = false;
  } else {
    console.log(`  ✓ Invoice: ${result.invoice}`);
  }

  // Assert Buyer
  if (result.buyerUsername !== exp.buyerUsername) {
    console.error(`  ❌ Mismatch Buyer: got "${result.buyerUsername}", expected "${exp.buyerUsername}"`);
    testPassed = false;
  } else {
    console.log(`  ✓ Buyer: ${result.buyerUsername}`);
  }

  // Assert Total Games
  if (result.totalGames !== exp.totalGames) {
    console.error(`  ❌ Mismatch Total Games: got ${result.totalGames}, expected ${exp.totalGames}`);
    testPassed = false;
  } else {
    console.log(`  ✓ Total Games: ${result.totalGames}`);
  }

  // Assert Has Sims 4
  if (result.hasSims4 !== exp.hasSims4) {
    console.error(`  ❌ Mismatch hasSims4: got ${result.hasSims4}, expected ${exp.hasSims4}`);
    testPassed = false;
  } else {
    console.log(`  ✓ Has Sims 4: ${result.hasSims4}`);
  }

  // Assert Game 1
  if (result.items[0]?.title !== exp.firstGameTitle) {
    console.error(`  ❌ Mismatch Game 1: got "${result.items[0]?.title}", expected "${exp.firstGameTitle}"`);
    testPassed = false;
  } else {
    console.log(`  ✓ Game 1 Title: "${result.items[0]?.title}"`);
  }

  // Assert Game 2 if multi-item
  if (exp.secondGameTitle && result.items[1]?.title !== exp.secondGameTitle) {
    console.error(`  ❌ Mismatch Game 2: got "${result.items[1]?.title}", expected "${exp.secondGameTitle}"`);
    testPassed = false;
  } else if (exp.secondGameTitle) {
    console.log(`  ✓ Game 2 Title: "${result.items[1]?.title}"`);
  }

  // Assert Allow CC
  if (result.items[0]?.allowCC !== exp.allowCC) {
    console.error(`  ❌ Mismatch allowCC: got ${result.items[0]?.allowCC}, expected ${exp.allowCC}`);
    testPassed = false;
  } else {
    console.log(`  ✓ Allow CC: ${result.items[0]?.allowCC}`);
  }

  if (testPassed) {
    console.log(`  🎉 Status: PASS\n`);
    passedCount++;
  } else {
    console.log(`  ⚠️ Status: FAIL\n`);
    failedCount++;
  }
});

console.log('====================================================');
console.log(`🏁 HASIL TEST: ${passedCount} Lulus, ${failedCount} Gagal`);
console.log('====================================================');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('✅ SELURUH TEST BERHASIL 100%! Parser siap digunakan di n8n.');
}
