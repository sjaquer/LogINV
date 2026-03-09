'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LayoutDashboard, Package, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
    const pathname = usePathname();
    const { t } = useLanguage();

    const items = [
        { href: '/', label: t('dashboard'), icon: LayoutDashboard },
        { href: '/productos', label: t('productos'), icon: Package },
        { href: '/inventario', label: t('inventario'), icon: ClipboardList },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pb-safe">
            <div className="flex items-stretch justify-around h-16">
                {items.map(({ href, label, icon: Icon }) => {
                    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors relative',
                                isActive
                                    ? 'text-brand-600'
                                    : 'text-slate-400 active:text-slate-600'
                            )}
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-600 rounded-full" />
                            )}
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
