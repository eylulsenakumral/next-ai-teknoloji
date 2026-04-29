import React, { useState, useRef, useCallback, useEffect } from "react"
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  PanResponder,
  Dimensions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS, API_BASE_URL } from "../lib/constants"
import { getSessionToken } from "../lib/storage"

interface Message {
  role: "user" | "assistant"
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "Merhaba! Ben NexaDepo AI Danışmanı. Size güvenlik kameraları, NVR/DVR sistemleri ve ağ ürünleri konusunda yardımcı olabilirim. Ne arıyorsunuz?",
}

const MAX_HISTORY = 10
const FAB_SIZE = 52
const FAB_MARGIN = 16
const SNAP_DRAG_THRESHOLD = 5

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.ease }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true, easing: Easing.ease }),
          Animated.delay(600 - delay),
        ])
      )

    const a1 = animate(dot1, 0)
    const a2 = animate(dot2, 200)
    const a3 = animate(dot3, 400)
    a1.start()
    a2.start()
    a3.start()
    return () => {
      a1.stop()
      a2.stop()
      a3.stop()
    }
  }, [dot1, dot2, dot3])

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
  })

  return (
    <View style={styles.typingDotsRow}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  )
}

function MessageBubble({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  const isUser = message.role === "user"
  const isEmpty = message.content === "" && !isUser

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        {isEmpty && isStreaming ? (
          <TypingDots />
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
            {message.content}
          </Text>
        )}
      </View>
    </View>
  )
}

interface ChatWidgetProps {
  hideFab?: boolean
  externalOpen?: boolean
  onExternalClose?: () => void
  productContext?: string
}

export default function ChatWidget({
  hideFab = false,
  externalOpen,
  onExternalClose,
  productContext,
}: ChatWidgetProps = {}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const listRef = useRef<FlatList<Message>>(null)
  const abortRef = useRef<AbortController | null>(null)
  const insets = useSafeAreaInsets()
  // Keep a ref so PanResponder closures always read the latest insets value
  const insetsRef = useRef(insets)
  useEffect(() => {
    insetsRef.current = insets
  }, [insets])

  // Draggable FAB state — initialize to bottom-right, matching original static style
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window")
  const initialX = screenWidth - FAB_SIZE - FAB_MARGIN
  const initialY = screenHeight - FAB_SIZE - 90 - insets.bottom
  const position = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current
  const totalMovement = useRef(0)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2
      },
      onPanResponderGrant: () => {
        position.stopAnimation((currentValue) => {
          position.setOffset(currentValue)
          position.setValue({ x: 0, y: 0 })
        })
        totalMovement.current = 0
      },
      onPanResponderMove: (_, gestureState) => {
        totalMovement.current = Math.sqrt(
          gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy
        )
        position.setValue({ x: gestureState.dx, y: gestureState.dy })
      },
      onPanResponderRelease: () => {
        position.flattenOffset()

        // If movement was tiny, treat as a tap — TouchableOpacity onPress handles it
        if (totalMovement.current < SNAP_DRAG_THRESHOLD) {
          return
        }

        // Snap to nearest horizontal edge
        const { width: w, height: h } = Dimensions.get("window")
        const currentX = (position.x as unknown as { _value: number })._value
        const currentY = (position.y as unknown as { _value: number })._value
        const safeInsets = insetsRef.current

        const snapToRight = currentX + FAB_SIZE / 2 > w / 2
        const snapX = snapToRight ? w - FAB_SIZE - FAB_MARGIN : FAB_MARGIN

        // Clamp vertical within safe area
        const minY = safeInsets.top + 60
        const maxY = h - FAB_SIZE - safeInsets.bottom - 90
        const clampedY = Math.max(minY, Math.min(maxY, currentY))

        Animated.spring(position, {
          toValue: { x: snapX, y: clampedY },
          useNativeDriver: false,
          bounciness: 6,
          speed: 14,
        }).start()
      },
    })
  ).current

  // Sync with external open state
  useEffect(() => {
    if (externalOpen === true) {
      setMessages([initialMessage])
      setOpen(true)
    } else if (externalOpen === false) {
      setOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpen])

  // Override initial message when product context is provided
  const initialMessage: Message = productContext
    ? { role: "assistant", content: `Merhaba! "${productContext}" hakkında sorularınızı yanıtlamaktan memnuniyet duyarım. Ne sormak istersiniz?` }
    : INITIAL_MESSAGE

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true })
    }, 50)
  }, [])

  const handleOpen = useCallback(() => {
    setMessages([initialMessage])
    setOpen(true)
    scrollToBottom()
  }, [initialMessage, scrollToBottom])

  const handleClose = useCallback(() => {
    setOpen(false)
    abortRef.current?.abort()
    onExternalClose?.()
  }, [onExternalClose])

  const handleFabPress = useCallback(() => {
    // Only fire if it was a tap (not a drag); panResponder already guards
    // totalMovement check happens inside onPanResponderRelease for the drag path,
    // but TouchableOpacity's onPress fires after a genuine tap gesture.
    if (open) {
      handleClose()
    } else {
      handleOpen()
    }
  }, [open, handleClose, handleOpen])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    setInput("")

    const history = messages.slice(-MAX_HISTORY)
    const newMessages: Message[] = [...history, { role: "user", content: text }]
    const withPlaceholder: Message[] = [...newMessages, { role: "assistant", content: "" }]
    setMessages(withPlaceholder)
    setIsStreaming(true)
    scrollToBottom()

    abortRef.current = new AbortController()

    try {
      const token = await getSessionToken()
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
        headers["Cookie"] = `next-auth.session-token=${token}; __Secure-next-auth.session-token=${token}`
      }

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (!data || data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              fullText += parsed.text ?? parsed.content ?? ""
            } catch {
              fullText += data
            }
          } else if (line.trim() && !line.startsWith(":")) {
            // plain text stream fallback
            fullText += line.trim()
          }
        }

        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: fullText }
          return updated
        })
        scrollToBottom()
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.",
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      scrollToBottom()
    }
  }, [input, isStreaming, messages, scrollToBottom])

  const canSend = input.trim().length > 0 && !isStreaming

  return (
    <>
      {/* Draggable Floating Button */}
      {!hideFab && (
        <Animated.View
          style={[styles.fab, { left: position.x, top: position.y }]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={styles.fabInner}
            onPress={handleFabPress}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={open ? "Chat kapat" : "AI Danışman aç"}
          >
            <Ionicons
              name={open ? "close" : "chatbubble-ellipses"}
              size={24}
              color="#fff"
            />
            {!open && (
              <View style={styles.aiBadge}>
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Chat Modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kvContainer}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.headerIcon}>
                  <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>AI Ürün Danışmanı</Text>
                  <Text style={styles.headerSub}>NexaDepo</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Ionicons name="close" size={22} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <MessageBubble
                  message={item}
                  isStreaming={isStreaming && index === messages.length - 1}
                />
              )}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
            />

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                value={input}
                onChangeText={setInput}
                placeholder="Ürün sorun, öneri alın..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
                blurOnSubmit={false}
                editable={!isStreaming}
              />
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!canSend}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Gönder"
              >
                {isStreaming ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
    overflow: "visible",
  },
  fabInner: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  kvContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "65%",
    // make height relative to screen — Modal occupies full screen so 65% of flex parent
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    overflow: "hidden",
    flexShrink: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  messagesList: {
    padding: 12,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowAI: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    flexShrink: 0,
  },
  avatarText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: "#f0f0f0",
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextUser: {
    color: "#fff",
  },
  bubbleTextAI: {
    color: COLORS.text,
  },
  typingDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
})
