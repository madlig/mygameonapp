// scripts/sync-steam-requirements.cjs
// Utility script to fetch and parse official Steam PC requirements for games.
// Usage: node scripts/sync-steam-requirements.cjs [appId1] [appId2] ...

const https = require('https');

/**
 * Fetch app details from official Steam Store API
 */
function fetchSteamAppDetails(appId) {
  return new Promise((resolve, reject) => {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'MyGameON-Requirements-Sync/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed[appId] && parsed[appId].success) {
            resolve(parsed[appId].data);
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Clean HTML string into readable text lines
 */
function cleanHtml(htmlStr) {
  if (!htmlStr || typeof htmlStr !== 'string') return '';
  return htmlStr
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

/**
 * Parse raw Steam pc_requirements HTML into structured system requirements
 */
function parseSteamRequirements(appData) {
  if (!appData) return null;

  const pcReq = appData.pc_requirements;
  if (!pcReq || !pcReq.minimum) return null;

  const minRaw = cleanHtml(pcReq.minimum);
  const recRaw = pcReq.recommended ? cleanHtml(pcReq.recommended) : '';

  // 1. Extract RAM
  let minRamGB = 8;
  const ramMatch = minRaw.match(/(?:memory|ram)[:\s]*(\d+)\s*(gb|mb)/i);
  if (ramMatch) {
    const val = parseInt(ramMatch[1], 10);
    const unit = ramMatch[2].toLowerCase();
    minRamGB = unit === 'mb' ? Math.max(1, Math.round(val / 1024)) : val;
  }

  // 2. Extract Storage
  let minStorageGB = 20;
  const storageMatch = minRaw.match(/(?:storage|hard drive|space)[:\s]*(\d+)\s*(gb|mb)/i);
  if (storageMatch) {
    const val = parseInt(storageMatch[1], 10);
    const unit = storageMatch[2].toLowerCase();
    minStorageGB = unit === 'mb' ? Math.max(1, Math.round(val / 1024)) : val;
  }

  // 3. Extract Processor
  let minCpu = 'Intel Core i3 / AMD Ryzen 3';
  const cpuMatch = minRaw.match(/(?:^|\n)\s*(?:processor|cpu)[:\s]+([^\n\r]+)/i);
  if (cpuMatch) {
    minCpu = cpuMatch[1].trim();
  }

  // 4. Extract Graphics
  let minGpu = 'Intel HD Graphics / Dedicated VGA';
  const gpuMatch = minRaw.match(/(?:^|\n)\s*(?:graphics|video card)[:\s]+([^\n\r]+)/i);
  if (gpuMatch) {
    minGpu = gpuMatch[1].trim();
  }

  // 5. Determine Conservative Tier & Scores
  const gpuLower = minGpu.toLowerCase();
  const title = (appData.name || '').toLowerCase();

  const isSims4 = title.includes('the sims 4') || title.includes('sims 4');
  const isGtaV = title.includes('grand theft auto v') || title.includes('gta v');

  let tier = 'medium';
  let tierLabel = 'Game Menengah';
  let minCpuScore = 2.2;
  let minGpuScore = 2.2;
  let minGpuDedicated = false;

  // Strict check for dedicated GPU requirement
  const needsDedicatedGpu = (
    gpuLower.includes('gtx') ||
    gpuLower.includes('rtx') ||
    gpuLower.includes('rx ') ||
    gpuLower.includes('radeon rx') ||
    gpuLower.includes('vram') ||
    gpuLower.includes('dedicated') ||
    minRamGB >= 12 ||
    minStorageGB >= 60
  ) && !isSims4;

  if (isSims4) {
    tier = 'medium';
    tierLabel = 'Game Menengah (iGPU Ready)';
    minRamGB = Math.min(8, minRamGB);
    minCpuScore = 2.0;
    minGpuScore = 1.8;
    minGpuDedicated = false;
  } else if (isGtaV) {
    tier = 'medium';
    tierLabel = 'Game Menengah';
    minRamGB = 8;
    minCpuScore = 2.5;
    minGpuScore = 2.5;
    minGpuDedicated = false;
  } else if (
    minRamGB >= 16 || 
    minStorageGB >= 65 || 
    gpuLower.includes('rtx') || 
    gpuLower.includes('gtx 1060') ||
    gpuLower.includes('gtx 1070') ||
    gpuLower.includes('gtx 1080') ||
    gpuLower.includes('rx 580')
  ) {
    tier = 'ultra_heavy';
    tierLabel = 'Game Berat AAA';
    minCpuScore = 3.5;
    minGpuScore = 3.6;
    minGpuDedicated = true;
  } else if (minRamGB <= 4 && minStorageGB <= 15 && !needsDedicatedGpu) {
    tier = 'light';
    tierLabel = 'Game Ringan';
    minCpuScore = 1.2;
    minGpuScore = 1.2;
    minGpuDedicated = false;
  } else {
    tier = 'medium';
    tierLabel = 'Game Menengah';
    minCpuScore = 2.5;
    minGpuScore = needsDedicatedGpu ? 3.0 : 2.5;
    minGpuDedicated = needsDedicatedGpu;
  }

  return {
    steamAppId: appData.steam_appid,
    title: appData.name,
    tier,
    tierLabel,
    minRamGB,
    minStorageGB,
    minCpuScore,
    minGpuScore,
    minGpuDedicated,
    minCpuLabel: minCpu,
    minGpuLabel: minGpu,
    isSims4,
    isOfficialSteamData: true,
    syncedAt: new Date().toISOString(),
  };
}

// CLI Execution Demo / Test
async function main() {
  const appIds = process.argv.slice(2).length > 0 
    ? process.argv.slice(2) 
    : ['271590', '1222670', '1091500', '1245620', '413150']; // GTA V, Sims 4, Cyberpunk, Elden Ring, Stardew

  console.log(`\n🔍 Syncing Steam Requirements for App IDs: ${appIds.join(', ')}...\n`);

  for (const appId of appIds) {
    try {
      const data = await fetchSteamAppDetails(appId);
      if (!data) {
        console.warn(`[FAIL] App ID ${appId}: Tidak ditemukan di Steam Store.`);
        continue;
      }
      const parsed = parseSteamRequirements(data);
      console.log(`========================================`);
      console.log(`🎮 Game: ${parsed.title} (AppID: ${parsed.steamAppId})`);
      console.log(`⭐ Tier: ${parsed.tierLabel} (${parsed.tier})`);
      console.log(`💾 Min RAM: ${parsed.minRamGB} GB | Storage: ${parsed.minStorageGB} GB`);
      console.log(`🖥️ Min CPU: ${parsed.minCpuLabel}`);
      console.log(`🎨 Min GPU: ${parsed.minGpuLabel} (VGA Khusus: ${parsed.minGpuDedicated ? 'YA' : 'TIDAK'})`);
      console.log(`========================================\n`);
    } catch (err) {
      console.error(`[ERROR] Gagal memproses App ID ${appId}:`, err.message);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  fetchSteamAppDetails,
  parseSteamRequirements,
};
