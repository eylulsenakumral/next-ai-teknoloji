/**
 * Scraper Registry — barrel export for all supplier scrapers
 */

export { BaseScraper, type ScrapedProduct, type ScraperConfig, type ScraperResult } from "./base"
export { B2BDepoScraper } from "./suppliers/b2bdepo"
export { OkisanScraper } from "./suppliers/okisan"
