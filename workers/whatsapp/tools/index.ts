// ============================================================================
// WhatsApp Tools — OpenAI Function Calling Definitions & Execution
// ============================================================================
import type { ToolDefinition, ConversationContext } from "../types";
import { searchProducts } from "./product-search";
import { getProductDetails } from "./product-details";
import { checkStock } from "./stock-check";
import { inquiryPrice } from "./price-inquiry";
import { createOrder } from "./order-create";
import { getCustomerInfo } from "./customer-info";
import { getCategories } from "./categories";

// ---------------------------------------------------------------------------
// Tool Definitions (OpenAI function calling format)
// ---------------------------------------------------------------------------
export const toolDefinitions: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_products",
      description:
        "Ürün ara. Müşteri bir ürün sorduğunda (kamera, kayıt cihazı, switch vb.) KULLAN. İsim, marka veya kategori ile arama yap.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Arama terimi (ürün adı, marka, kategori, barkod veya SKU)",
          },
          limit: {
            type: "number",
            description: "Maximum sonuç sayısı (varsayılan: 5)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_details",
      description:
        "Ürünün TÜM detaylarını getir. Özellikler, teknik spesifikasyonlar, disk kapasitesi, kanal sayısı, çözünürlük, PoE desteği gibi teknik bilgiler. Ürün bulunduktan sonra MUTLAKA kullan.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "Ürün UUID'si",
          },
          productName: {
            type: "string",
            description: "Ürün adı (productId yoksa)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_categories",
      description:
        "Tüm ürün kategorilerini listele. Müşteri kategorileri görmek isterse veya hangi kategorilerin olduğunu öğrenmek için kullan.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_stock",
      description:
        "Belirli bir ürünün stok durumunu kontrol et. Ürün ID veya adı ile sorgula.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "Ürün UUID'si",
          },
          productName: {
            type: "string",
            description: "Ürün adı (productId yoksa)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "inquiry_price",
      description:
        "Ürün fiyat bilgisi ver. DOĞRULAMAYA GÖRE: Bayi=alış+marj, Misafir=manualPrice.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "Ürün UUID'si",
          },
          productName: {
            type: "string",
            description: "Ürün adı (productId yoksa)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_order",
      description:
        "Müşteri onayından sonra sipariş oluştur. Müşteri doğrulaması yapıldıktan sonra çağır.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "Sipariş kalemleri",
            items: {
              type: "object",
              properties: {
                productId: { type: "string", description: "Ürün UUID'si" },
                supplierProductId: { type: "string", description: "Tedarikçi ürün UUID'si" },
                quantity: { type: "number", description: "Miktar" },
              },
              required: ["productId", "quantity"],
            },
          },
          notes: {
            type: "string",
            description: "Sipariş notları",
          },
        },
        required: ["items"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_customer_info",
      description:
        "Müşteri bilgilerini getir. Şirket adı, bayi kodu, bakiye, son siparişler.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Execution Router
// ---------------------------------------------------------------------------
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context: ConversationContext,
): Promise<unknown> {
  switch (name) {
    case "search_products":
      return searchProducts(args.query as string, (args.limit as number) ?? 5);
    case "get_product_details":
      return getProductDetails(
        args.productId as string | undefined,
        args.productName as string | undefined,
      );
    case "get_categories":
      return getCategories();
    case "check_stock":
      return checkStock(
        args.productId as string | undefined,
        args.productName as string | undefined,
      );
    case "inquiry_price":
      return inquiryPrice(
        args.productId as string | undefined,
        args.productName as string | undefined,
        context,
      );
    case "create_order":
      const orderItems = args.items as Array<{
        productId: string;
        supplierProductId?: string;
        quantity: number;
      }>;
      return createOrder(
        orderItems,
        args.notes as string | undefined,
        context,
      );
    case "get_customer_info":
      return getCustomerInfo(context);
    default:
      return `Bilinmeyen tool: ${name}`;
  }
}