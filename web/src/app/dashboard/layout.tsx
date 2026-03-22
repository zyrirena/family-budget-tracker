'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowDownUp, CreditCard, PiggyBank, BarChart2, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/transactions',  label: 'Transactions', icon: ArrowDownUp },
  { href: '/debts',         label: 'Debts',        icon: CreditCard },
  { href: '/savings',       label: 'Savings',      icon: PiggyBank },
  { href: '/reports',       label: 'Reports',      icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 fixed top-0 left-0 h-screen flex flex-col border-r border-gray-100 bg-white z-10">
        <div className="p-5 border-b border-gray-100">
          <p className="text-base font-semibold text-green-700">FamilyBudget</p>
          <p className="text-xs text-gray-400 mt-0.5">Smart spending, better life</p>
        </div>

        <nav className="flex-1 py-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2 ${
                  active
                    ? 'bg-green-50 text-green-700 border-green-600 font-medium'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                {label}
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-56 flex-1 min-h-screen bg-gray-50">
        {children}
      </main>
    </div>
  );
}
