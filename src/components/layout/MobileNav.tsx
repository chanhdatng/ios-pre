import { useState, useEffect, useCallback } from 'react';
import { Menu, X, BookOpen, Home, Calendar, Brain, BarChart3, Settings, Code } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', Icon: Home },
  { href: '/month-1', label: 'Month 1', Icon: Calendar },
  { href: '/month-2', label: 'Month 2', Icon: Calendar },
  { href: '/month-3', label: 'Month 3', Icon: Calendar },
  { href: '/leetcode', label: 'LeetCode', Icon: Code },
  { href: '/review', label: 'Review', Icon: Brain },
  { href: '/progress', label: 'Progress', Icon: BarChart3 },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

interface MobileNavProps {
  currentPath: string;
}

export default function MobileNav({ currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Mobile header - fixed */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)] border-b border-[var(--color-surface-secondary)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[var(--color-swift)]" />
            <span className="font-bold text-body">iOS Prep</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-surface-secondary)] flex items-center justify-center"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <nav
        className={`lg:hidden fixed top-[57px] left-0 right-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-surface-secondary)] transform transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`}
        aria-label="Mobile navigation"
      >
        <div className="py-2 max-h-[calc(100vh-57px)] overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.Icon;
            const isActive = currentPath === item.href || currentPath === item.href + '/';

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  isActive
                    ? 'bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)]'
                    : 'hover:bg-[var(--color-surface-secondary)]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="w-5 h-5" />
                <span className="text-body">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Spacer for fixed header */}
      <div className="lg:hidden h-[57px]" />
    </>
  );
}
