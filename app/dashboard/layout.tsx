'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  FiHome,
  FiShoppingBag,
  FiShoppingCart,
  FiUsers,
  FiMessageSquare,
  FiTag,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiAward,
  FiImage,
  FiLayout,
  FiHelpCircle,
  FiMapPin,
  FiArchive,
  FiLayers,
  FiFileText,
  FiTrendingUp,
  FiChevronDown,
  FiChevronRight,
  FiTruck,
  FiCreditCard,
  FiSearch,
  FiFile,
} from 'react-icons/fi';
import { RiAdminLine, RiShoppingBasketLine } from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '@/lib/api';
import { getToken, clearSession } from '@/lib/auth';
import { AdminUser, hasAccess } from '@/lib/types';

const MENU_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: FiHome, perm: 'dashboard' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: FiTrendingUp, perm: 'reports' },
  {
    name: 'E-commerce',
    icon: FiShoppingBag,
    subItems: [
      { name: 'Products', path: '/dashboard/products', icon: FiShoppingBag, perm: 'products' },
      { name: 'Inventory', path: '/dashboard/inventory', icon: FiArchive, perm: 'inventory' },
      { name: 'Brands', path: '/dashboard/brands', icon: FiAward, perm: 'brands' },
      { name: 'Collections', path: '/dashboard/collections', icon: FiLayers, perm: 'collections' },
      { name: 'Coupons', path: '/dashboard/coupons', icon: FiTag, perm: 'coupons' },
    ],
  },
  {
    name: 'Sales',
    icon: FiShoppingCart,
    subItems: [
      { name: 'Orders', path: '/dashboard/orders', icon: FiShoppingCart, perm: 'orders' },
      { name: 'Customer Carts', path: '/dashboard/carts', icon: RiShoppingBasketLine, perm: 'carts' },
    ],
  },
  {
    name: 'Content',
    icon: FiFileText,
    subItems: [
      { name: 'Banners / Hero', path: '/dashboard/banners', icon: FiLayout, perm: 'banners' },
      { name: 'Blog Posts', path: '/dashboard/blogs', icon: FiFileText, perm: 'blogs' },
      { name: 'Static Pages', path: '/dashboard/pages', icon: FiFile, perm: 'settings' },
      { name: 'FAQs', path: '/dashboard/faqs', icon: FiHelpCircle, perm: 'faqs' },
      { name: 'Media Library', path: '/dashboard/media', icon: FiImage, perm: 'media' },
    ],
  },
  {
    name: 'Users',
    icon: FiUsers,
    subItems: [
      { name: 'Customers', path: '/dashboard/customers', icon: FiUsers, perm: 'customers' },
      { name: 'Reviews', path: '/dashboard/reviews', icon: FiMessageSquare, perm: 'reviews' },
      { name: 'Staff & Admins', path: '/dashboard/staff', icon: FiShield, perm: 'staff' },
    ],
  },
  {
    name: 'System',
    icon: FiSettings,
    subItems: [
      { name: 'Shipping Zones', path: '/dashboard/shipping', icon: FiMapPin, perm: 'shipping' },
      { name: 'Courier Integration', path: '/dashboard/courier', icon: FiTruck, perm: 'courier' },
      { name: 'Payment Gateways', path: '/dashboard/payments', icon: FiCreditCard, perm: 'payments' },
      { name: 'SEO & Meta', path: '/dashboard/seo', icon: FiSearch, perm: 'settings' },
      { name: 'Settings', path: '/dashboard/settings', icon: FiSettings, perm: 'settings' },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearSession();
      router.replace('/');
      return;
    }
    api
      .get<{ admin: AdminUser }>('/admin/me')
      .then((data) => {
        setAdmin(data.admin);
        setIsChecking(false);
      })
      .catch(() => {
        // api helper already wipes the session and redirects on 401
      });
  }, [router]);

  useEffect(() => {
    MENU_ITEMS.forEach(item => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(sub => 
          pathname === sub.path || (sub.path !== '/dashboard' && pathname?.startsWith(`${sub.path}/`))
        );
        if (isChildActive) {
          setExpandedGroups(prev => prev.includes(item.name) ? prev : [...prev, item.name]);
        }
      }
    });
  }, [pathname]);

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => 
      prev.includes(name) ? [] : [name]
    );
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of your session.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#18181b',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, log out!',
    }).then((result) => {
      if (result.isConfirmed) {
        clearSession();
        router.replace('/');
      }
    });
  };

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-primary dark:border-zinc-800 dark:border-t-zinc-50"></div>
      </div>
    );
  }

  const getVisibleMenu = (items: any[]) => {
    return items.map(item => {
      if (item.subItems) {
        const visibleSubItems = item.subItems.filter((subItem: any) => hasAccess(admin, subItem.perm));
        if (visibleSubItems.length > 0) {
          return { ...item, subItems: visibleSubItems };
        }
        return null;
      }
      return hasAccess(admin, item.perm) ? item : null;
    }).filter(Boolean);
  };

  const visibleMenu = getVisibleMenu(MENU_ITEMS);

  const flatMenuItems = MENU_ITEMS.reduce((acc: any[], item: any) => {
    if (item.subItems) {
      return [...acc, ...item.subItems];
    }
    return [...acc, item];
  }, []);

  const currentItem = flatMenuItems.filter(
    (item: any) => pathname === item.path || (item.path !== '/dashboard' && pathname?.startsWith(`${item.path}/`))
  ).pop();
  
  const pageAllowed = !currentItem || hasAccess(admin, currentItem.perm);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-zinc-200 bg-white transition-transform duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:flex lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0 flex' : '-translate-x-full'}`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <RiAdminLine size={24} className="text-accent" />
            <span className="text-lg font-bold tracking-tight">Ecomus Admin</span>
          </Link>
          <button
            className="text-zinc-500 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FiX size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {visibleMenu.map((item: any) => {
            if (item.subItems) {
              const isExpanded = expandedGroups.includes(item.name);
              const hasActiveChild = item.subItems.some((sub: any) => 
                sub.path === '/dashboard' ? pathname === sub.path : pathname === sub.path || pathname?.startsWith(`${sub.path}/`)
              );
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(item.name)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      hasActiveChild && !isExpanded
                        ? 'text-primary bg-primary/5 dark:bg-white/5 dark:text-white'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={hasActiveChild && !isExpanded ? 'text-primary dark:text-white' : 'text-zinc-500 dark:text-zinc-400'} />
                      {item.name}
                    </div>
                    {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                  </button>
                  {isExpanded && (
                    <div className="mt-1 space-y-1 ml-4 border-l border-zinc-200 pl-2 dark:border-zinc-700">
                      {item.subItems.map((sub: any) => {
                        const isActive =
                          sub.path === '/dashboard'
                            ? pathname === sub.path
                            : pathname === sub.path || pathname?.startsWith(`${sub.path}/`);
                        return (
                          <Link
                            key={sub.name}
                            href={sub.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'bg-primary text-white shadow-md dark:bg-white dark:text-zinc-900'
                                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                            }`}
                          >
                            <sub.icon size={16} className={isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-400 dark:text-zinc-500'} />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              item.path === '/dashboard'
                ? pathname === item.path
                : pathname === item.path || pathname?.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md dark:bg-white dark:text-zinc-900'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <FiLogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 sm:px-6 lg:px-8">
          <button
            className="rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <FiMenu size={24} />
          </button>

          <div className="flex flex-1 justify-end px-4">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white dark:bg-white dark:text-zinc-900">
                {admin?.fullName?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight text-zinc-700 dark:text-zinc-300">
                  {admin?.fullName || 'Admin'}
                </p>
                <p className="text-xs capitalize leading-tight text-zinc-500 dark:text-zinc-500">
                  {admin?.role?.replace('_', ' ') || ''}
                </p>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-6 lg:p-8">
          {pageAllowed ? (
            children
          ) : (
            <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <FiShield size={30} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">Access Denied</h2>
              <p className="max-w-sm text-sm text-zinc-500">
                Your account does not have permission to view this page. Contact the super admin if you need access.
              </p>
              <Link
                href="/dashboard"
                className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Back to Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
