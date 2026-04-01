// ============================================================================
// Re-exports from workers/whatsapp for use in API routes
// ============================================================================
export {
  getConnectionStatus,
  getLatestQR,
  getSocket,
  onConnectionChange,
  connectWhatsApp,
  disconnectWhatsApp,
  sendTextMessage,
  sendImageMessage,
} from "../../../workers/whatsapp/client";
