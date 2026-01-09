import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or system preference
    const stored = localStorage.getItem('ios-prep-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    setIsDark(shouldBeDark);

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    console.log('[ThemeToggle] Toggling to:', newValue ? 'dark' : 'light');
    setIsDark(newValue);

    // Enable smooth transition
    document.documentElement.classList.add('theme-transition');

    if (newValue) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('ios-prep-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('ios-prep-theme', 'light');
    }

    // Update theme-color meta tag for mobile browser UI
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', newValue ? '#1C1C1E' : '#F58C3B');

    // Debug: verify class was added
    console.log('[ThemeToggle] HTML classes:', document.documentElement.className);
    console.log('[ThemeToggle] Computed bg:', getComputedStyle(document.body).backgroundColor);

    // Remove transition class after animation completes
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] flex items-center justify-center"
        aria-label="Toggle theme"
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] hover:opacity-80 transition-opacity flex items-center justify-center"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[var(--color-accent-orange)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--color-text-secondary)]" />
      )}
    </button>
  );
}
