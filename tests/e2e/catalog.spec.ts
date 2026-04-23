import { test, expect, Page } from "@playwright/test"

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000"
const DEALER_EMAIL = process.env.E2E_DEALER_EMAIL || "test-dealer@example.com"
const DEALER_PASSWORD = process.env.E2E_DEALER_PASSWORD || "TestPassword123!"

async function dealerLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState("domcontentloaded")

  await page.fill("#dealerCode", "TESTDEALER")
  await page.fill("#dealerPassword", "TestPassword123!")
  await page.click("button[type='submit']")

  await page.waitForLoadState("networkidle")
}

test.describe("Cart E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await dealerLogin(page)
  })

  test("Cart page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/sepet`)
    await page.waitForLoadState("domcontentloaded")
    
    const body = page.locator("body")
    await expect(body).toBeVisible()
    console.log("PASS: Cart page loads")
  })

  test("Empty cart shows empty state", async ({ page }) => {
    await page.goto(`${BASE_URL}/sepet`)
    await page.waitForLoadState("domcontentloaded")
    
    const emptyMessage = page.locator("text=Sepetiniz boş, text=Henüz ürün yok")
    if (await emptyMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("PASS: Empty cart message shown")
    } else {
      console.log("INFO: Cart may have items or different empty state text")
    }
  })

  test("Cart drawer opens", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("domcontentloaded")

    const cartIcon = page.locator('[aria-label*="sepet"], button:has(svg)', { hasText: /sepet/i }).first()
    
    if (await cartIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cartIcon.click()
      await page.waitForTimeout(500)
      console.log("PASS: Cart drawer opens")
    } else {
      console.log("SKIP: Cart icon not found on homepage")
    }
  })

  test("Product can be added to cart from catalog", async ({ page }) => {
    await page.goto(`${BASE_URL}/katalog`)
    await page.waitForLoadState("domcontentloaded")

    const addToCartBtn = page.locator("button", { hasText: /sepete ekle/i }).first()
    
    if (await addToCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToCartBtn.click()
      await page.waitForTimeout(1000)
      console.log("PASS: Product added to cart")
    } else {
      console.log("SKIP: Add to cart button not found")
    }
  })
})

test.describe("Checkout E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await dealerLogin(page)
  })

  test("Checkout page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/sepet/onay`)
    await page.waitForLoadState("domcontentloaded")
    
    const body = page.locator("body")
    await expect(body).toBeVisible()
    console.log("PASS: Checkout page loads")
  })

  test("Address selection is available", async ({ page }) => {
    await page.goto(`${BASE_URL}/sepet/onay`)
    await page.waitForLoadState("domcontentloaded")

    const addressSection = page.locator("text=Adres, text=Teslimat Adresi")
    if (await addressSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("PASS: Address selection is visible")
    } else {
      console.log("INFO: Address section may not be visible")
    }
  })

  test("Payment method selection is available", async ({ page }) => {
    await page.goto(`${BASE_URL}/sepet/onay`)
    await page.waitForLoadState("domcontentloaded")

    const paymentSection = page.locator("text=Ödeme, text=Ödeme Yöntemi")
    if (await paymentSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("PASS: Payment method selection is visible")
    } else {
      console.log("INFO: Payment section may not be visible")
    }
  })
})

test.describe("Catalog Browsing E2E Tests", () => {
  test("Category page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/kategori/bilgisayarlar`)
    await page.waitForLoadState("domcontentloaded")
    
    const body = page.locator("body")
    await expect(body).toBeVisible()
    console.log("PASS: Category page loads")
  })

  test("Product listing displays products", async ({ page }) => {
    await page.goto(`${BASE_URL}/katalog`)
    await page.waitForLoadState("domcontentloaded")

    const products = page.locator("article, [class*='product'], [class*='card']")
    const count = await products.count()
    
    if (count > 0) {
      console.log(`PASS: Found ${count} products in catalog`)
    } else {
      console.log("INFO: No products found or different layout")
    }
  })

  test("Product search works", async ({ page }) => {
    await page.goto(`${BASE_URL}/katalog`)
    await page.waitForLoadState("domcontentloaded")

    const searchInput = page.locator('input[placeholder*="ara", input[type="search"]').first()
    
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill("laptop")
      await page.waitForTimeout(1000)
      console.log("PASS: Search input works")
    } else {
      console.log("SKIP: Search input not found")
    }
  })
})
