import 'dotenv/config';
import { startBakongSettlementWatcher } from '../services/paymentService.js';

startBakongSettlementWatcher();
console.log('[Bakong Auto-Verify] Watching Firestore KHQR sessions via Cambodia IP...');
