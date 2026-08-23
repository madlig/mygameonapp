import { addJokiCustomer } from './jokiFirebase';

export const INITIAL_ACTIVE_ORDERS = [
  {
    username: 'Ozann11223344',
    tiktokName: 'my idol plado',
    service: 'Basic',
    remainingMinutes: 60,
    duration: 1,
    price: 4000,
  },
  {
    username: 'Zzeeaaa80',
    tiktokName: 'RISKI.GG',
    service: 'Basic (AFK3)',
    remainingMinutes: 13,
    duration: 0.22,
    price: 1000,
  },
  {
    username: 'inception526',
    tiktokName: 'supernoob',
    service: 'VIP',
    remainingMinutes: 50,
    duration: 0.83,
    price: 5000,
  },
  {
    username: 'renfir50',
    tiktokName: 'someone',
    service: 'Basic (AFK5)',
    remainingMinutes: 25,
    duration: 0.42,
    price: 2000,
  },
  {
    username: 'tom97737',
    tiktokName: 'v444nz2',
    service: 'Basic (AFK6)',
    remainingMinutes: 35,
    duration: 0.58,
    price: 2500,
  },
  {
    username: 'kitiaxi',
    tiktokName: 'japz_10',
    service: 'Basic',
    remainingMinutes: 60,
    duration: 1,
    price: 4000,
  },
];

export const INITIAL_DONE_ORDERS = [
  { username: 'Ropzjiee', tiktokName: 'Ropzjiee', service: 'VIP', duration: 3.5, price: 21000 },
  { username: 'sadat', tiktokName: 'sadat', service: 'Basic (AFK)', duration: 0.75, price: 3000 },
  { username: 'zenxy', tiktokName: 'zenxy', service: 'Basic (AFK)', duration: 0.25, price: 1000 },
  { username: 'faiz drt racing', tiktokName: 'faiz drt racing', service: 'Basic (AFK)', duration: 0.5, price: 2000 },
  { username: 'goldenbrown', tiktokName: 'goldenbrown', service: 'Basic (AFK1)', duration: 2.25, price: 9000 },
  { username: 'REYYYY14352', tiktokName: 'REYYYY14352', service: 'Basic (AFK3)', duration: 1.25, price: 5000 },
  { username: 'stockdell1', tiktokName: 'falzz', service: 'Basic (AFK4)', duration: 3.25, price: 13000 },
  { username: 'brayen_1276', tiktokName: 'kevin', service: 'Basic (AFK5)', duration: 1.25, price: 5000 },
  { username: 'kamad1327', tiktokName: 'XEMTzy', service: 'Basic (AFK2)', duration: 2.0, price: 8000 },
  { username: 'Kamu_siap097', tiktokName: 'Kamu_siap097', service: 'Basic (AFK3)', duration: 2.0, price: 8000 },
  { username: 'orang_hatimu', tiktokName: 'orang_hatimu', service: 'Basic (AFK6)', duration: 1.0, price: 4000 },
  { username: 'Rizky_Rz02', tiktokName: 'Rizky_Rz02', service: 'Basic (AFK2)', duration: 0.5, price: 2000 },
  { username: 'goldenbrown', tiktokName: 'goldenbrown', service: 'Basic (AFK3)', duration: 0.75, price: 3000 },
  { username: 'nelson', tiktokName: 'nelson', service: 'VIP', duration: 1.0, price: 6000 },
  { username: 'sadat', tiktokName: 'sadat', service: 'Basic (AFK1)', duration: 0.75, price: 3000 },
  { username: 'Dapz', tiktokName: 'Dapz', service: 'Basic (AFK4)', duration: 1.0, price: 4000 },
  { username: 'BULEPALZU22', tiktokName: 'BULEPALZU22', service: 'Basic (AFK1)', duration: 1.0, price: 4000 },
  { username: 'tsubasaOzora451', tiktokName: 'tsubasaOzora451', service: 'VIP', duration: 2.0, price: 12000 },
  { username: 'hwshu', tiktokName: 'hwshu', service: 'Basic (AFK2)', duration: 2.0, price: 8000 },
  { username: 'stioklyuzlou881', tiktokName: 'stioklyuzlou881', service: 'Basic (AFK4)', duration: 1.0, price: 4000 },
  { username: 'inception526', tiktokName: 'inception526', service: 'Basic (AFK1)', duration: 1.0, price: 4000 },
];

export const seedGSheetsData = async () => {
  const now = Date.now();
  let count = 0;

  // 1. Seed Active Orders
  for (const active of INITIAL_ACTIVE_ORDERS) {
    const durationSeconds = active.remainingMinutes * 60;
    await addJokiCustomer({
      username: active.username,
      tiktokName: active.tiktokName,
      service: active.service,
      duration: active.duration,
      price: active.price,
      paymentStatus: 'Lunas',
      startTime: now,
      endTime: now + durationSeconds * 1000,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: false,
      stopped: false,
      stopTime: null,
      finishedTime: null,
    });
    count++;
  }

  // 2. Seed History (DONE) Orders
  for (let i = 0; i < INITIAL_DONE_ORDERS.length; i++) {
    const item = INITIAL_DONE_ORDERS[i];
    const offsetMs = (INITIAL_DONE_ORDERS.length - i) * 15 * 60 * 1000;
    const itemStartTime = now - offsetMs - item.duration * 3600 * 1000;
    const itemFinishedTime = now - offsetMs;

    await addJokiCustomer({
      username: item.username,
      tiktokName: item.tiktokName,
      service: item.service,
      duration: item.duration,
      price: item.price,
      paymentStatus: 'Lunas',
      startTime: itemStartTime,
      endTime: itemFinishedTime,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null,
      totalPausedSeconds: 0,
      finished: true,
      stopped: false,
      stopTime: null,
      finishedTime: itemFinishedTime,
    });
    count++;
  }

  return count;
};
