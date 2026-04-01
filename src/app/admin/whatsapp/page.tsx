"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  RefreshCw,
  MessageSquare,
  Phone,
  Wifi,
  WifiOff,
  Loader2,
  ArrowLeft,
  User,
  Bot,
  Check,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Conversation {
  id: string;
  phoneNumber: string;
  customerName: string | null;
  customerId: string | null;
  customer: { id: string; companyName: string; dealerCode: string } | null;
  status: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  totalMessages: number;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  direction: "INBOUND" | "OUTBOUND";
  messageType: string;
  content: string | null;
  aiGenerated: boolean;
  aiModel: string | null;
  aiTokensUsed: number | null;
  status: string;
  createdAt: string;
}

interface WAStatus {
  status: "disconnected" | "connecting" | "connected" | "qr_ready" | "error";
  connectedUser: { id: string; name: string } | null;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// QR Code Component
// ---------------------------------------------------------------------------
function QRCodeDisplay({ qr }: { qr: string }) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    // Use a QR code API to render the string
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
  }, [qr]);

  return (
    <div className="flex justify-center p-4">
      {qrUrl && (
        <img
          src={qrUrl}
          alt="WhatsApp QR Code"
          className="rounded-lg border border-gray-200 dark:border-gray-700"
          width={300}
          height={300}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function WhatsAppAdminPage() {
  const [connectionStatus, setConnectionStatus] = useState<WAStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingPhone, setSendingPhone] = useState("");
  const [sendingMessage, setSendingMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch connection status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setConnectionStatus(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  // Fetch QR code when needed
  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/qrcode");
      const data = await res.json();
      if (data.qr) {
        setQrCode(data.qr);
      } else if (data.status === "connected") {
        setQrCode(null);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/conversations?limit=50");
      const data = await res.json();
      setConversations(data.conversations);
    } catch {
      // Ignore
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/whatsapp/conversations/${convId}/messages?limit=100`);
      const data = await res.json();
      setMessages(data.messages);
    } catch {
      // Ignore
    }
  }, []);

  // Connect
  const handleConnect = async () => {
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      setConnectionStatus({ status: "connecting", connectedUser: null, timestamp: new Date().toISOString() });
      // Poll for QR
      const pollQR = setInterval(async () => {
        const statusData = await fetchStatus();
        if (statusData?.status === "connected") {
          clearInterval(pollQR);
          setQrCode(null);
          return;
        }
        if (statusData?.status === "qr_ready" || statusData?.status === "connecting") {
          await fetchQR();
        }
      }, 2000);
    } catch {
      // Ignore
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const phone = selectedConv?.phoneNumber ?? sendingPhone;
    const msg = selectedConv ? newMessage : sendingMessage;

    if (!phone || !msg.trim()) return;

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message: msg,
          conversationId: selectedConv?.id,
        }),
      });

      const data = await res.json();
      if (data.success && selectedConv) {
        setNewMessage("");
        await fetchMessages(selectedConv.id);
        await fetchConversations();
      } else if (data.success) {
        setSendingMessage("");
      }
    } catch {
      // Ignore
    }
  };

  // Select conversation
  const handleSelectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setMessages([]);
    fetchMessages(conv.id);
  };

  // Back to list
  const handleBack = () => {
    setSelectedConv(null);
    setMessages([]);
  };

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchStatus();
      await fetchConversations();
      setLoading(false);
    };
    init();

    // Poll status + conversations every 10s
    const interval = setInterval(async () => {
      const statusData = await fetchStatus();
      if (statusData?.status === "qr_ready" && !connectionStatus?.connectedUser) {
        await fetchQR();
      }
      if (!selectedConv) {
        await fetchConversations();
      }
    }, 10000);

    setPollInterval(interval);
    return () => {
      if (pollInterval) clearInterval(interval);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = connectionStatus?.status ?? "disconnected";
  const isConnected = status === "connected";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            WhatsApp Yönetimi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            AI destekli WhatsApp müşteri hizmetleri
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className="flex items-center gap-1.5"
          >
            {isConnected ? (
              <><Wifi className="h-3 w-3" /> Bağlı</>
            ) : (
              <><WifiOff className="h-3 w-3" /> Bağlı Değil</>
            )}
          </Badge>
          {connectionStatus?.connectedUser && (
            <span className="text-sm text-muted-foreground">
              {connectionStatus.connectedUser.name}
            </span>
          )}
          {!isConnected && (
            <Button onClick={handleConnect}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Bağlan
            </Button>
          )}
          <Button variant="outline" onClick={() => { fetchStatus(); fetchConversations(); }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* QR Code Section */}
      {qrCode && !isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-5 w-5" />
              WhatsApp Bağlantı QR Kodu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              WhatsApp uygulamanızı açın → Bağlı Cihazlar → Cihaz Bağla → QR kodu tarayın
            </p>
            <QRCodeDisplay qr={qrCode} />
          </CardContent>
        </Card>
      )}

      {/* Connecting State */}
      {status === "connecting" && !qrCode && !isConnected && (
        <Card>
          <CardContent className="flex items-center justify-center py-8 gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>WhatsApp bağlantısı kuruluyor...</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className={cn(selectedConv ? "hidden lg:block" : "")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Konuşmalar ({conversations.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  Henüz konuşma yok
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv)}
                      className={cn(
                        "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                        selectedConv?.id === conv.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {conv.customerName || conv.customer?.companyName || conv.phoneNumber}
                          </div>
                          {conv.customer?.dealerCode && (
                            <div className="text-xs text-muted-foreground">
                              {conv.customer.dealerCode}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {conv.lastMessage || "..."}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {conv.lastMessageAt
                              ? new Date(conv.lastMessageAt).toLocaleDateString("tr-TR", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {conv.totalMessages}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Message View / Send Form */}
        <Card className={cn(!selectedConv ? "hidden lg:block" : "lg:col-span-2")}>
          {selectedConv ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={handleBack} className="lg:hidden">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedConv.customerName || selectedConv.customer?.companyName || selectedConv.phoneNumber}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedConv.phoneNumber}
                      {selectedConv.customer && ` • ${selectedConv.customer.dealerCode}`}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant={selectedConv.status === "ACTIVE" ? "default" : "secondary"}>
                      {selectedConv.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <ScrollArea className="h-[500px] p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      Mesaj yükleniyor...
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-2 max-w-[85%]",
                            msg.direction === "INBOUND" ? "mr-auto" : "ml-auto flex-row-reverse"
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-lg px-3 py-2 text-sm",
                              msg.direction === "INBOUND"
                                ? "bg-muted"
                                : "bg-primary text-primary-foreground"
                            )}
                          >
                            {msg.content && (
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            )}
                            <div
                              className={cn(
                                "flex items-center gap-1.5 mt-1 text-[10px]",
                                msg.direction === "INBOUND"
                                  ? "text-muted-foreground"
                                  : "text-primary-foreground/70"
                              )}
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString("tr-TR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {msg.aiGenerated && (
                                <span className="flex items-center gap-0.5">
                                  <Bot className="h-2.5 w-2.5" /> AI
                                </span>
                              )}
                              {msg.direction === "OUTBOUND" && (
                                <Check className="h-2.5 w-2.5" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Reply input */}
                <div className="border-t p-4 flex gap-2">
                  <Input
                    placeholder="Mesaj yaz..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-base">Manuel Mesaj Gönder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Telefon Numarası</label>
                  <Input
                    placeholder="905551234567"
                    value={sendingPhone}
                    onChange={(e) => setSendingPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Mesaj</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                    placeholder="Mesajınızı yazın..."
                    value={sendingMessage}
                    onChange={(e) => setSendingMessage(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!sendingPhone.trim() || !sendingMessage.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mesaj Gönder
                </Button>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
