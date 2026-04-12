import { test, expect, Page } from "@playwright/test"

const BASE_URL = "http://localhost:3000"
const ADMIN_EMAIL = "admin@nextai.com.tr"
const ADMIN_PASSWORD = "admin123"

// Helper: Admin login via NextAuth credentials
async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState("domcontentloaded")

  // Switch to admin mode
  const adminToggle = page.locator("button", { hasText: "Admin Girişi →" })
  await adminToggle.click()

  // Fill admin credentials
  const emailInput = page.locator("#adminEmail")
  await emailInput.waitFor({ state: "visible" })
  await emailInput.fill(ADMIN_EMAIL)

  const passwordInput = page.locator("#adminPassword")
  await passwordInput.fill(ADMIN_PASSWORD)

  // Submit
  const submitBtn = page.locator("button[type='submit']", {
    hasText: "Admin Girişi Yap",
  })
  await submitBtn.click()

  // Wait for redirect to /admin
  await page.waitForURL(/\/admin/, { timeout: 15000 })
}

test.describe("Kategori Eslesmesi - Admin Interface", () => {
  // =========================================================
  // TEST 1: Dev server is accessible
  // =========================================================
  test("Step 1: Dev server is accessible", async ({ page }) => {
    const response = await page.goto(BASE_URL)
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)
    await page.screenshot({
      path: "tests/e2e/artifacts/01-server-accessible.png",
    })
    console.log("PASS: Dev server is accessible on localhost:3000")
  })

  // =========================================================
  // TEST 2: Admin login works, no port redirect bug
  // =========================================================
  test("Step 2: Admin login works", async ({ page }) => {
    await adminLogin(page)

    // Verify we're on /admin and NOT redirected to port 9999
    const url = page.url()
    expect(url).toContain("/admin")
    expect(url).not.toContain("9999")
    expect(url).toContain("localhost:3000")

    await page.screenshot({
      path: "tests/e2e/artifacts/02-admin-logged-in.png",
    })
    console.log(`PASS: Admin login successful, redirected to: ${url}`)
  })

  // =========================================================
  // TEST 3: Kategori Eslesmesi page loads without errors
  // =========================================================
  test("Step 3: Kategori Eslesmesi page loads", async ({ page }) => {
    await adminLogin(page)

    // Navigate to kategori-eslesmesi
    await page.goto(`${BASE_URL}/admin/kategori-eslesmesi`)
    await page.waitForLoadState("domcontentloaded")

    // Collect console errors
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    // Verify page heading exists
    const heading = page.locator("h1", { hasText: "Kategori Eşleşmesi" })
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Wait for loading to finish (skeleton rows disappear)
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse"),
      { timeout: 15000 }
    ).catch(() => {
      // Skeleton might not use animate-pulse, check for data rows instead
    })

    // Wait for the loading text to change from "Yukleniyor..."
    await page
      .locator("text=tedarikçi kategorisi")
      .waitFor({ state: "visible", timeout: 15000 })
      .catch(() => {
        // May show "Tedarikçi kategorisi bulunamadı" if no data
      })

    await page.screenshot({
      path: "tests/e2e/artifacts/03-kategori-eslesmesi-loaded.png",
      fullPage: true,
    })

    // Check for fatal errors (500, runtime crashes)
    const pageContent = await page.content()
    expect(pageContent).not.toContain("Internal Server Error")
    expect(pageContent).not.toContain("Application error")

    console.log("PASS: Kategori Eslesmesi page loaded without errors")
    if (errors.length > 0) {
      console.log(`  WARNING: ${errors.length} console errors detected:`)
      errors.forEach((e) => console.log(`    - ${e}`))
    }
  })

  // =========================================================
  // TEST 4: UI elements are properly rendered
  // =========================================================
  test("Step 4: UI elements load correctly", async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE_URL}/admin/kategori-eslesmesi`)
    await page.waitForLoadState("domcontentloaded")

    // Wait for data to load
    const heading = page.locator("h1", { hasText: "Kategori Eşleşmesi" })
    await expect(heading).toBeVisible({ timeout: 10000 })

    // Wait for loading spinner to finish
    await page.waitForTimeout(3000)

    // 4a. Check table headers
    const tableHeaders = page.locator("thead th")
    const headerTexts = await tableHeaders.allTextContents()
    console.log("  Table headers:", headerTexts.join(" | "))

    expect(headerTexts.some((h) => h.includes("Entegrasyon"))).toBeTruthy()
    expect(
      headerTexts.some((h) => h.includes("Tedarikçi Kategori"))
    ).toBeTruthy()
    expect(headerTexts.some((h) => h.includes("Ürün"))).toBeTruthy()
    expect(
      headerTexts.some((h) => h.includes("Sistem Kategorisi"))
    ).toBeTruthy()
    expect(headerTexts.some((h) => h.includes("Durum"))).toBeTruthy()

    // 4b. Check if table has data rows
    const dataRows = page.locator("tbody tr")
    const rowCount = await dataRows.count()
    console.log(`  Table row count: ${rowCount}`)

    if (rowCount === 0 || (rowCount === 1 && (await dataRows.first().textContent())?.includes("bulunamadı"))) {
      console.log("  WARNING: No supplier categories found in database. Table is empty.")
      console.log("  This may indicate no products have been imported yet.")
    } else {
      // 4c. Check CategoryCombobox exists in first data row
      const firstRowCombobox = dataRows
        .first()
        .locator('button:has-text("Kategori seç"), button:has-text(">")')
      const comboboxCount = await firstRowCombobox.count()
      console.log(`  Combobox buttons in first row: ${comboboxCount}`)

      // 4d. Check status badges exist
      const mappedBadges = page.locator('text="Eşleştirildi"')
      const waitingBadges = page.locator('text="Bekliyor"')
      const mappedCount = await mappedBadges.count()
      const waitingCount = await waitingBadges.count()
      console.log(`  Mapped: ${mappedCount}, Waiting: ${waitingCount}`)
    }

    // 4e. Check "Sadece eslestirilmemisler" checkbox
    const unmappedCheckbox = page.locator(
      'label:has-text("Sadece eşleştirilmemişler")'
    )
    await expect(unmappedCheckbox).toBeVisible()
    console.log("  Unmapped-only checkbox: visible")

    // 4f. Check search input
    const searchInput = page.locator('input[placeholder="Ara..."]')
    await expect(searchInput).toBeVisible()
    console.log("  Search input: visible")

    // 4g. Check Yenile button
    const refreshBtn = page.locator('button[aria-label="Yenile"]')
    await expect(refreshBtn).toBeVisible()
    console.log("  Refresh button: visible")

    // 4h. Check stats line
    const statsText = await page
      .locator("p.text-sm.text-muted-foreground")
      .first()
      .textContent()
    console.log(`  Stats line: ${statsText}`)

    await page.screenshot({
      path: "tests/e2e/artifacts/04-ui-elements.png",
      fullPage: true,
    })

    console.log("PASS: All UI elements loaded correctly")
  })

  // =========================================================
  // TEST 5: Sistem kategorileri dropdown is populated
  // =========================================================
  test("Step 5: Sistem kategorileri dropdown is populated", async ({
    page,
  }) => {
    await adminLogin(page)
    await page.goto(`${BASE_URL}/admin/kategori-eslesmesi`)

    // Wait for data to load
    await page.locator("h1", { hasText: "Kategori Eşleşmesi" }).waitFor()
    await page.waitForTimeout(3000)

    // Check if there are data rows
    const dataRows = page.locator("tbody tr")
    const rowCount = await dataRows.count()

    if (rowCount === 0 || (rowCount === 1 && (await dataRows.first().textContent())?.includes("bulunamadı"))) {
      console.log("SKIP: No supplier categories in database - cannot test dropdown")
      test.skip(true, "No supplier categories in database")
      return
    }

    // Also intercept the categories API to check it returns data
    const categoriesResponse = await page.evaluate(async () => {
      const res = await fetch("/api/categories?flat=true")
      const json = await res.json()
      return { status: res.status, count: (json.data ?? []).length }
    })
    console.log(
      `  Categories API: status=${categoriesResponse.status}, count=${categoriesResponse.count}`
    )
    expect(categoriesResponse.count).toBeGreaterThan(0)

    // Click first combobox button to open dropdown
    const firstCombobox = dataRows
      .first()
      .locator("button")
      .filter({ hasText: /Kategori seç|>/ })
      .first()
    await firstCombobox.click()

    // Wait for dropdown to appear
    const dropdown = page.locator(".absolute.z-50")
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Check dropdown has items
    const dropdownItems = dropdown.locator("button")
    const itemCount = await dropdownItems.count()
    console.log(`  Dropdown items: ${itemCount}`)
    // At least "Secimi kaldir" + some categories
    expect(itemCount).toBeGreaterThan(1)

    await page.screenshot({
      path: "tests/e2e/artifacts/05-dropdown-populated.png",
      fullPage: true,
    })

    console.log(
      `PASS: Sistem kategorileri dropdown populated with ${itemCount - 1} categories`
    )
  })

  // =========================================================
  // TEST 6: Mapping can be saved
  // =========================================================
  test("Step 6: Mapping can be saved", async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE_URL}/admin/kategori-eslesmesi`)

    await page.locator("h1", { hasText: "Kategori Eşleşmesi" }).waitFor()
    await page.waitForTimeout(3000)

    const dataRows = page.locator("tbody tr")
    const rowCount = await dataRows.count()

    if (rowCount === 0 || (rowCount === 1 && (await dataRows.first().textContent())?.includes("bulunamadı"))) {
      console.log("SKIP: No supplier categories - cannot test mapping save")
      test.skip(true, "No supplier categories in database")
      return
    }

    // Find an unmapped row (has "Bekliyor" badge)
    let targetRow = null
    for (let i = 0; i < rowCount; i++) {
      const row = dataRows.nth(i)
      const hasBekliyor = await row.locator('text="Bekliyor"').count()
      if (hasBekliyor > 0) {
        targetRow = row
        console.log(`  Found unmapped row at index ${i}`)
        break
      }
    }

    if (!targetRow) {
      // All rows are mapped, use first row
      targetRow = dataRows.first()
      console.log("  All rows mapped, will re-map first row")
    }

    // Get the supplier category name for logging
    const supplierCatCell = targetRow.locator("td").nth(1)
    const supplierCatName = await supplierCatCell.textContent()
    console.log(`  Target supplier category: ${supplierCatName?.trim()}`)

    // Open combobox
    const combobox = targetRow.locator("button").filter({ hasText: /Kategori seç|>/ }).first()
    await combobox.click()

    // Wait for dropdown
    const dropdown = page.locator(".absolute.z-50")
    await expect(dropdown).toBeVisible({ timeout: 5000 })

    // Select the second option (first real category, skip "Secimi kaldir")
    const categoryOptions = dropdown.locator("button").filter({ hasNot: page.locator("text=Seçimi kaldır") })
    const optionCount = await categoryOptions.count()

    if (optionCount === 0) {
      console.log("SKIP: No system categories available to select")
      test.skip(true, "No system categories available")
      return
    }

    const selectedOption = categoryOptions.first()
    const selectedCategoryName = await selectedOption.textContent()
    console.log(`  Selecting category: ${selectedCategoryName?.trim()}`)
    await selectedOption.click()

    // Dropdown should close
    await expect(dropdown).not.toBeVisible({ timeout: 3000 })

    // Row should now be dirty (highlighted)
    // Click the row-level "Kaydet" button
    const saveBtn = targetRow.locator('button:has-text("Kaydet")')
    await expect(saveBtn).toBeEnabled({ timeout: 3000 })

    // Listen for API response
    const responsePromise = page.waitForResponse(
      (resp) =>
        (resp.url().includes("/api/supplier-category-maps") &&
          (resp.request().method() === "POST" ||
            resp.request().method() === "PATCH")),
      { timeout: 10000 }
    )

    await saveBtn.click()

    // Wait for API response
    const response = await responsePromise
    const responseBody = await response.json()
    console.log(`  Save API: status=${response.status()}, body=`, JSON.stringify(responseBody).substring(0, 200))

    expect([200, 201]).toContain(response.status())
    expect(responseBody.data).toBeDefined()
    expect(responseBody.data.id).toBeDefined()

    await page.screenshot({
      path: "tests/e2e/artifacts/06-mapping-saved.png",
      fullPage: true,
    })

    console.log("PASS: Mapping saved successfully")
    console.log(`  Map ID: ${responseBody.data.id}`)

    // Verify in database
    const dbCheck = await page.evaluate(
      async (mapId: string) => {
        const res = await fetch(`/api/supplier-category-maps/${mapId}`)
        return { status: res.status }
      },
      responseBody.data.id
    )
    console.log(`  DB verification: API GET status=${dbCheck.status}`)
  })

  // =========================================================
  // TEST 7: Filter works correctly
  // =========================================================
  test("Step 7: Filter works correctly", async ({ page }) => {
    await adminLogin(page)
    await page.goto(`${BASE_URL}/admin/kategori-eslesmesi`)

    await page.locator("h1", { hasText: "Kategori Eşleşmesi" }).waitFor()
    await page.waitForTimeout(3000)

    const dataRows = page.locator("tbody tr")
    const totalBefore = await dataRows.count()
    console.log(`  Total rows before filter: ${totalBefore}`)

    if (totalBefore === 0 || (totalBefore === 1 && (await dataRows.first().textContent())?.includes("bulunamadı"))) {
      console.log("SKIP: No data to filter")
      test.skip(true, "No supplier categories in database")
      return
    }

    // Count mapped and unmapped
    const mappedBefore = await page.locator('text="Eşleştirildi"').count()
    const waitingBefore = await page.locator('text="Bekliyor"').count()
    console.log(
      `  Before filter: mapped=${mappedBefore}, waiting=${waitingBefore}`
    )

    // Click "Sadece eslestirilmemisler" checkbox via its visible label
    const checkboxLabel = page.locator('label:has-text("Sadece eşleştirilmemişler")')
    await checkboxLabel.scrollIntoViewIfNeeded()
    await checkboxLabel.click()
    await page.waitForTimeout(500)

    const totalAfterFilter = await dataRows.count()
    const mappedAfterFilter = await page.locator('text="Eşleştirildi"').count()
    const waitingAfterFilter = await page.locator('text="Bekliyor"').count()
    console.log(
      `  After filter: total=${totalAfterFilter}, mapped=${mappedAfterFilter}, waiting=${waitingAfterFilter}`
    )

    // After filtering, should show only unmapped (or all if all are unmapped)
    if (waitingBefore > 0 && mappedBefore > 0) {
      expect(totalAfterFilter).toBeLessThan(totalBefore)
      expect(mappedAfterFilter).toBe(0)
    }

    await page.screenshot({
      path: "tests/e2e/artifacts/07-filter-unmapped-only.png",
      fullPage: true,
    })

    // Uncheck filter
    await checkboxLabel.click()
    await page.waitForTimeout(500)

    const totalAfterUnfilter = await dataRows.count()
    console.log(`  After unfilter: total=${totalAfterUnfilter}`)
    expect(totalAfterUnfilter).toBe(totalBefore)

    await page.screenshot({
      path: "tests/e2e/artifacts/07-filter-all.png",
      fullPage: true,
    })

    console.log("PASS: Filter works correctly")
  })
})
