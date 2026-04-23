# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth E2E Tests >> Can switch to admin mode
- Location: tests/e2e/auth.spec.ts:50:7

# Error details

```
TimeoutError: page.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('button:has-text(\'Admin Girişi →\')')

```

# Page snapshot

```yaml
- alert [ref=e1]
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test"
  2   | 
  3   | const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000"
  4   | 
  5   | async function dealerLogin(page: Page) {
  6   |   await page.goto(`${BASE_URL}/login`)
  7   |   await page.waitForLoadState("domcontentloaded")
  8   | 
  9   |   await page.fill("#dealerCode", "TESTDEALER")
  10  |   await page.fill("#dealerPassword", "TestPassword123!")
  11  |   await page.click("button[type='submit']")
  12  | 
  13  |   await page.waitForLoadState("networkidle")
  14  | }
  15  | 
  16  | async function adminLogin(page: Page) {
  17  |   await page.goto(`${BASE_URL}/login`)
  18  |   await page.waitForLoadState("domcontentloaded")
  19  | 
  20  |   await page.click("button:has-text('Admin Girişi →')")
  21  |   await page.waitForTimeout(500)
  22  | 
  23  |   await page.fill("#adminEmail", "admin@nextai.com.tr")
  24  |   await page.fill("#adminPassword", "admin123")
  25  |   await page.click("button[type='submit']:has-text('Admin Girişi Yap')")
  26  | 
  27  |   await page.waitForURL(/\/admin/, { timeout: 15000 })
  28  | }
  29  | 
  30  | test.describe("Auth E2E Tests", () => {
  31  |   test("Homepage loads without errors", async ({ page }) => {
  32  |     const response = await page.goto(BASE_URL)
  33  |     expect(response).not.toBeNull()
  34  |     expect(response!.status()).toBeLessThan(500)
  35  |     
  36  |     await expect(page.locator("body")).toBeVisible()
  37  |     console.log("PASS: Homepage loads successfully")
  38  |   })
  39  | 
  40  |   test("Login page renders correctly", async ({ page }) => {
  41  |     await page.goto(`${BASE_URL}/login`)
  42  |     await page.waitForLoadState("domcontentloaded")
  43  | 
  44  |     await expect(page.locator("#dealerCode")).toBeVisible()
  45  |     await expect(page.locator("#dealerPassword")).toBeVisible()
  46  |     await expect(page.locator("button[type='submit']")).toBeVisible()
  47  |     console.log("PASS: Login page renders correctly")
  48  |   })
  49  | 
  50  |   test("Can switch to admin mode", async ({ page }) => {
  51  |     await page.goto(`${BASE_URL}/login`)
  52  |     await page.waitForLoadState("domcontentloaded")
  53  | 
> 54  |     await page.click("button:has-text('Admin Girişi →')")
      |                ^ TimeoutError: page.click: Timeout 10000ms exceeded.
  55  |     await page.waitForTimeout(500)
  56  | 
  57  |     await expect(page.locator("#adminEmail")).toBeVisible()
  58  |     console.log("PASS: Switched to admin mode")
  59  |   })
  60  | 
  61  |   test("Login page has catalog link", async ({ page }) => {
  62  |     await page.goto(`${BASE_URL}/login`)
  63  |     await page.waitForLoadState("domcontentloaded")
  64  | 
  65  |     const catalogLink = page.locator("a[href='/katalog']")
  66  |     await expect(catalogLink).toBeVisible()
  67  |     console.log("PASS: Catalog link visible on login page")
  68  |   })
  69  | 
  70  |   test("Login validates required fields", async ({ page }) => {
  71  |     await page.goto(`${BASE_URL}/login`)
  72  |     await page.waitForLoadState("domcontentloaded")
  73  | 
  74  |     await page.click("button[type='submit']")
  75  |     await page.waitForTimeout(500)
  76  |     
  77  |     console.log("INFO: Form validation triggered for empty fields")
  78  |   })
  79  | })
  80  | 
  81  | test.describe("Catalog E2E Tests", () => {
  82  |   test("Catalog page loads", async ({ page }) => {
  83  |     await page.goto(`${BASE_URL}/katalog`)
  84  |     await page.waitForLoadState("domcontentloaded")
  85  |     
  86  |     await expect(page.locator("body")).toBeVisible()
  87  |     console.log("PASS: Catalog page loads")
  88  |   })
  89  | 
  90  |   test("Products are displayed", async ({ page }) => {
  91  |     await page.goto(`${BASE_URL}/katalog`)
  92  |     await page.waitForLoadState("domcontentloaded")
  93  | 
  94  |     const products = page.locator("article")
  95  |     const count = await products.count()
  96  |     
  97  |     if (count > 0) {
  98  |       console.log(`PASS: Found ${count} products`)
  99  |     } else {
  100 |       console.log("INFO: No products found in article elements")
  101 |     }
  102 |   })
  103 | })
  104 | 
  105 | test.describe("Public Pages E2E Tests", () => {
  106 |   test("Category page loads", async ({ page }) => {
  107 |     await page.goto(`${BASE_URL}/kategori/bilgisayarlar`)
  108 |     await page.waitForLoadState("domcontentloaded")
  109 |     
  110 |     await expect(page.locator("body")).toBeVisible()
  111 |     console.log("PASS: Category page loads")
  112 |   })
  113 | 
  114 |   test("Footer is visible on homepage", async ({ page }) => {
  115 |     await page.goto(BASE_URL)
  116 |     await page.waitForLoadState("domcontentloaded")
  117 | 
  118 |     const footer = page.locator("footer")
  119 |     await expect(footer).toBeVisible()
  120 |     console.log("PASS: Footer is visible")
  121 |   })
  122 | 
  123 |   test("Header navigation is visible", async ({ page }) => {
  124 |     await page.goto(BASE_URL)
  125 |     await page.waitForLoadState("domcontentloaded")
  126 | 
  127 |     const header = page.locator("header")
  128 |     await expect(header).toBeVisible()
  129 |     console.log("PASS: Header is visible")
  130 |   })
  131 | })
  132 | 
```