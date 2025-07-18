"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNavigation } from "@/components/MobileNavigation";

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  
  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);


  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        console.log('Clicking outside, closing menu');
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const navigationItems = [
    { href: "/", label: "Files" },
    { href: "/g", label: "Gallery" },
  ];

  return (
    <>
      <header className="bg-surface shadow-sm border-b border-border sticky top-0 z-30">
        <div className="mobile-safe-padding">
          <div className="flex justify-between items-center h-16 px-4 md:px-6">
            
            {/* Mobile: Hamburger + Logo */}
            <div className="flex items-center space-x-3 md:space-x-6">
              {/* Mobile hamburger menu */}
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors touch-target"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Logo */}
              <Link href="/" className="text-xl md:text-2xl font-bold text-foreground">
                Bucket
              </Link>

              {/* Desktop navigation */}
              <nav className="hidden md:flex items-center space-x-6">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors touch-target flex items-center ${
                      pathname === item.href
                        ? "text-accent"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Desktop: Auth section */}
            <div className="hidden md:flex items-center space-x-4">
              {status === "loading" ? (
                <div className="w-8 h-8 bg-surface-hover rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={(e) => {
                      console.log('DESKTOP: Avatar clicked');
                      e.stopPropagation();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center hover:bg-surface-active transition-colors touch-target"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {session.user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border z-[9999] pointer-events-auto"
                      onClick={(e) => {
                        console.log('DESKTOP: Dropdown clicked');
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-2">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-popover-foreground">Admin</p>
                        </div>
                        <button
                          onClick={async (e) => {
                            console.log('DESKTOP: Sign out clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserMenuOpen(false);
                            console.log('DESKTOP: Starting sign out process');
                            await signOut({ 
                              callbackUrl: '/',
                              redirect: false 
                            });
                            console.log('DESKTOP: Sign out completed, redirecting');
                            // Force a hard reload to clear session state
                            window.location.href = '/';
                          }}
                          onMouseDown={(e) => {
                            console.log('DESKTOP: Sign out mousedown');
                            e.stopPropagation();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 text-sm transition-colors touch-target"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile: Auth button */}
            <div className="md:hidden">
              {status === "loading" ? (
                <div className="w-8 h-8 bg-surface-hover rounded-full animate-pulse"></div>
              ) : session ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={(e) => {
                      console.log('MOBILE: Avatar clicked');
                      e.stopPropagation();
                      setIsUserMenuOpen(!isUserMenuOpen);
                    }}
                    className="w-8 h-8 bg-surface-hover rounded-full flex items-center justify-center hover:bg-surface-active transition-colors touch-target"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {session.user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border z-[9999] pointer-events-auto">
                      <div className="py-2">
                        <div className="px-4 py-2 border-b">
                          <p className="text-sm font-medium text-popover-foreground">Admin</p>
                        </div>
                        <button
                          onClick={async (e) => {
                            console.log('MOBILE: Sign out clicked');
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUserMenuOpen(false);
                            console.log('MOBILE: Starting sign out process');
                            await signOut({ 
                              callbackUrl: '/',
                              redirect: false 
                            });
                            console.log('MOBILE: Sign out completed, redirecting');
                            // Force a hard reload to clear session state
                            window.location.href = '/';
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-popover-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 text-sm transition-colors touch-target"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <MobileNavigation 
        isOpen={isMobileNavOpen} 
        onClose={closeMobileNav} 
      />
    </>
  );
}