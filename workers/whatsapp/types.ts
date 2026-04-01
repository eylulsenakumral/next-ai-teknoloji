// ============================================================================
// WhatsApp Worker — Shared Types
// ============================================================================

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "qr_ready" | "error";

export interface WhatsAppContact {
  id: string;         // JID: 905551234567@s.whatsapp.net
  pushName?: string;
  verifiedName?: string;
}

export interface IncomingMessage {
  id: string;                  // WhatsApp message ID
  conversationId?: string;     // DB UUID (set after lookup/create)
  from: string;                // JID
  pushName?: string;
  body?: string;
  type: "text" | "image" | "document" | "audio" | "video" | "location" | "button";
  mediaUrl?: string;
  mediaCaption?: string;
  timestamp: number;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  toolCalls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
}

export interface ConversationContext {
  customerId?: string;
  customerName?: string;
  dealerCode?: string;
  lastIntent?: string;
  lastProducts?: Array<{ id: string; name: string }>;
  lastSearch?: string;
  pendingOrder?: PendingOrder;
  messageCount: number;
}

interface PendingOrder {
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    supplierProductId?: string;
    unitPrice?: number;
    vatRate?: number;
    profitMarginPct?: number;
    lineSubtotal?: number;
    lineVat?: number;
    lineTotal?: number;
    purchasePrice?: number;
  }>;
  notes?: string;
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}
