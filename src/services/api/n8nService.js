/**
 * n8n Workflow Automation Service Adapter
 * 
 * Orchestrates event dispatching from MyGameON App to n8n webhook workflows.
 */

import apiClient from './apiClient';
import { INTEGRATIONS, isN8nClaimConfigured, buildWhatsAppUrl } from '../../config/integrations';

export const n8nService = {
  /**
   * Submit Shopee Order Claim (Alias for dispatchOrderClaim)
   * @param {Object} payload
   */
  async submitClaim(payload) {
    return this.dispatchOrderClaim(payload);
  },

  /**
   * Dispatch Shopee Order Claim to n8n Webhook
   * @param {Object} payload
   * @param {string} payload.invoice - Shopee Invoice ID
   * @param {string} payload.email - Customer Gmail
   * @param {'sims4' | 'pcgame'} payload.orderType - Order category
   * @param {string} [payload.gameTitle] - Game title for PC Games
   * @returns {Promise<{ success: boolean, fallbackRequired?: boolean, data?: any, error?: string }>}
   */
  async dispatchOrderClaim({ invoice, email, orderType = 'sims4', gameTitle = '' }) {
    const claimPayload = {
      invoice: invoice.trim(),
      email: email.trim().toLowerCase(),
      orderType,
      gameTitle: gameTitle.trim(),
      source: 'shopee',
      clientTimestamp: new Date().toISOString(),
      appOrigin: window.location.origin,
    };

    // If webhook is not configured yet (e.g. during initial rollout),
    // provide seamless fallback to WhatsApp confirmation
    if (!isN8nClaimConfigured()) {
      return {
        success: true,
        fallbackRequired: true,
        message: 'Webhook otomatisasi n8n belum diaktifkan. Dialihkan ke konfirmasi WhatsApp.',
        whatsappUrl: buildWhatsAppUrl({
          text: `Halo Admin MyGameON, saya ingin klaim pesanan Shopee:\n- No. Pesanan: ${claimPayload.invoice}\n- Email: ${claimPayload.email}\n- Kategori: ${orderType === 'sims4' ? 'The Sims 4' : (gameTitle || 'Game PC')}`,
        }),
        data: claimPayload,
      };
    }

    // Call configured n8n webhook
    const response = await apiClient.post(INTEGRATIONS.n8n.claimWebhookUrl, claimPayload, {
      timeoutMs: 12000,
    });

    if (!response.success) {
      return {
        success: false,
        fallbackRequired: true,
        error: response.error || 'Gagal mengirim data klaim ke server otomatisasi.',
        whatsappUrl: buildWhatsAppUrl({
          text: `Halo Admin MyGameON, saya mengalami kendala saat klaim di web untuk No. Pesanan: ${claimPayload.invoice} (${claimPayload.email}). Mohon bantuannya min.`,
        }),
        data: claimPayload,
      };
    }

    return {
      success: true,
      fallbackRequired: false,
      data: response.data || claimPayload,
    };
  },

  /**
   * Dispatch client-side error or telemetry to n8n monitoring webhook
   * @param {Object} errorPayload
   */
  async dispatchTelemetryAlert(errorPayload) {
    if (!INTEGRATIONS.n8n.telemetryWebhookUrl) return;

    try {
      await apiClient.post(INTEGRATIONS.n8n.telemetryWebhookUrl, {
        ...errorPayload,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }, { timeoutMs: 5000 });
    } catch {
      // Silently ignore telemetry dispatch errors
    }
  },
};

export default n8nService;
