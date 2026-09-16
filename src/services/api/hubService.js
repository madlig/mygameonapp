/**
 * MyGameON Hub API Service Adapter
 * 
 * Direct contract-first client for endpoints served by MyGameON Hub backend:
 * - /api/sims4/validate (Sims 4 Launcher license validation)
 * - /api/sims4/order (Sims 4 license generation and order creation)
 * - /api/send (PC Game access sharing via Google Drive)
 * - /api/health (Hub system health check)
 */

import apiClient from './apiClient';
import { INTEGRATIONS } from '../../config/integrations';

const getHubUrl = (path) => {
  const base = INTEGRATIONS.hubApiUrl.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
};

export const hubService = {
  /**
   * Validate Sims 4 License & HWID
   * @param {Object} params
   * @param {string} params.hwid - Primary HWID
   * @param {string[]} [params.candidate_ids] - Candidate fallback hardware IDs
   * @param {string} [params.invoice] - License invoice key
   * @returns {Promise<{ success: boolean, data: any, error: string | null }>}
   */
  async validateSims4License({ hwid, candidate_ids = [], invoice = '' }) {
    return apiClient.post(getHubUrl('/sims4/validate'), {
      hwid,
      candidate_ids,
      invoice,
    });
  },

  /**
   * Submit Sims 4 Order to Hub
   * @param {Object} params
   * @param {string} params.invoice - Shopee Invoice/Order ID
   * @param {string} [params.email] - Customer Gmail address
   * @param {'email' | 'license'} [params.mode] - 'email' (share Drive + email) or 'license' (only create key in DB)
   * @param {boolean} [params.allowCC] - Whether CC access is granted
   * @returns {Promise<{ success: boolean, data: any, error: string | null }>}
   */
  async submitSims4Order({ invoice, email = '', mode = 'license', allowCC = false }) {
    return apiClient.post(getHubUrl('/sims4/order'), {
      invoice,
      email,
      mode,
      allowCC,
    });
  },

  /**
   * Share PC Game Drive Folder via Hub /api/send
   * @param {Object} params
   * @param {string} params.email - Customer email address
   * @param {Array<{ name: string }>} params.cart - Array of game items
   * @param {number} [params.expirationTime] - Expiration timestamp in ms
   * @param {boolean} [params.isBonus] - Bonus claim flag
   * @returns {Promise<{ success: boolean, data: any, error: string | null }>}
   */
  async sendGameAccess({ email, cart, expirationTime, isBonus = false }) {
    return apiClient.post(getHubUrl('/send'), {
      email,
      cart,
      expirationTime,
      isBonus,
    });
  },

  /**
   * Check Hub backend connection health
   * @returns {Promise<boolean>}
   */
  async checkHubHealth() {
    try {
      const res = await apiClient.get(getHubUrl('/health'), { timeoutMs: 5000 });
      return res.success;
    } catch {
      return false;
    }
  },
};

export default hubService;
