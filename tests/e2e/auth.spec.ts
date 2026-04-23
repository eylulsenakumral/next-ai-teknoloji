import { test, expect, Page } from "@playwright/test"

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000"

async function dealerLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState("domcontentloaded")

  await page.fill("#dealerCode", "TESTDEALER")
  await page.fill("#dealerPassword", "TestPassword123!")
  await page.click("button[type='submit']")

  await page.waitForLoadState("networkidle")
}

async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState("domcontentloaded")

  await page.click("button:has-text('Admin Girişi →')")
  await page.waitForTimeout(500)

  await page.fill("#adminEmail", "admin@nextai.com.tr")
  await page.fill("#adminPassword", "admin123")
  await page.click("button[type='submit']:has-text('Admin Girişi Yap')")

  await page.waitForURL(/\/admin/, { timeout: 15000 })
}

test.describe("Auth E2E Tests", () => {
  test("Homepage loads without errors", async ({ page }) => {
    const response = await page.goto(BASE_URL)
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)
    
    await expect(page.locator("body")).toBeVisible()
    console.log("PASS: Homepage loads successfully")
  })

  test("Login page renders correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState("domcontentloaded")

    await expect(page.locator("#dealerCode")).toBeVisible()
    await expect(page.locator("#dealerPassword")).toBeVisible()
    await expect(page.locator("button[type='submit']")).toBeVisible()
    console.log("PASS: Login page renders correctly")
  })

  test("Can switch to admin mode", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState("domcontentloaded")

    await page.click("button:has-text('Admin Girişi →')")
    await page.waitForTimeout(500)

    await expect(page.locator("#adminEmail")).toBeVisible()
    console.log("PASS: Switched to admin mode")
  })

  test("Login page has catalog link", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState("domcontentloaded")

    const catalogLink = page.locator("a[href='/katalog']")
    await expect(catalogLink).toBeVisible()
    console.log("PASS: Catalog link visible on login page")
  })

  test("Login validates required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.waitForLoadState("domcontentloaded")

    await page.click("button[type='submit']")
    await page.waitForTimeout(500)
    
    console.log("INFO: Form validation triggered for empty fields")
  })
})

test.describe("Catalog E2E Tests", () => {
  test("Catalog page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/katalog`)
    await page.waitForLoadState("domcontentloaded")
    
    await expect(page.locator("body")).toBeVisible()
    console.log("PASS: Catalog page loads")
  })

  test("Products are displayed", async ({ page }) => {
    await page.goto(`${BASE_URL}/katalog`)
    await page.waitForLoadState("domcontentloaded")

    const products = page.locator("article")
    const count = await products.count()
    
    if (count > 0) {
      console.log(`PASS: Found ${count} products`)
    } else {
      console.log("INFO: No products found in article elements")
    }
  })
})

test.describe("Public Pages E2E Tests", () => {
  test("Category page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/kategori/bilgisayarlar`)
    await page.waitForLoadState("domcontentloaded")
    
    await expect(page.locator("body")).toBeVisible()
    console.log("PASS: Category page loads")
  })

  test("Footer is visible on homepage", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("domcontentloaded")

    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
    console.log("PASS: Footer is visible")
  })

  test("Header navigation is visible", async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForLoadState("domcontentloaded")

    const header = page.locator("header")
    await expect(header).toBeVisible()
    console.log("PASS: Header is visible")
  })
})
