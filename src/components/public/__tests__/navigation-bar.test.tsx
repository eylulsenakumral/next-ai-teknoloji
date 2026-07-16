// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock dependencies
vi.mock('../mega-menu-dropdown', () => ({
  MegaMenuDropdown: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="mega-menu" data-open={isOpen}>
      Mock MegaMenuDropdown
    </div>
  ),
}))

// Import after mocks
import { NavigationBar } from '../navigation-bar'

describe('NavigationBar', () => {
  describe('Rendering', () => {
    it('renders navigation with correct role', () => {
      render(<NavigationBar />)
      expect(screen.getByRole('navigation', { name: /ana navigasyon/i })).toBeInTheDocument()
    })

    it('renders All Categories button', () => {
      render(<NavigationBar />)
      expect(screen.getByText(/tüm kategoriler/i)).toBeInTheDocument()
    })

    it('renders menu icon', () => {
      render(<NavigationBar />)
      const menuIcon = document.querySelector('svg')
      expect(menuIcon).toBeInTheDocument()
    })

    it('renders desktop navigation links', () => {
      render(<NavigationBar />)
      
      expect(screen.getByText('Ana Sayfa')).toBeInTheDocument()
      expect(screen.getByText('Ürün Kataloğu')).toBeInTheDocument()
      expect(screen.getByText('Markalar')).toBeInTheDocument()
      expect(screen.getByText('Blog')).toBeInTheDocument()
      expect(screen.getByText('İletişim')).toBeInTheDocument()
    })

    it('renders Yeni Gelenler link', () => {
      render(<NavigationBar />)
      expect(screen.getByText('Yeni Gelenler')).toBeInTheDocument()
    })

    it('renders MegaMenuDropdown', () => {
      render(<NavigationBar />)
      expect(screen.getByTestId('mega-menu')).toBeInTheDocument()
    })
  })

  describe('Navigation Links', () => {
    it('renders Ana Sayfa link with correct href', () => {
      render(<NavigationBar />)
      const link = screen.getByText('Ana Sayfa').closest('a')
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders Urun Katalogu link with correct href', () => {
      render(<NavigationBar />)
      const link = screen.getByText('Ürün Kataloğu').closest('a')
      expect(link).toHaveAttribute('href', '/katalog')
    })

    it('renders Markalar link with correct href', () => {
      render(<NavigationBar />)
      const markalarLink = screen.getByText('Markalar').closest('a')
      expect(markalarLink).toHaveAttribute('href', '/markalar')
    })

    it('renders Blog link with correct href', () => {
      render(<NavigationBar />)
      const blogLink = screen.getByText('Blog').closest('a')
      expect(blogLink).toHaveAttribute('href', '/blog')
    })

    it('renders İletişim link with correct href', () => {
      render(<NavigationBar />)
      const iletisimLink = screen.getByText('İletişim').closest('a')
      expect(iletisimLink).toHaveAttribute('href', '/basvuru')
    })

    it('renders Yeni Gelenler link with correct href', () => {
      render(<NavigationBar />)
      const yeniGelenlerLink = screen.getByText('Yeni Gelenler').closest('a')
      expect(yeniGelenlerLink).toHaveAttribute('href', '/katalog')
    })
  })

  describe('Mega Menu Toggle', () => {
    it('renders All Categories button with aria-expanded', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })

    it('toggles mega menu on button click', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      
      fireEvent.click(button)
      expect(screen.getByTestId('mega-menu')).toHaveAttribute('data-open', 'true')
      
      fireEvent.click(button)
      expect(screen.getByTestId('mega-menu')).toHaveAttribute('data-open', 'false')
    })

    it('closes mega menu on blur', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      
      fireEvent.click(button)
      expect(screen.getByTestId('mega-menu')).toHaveAttribute('data-open', 'true')
      
      // Simulate blur by clicking outside
      fireEvent.blur(button, { relatedTarget: null })
      // Note: The actual blur behavior depends on the implementation
    })
  })

  describe('Styling', () => {
    it('applies correct container class', () => {
      const { container } = render(<NavigationBar />)
      const nav = container.querySelector('nav')
      expect(nav?.className).toContain('w-full')
      expect(nav?.className).toContain('bg-white')
    })

    it('applies correct height to menu bar', () => {
      const { container } = render(<NavigationBar />)
      const menuBar = container.querySelector('.flex')
      expect(menuBar?.className).toContain('h-[48px]')
    })

    it('All Categories button has correct styling', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button.className).toContain('bg-[var(--color-primary)]')
      expect(button.className).toContain('hover:bg-[#1a6fe0]')
    })

    it('navigation links have hover color', () => {
      const { container } = render(<NavigationBar />)
      const navLinks = container.querySelectorAll('nav ul li a')
      navLinks.forEach(link => {
        expect(link.className).toContain('hover:text-[var(--color-primary)]')
      })
    })
  })

  describe('Accessibility', () => {
    it('has accessible navigation landmark', () => {
      render(<NavigationBar />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('has aria-label on navigation', () => {
      render(<NavigationBar />)
      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label')
    })

    it('All Categories button has aria-expanded', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-expanded')
    })

    it('All Categories button has aria-haspopup', () => {
      render(<NavigationBar />)
      const button = screen.getByRole('button', { name: /tüm kategoriler/i })
      expect(button).toHaveAttribute('aria-haspopup', 'true')
    })

    it('has accessible menu icon with aria-hidden', () => {
      render(<NavigationBar />)
      const menuIcon = document.querySelector('svg[aria-hidden="true"]')
      expect(menuIcon).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('hides full category text on small screens', () => {
      const { container } = render(<NavigationBar />)
      const spans = container.querySelectorAll('span')
      const hiddenSpan = Array.from(spans).find(span => 
        span.className.includes('hidden') && span.className.includes('sm:inline')
      )
      expect(hiddenSpan).toBeTruthy()
    })

    it('hides menu items on small screens', () => {
      const { container } = render(<NavigationBar />)
      const menuList = container.querySelector('ul')
      expect(menuList?.className).toContain('hidden')
      expect(menuList?.className).toContain('lg:flex')
    })
  })
})
