"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Compass, Ticket, UserRound, Bookmark, Plus, BadgeDollarSign } from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof Compass };

const viewerNav: NavItem[] = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const producerNav: NavItem[] = [
  { href: "/producer", label: "Premieres", icon: Clapperboard },
  { href: "/producer/create", label: "Create", icon: Plus },
  { href: "/producer/sales", label: "Sales", icon: BadgeDollarSign },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Home", icon: Clapperboard },
  { href: "/admin/premieres", label: "Premieres", icon: Compass },
  { href: "/admin/users", label: "People", icon: UserRound },
  { href: "/admin/commission", label: "Fees", icon: BadgeDollarSign },
];

export function PhoneShell({
  children,
  role = "VIEWER",
  hideNav = false,
}: {
  children: React.ReactNode;
  role?: string;
  hideNav?: boolean;
}) {
  const pathname = usePathname();
  const items =
    role === "ADMIN" ? adminNav : role === "PRODUCER" ? producerNav : viewerNav;
  const wide = role === "ADMIN" || role === "PRODUCER";

  return (
    <div className={wide ? "wide-shell" : "phone-shell"}>
      <div className={hideNav ? "" : "pb-24"}>{children}</div>
      {!hideNav && (
        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-white/10 bg-[#070709]/90 px-3 py-3 backdrop-blur-xl md:max-w-[980px]">
          <div className="flex items-center justify-around">
            {items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 text-[11px] tracking-[0.16em] uppercase ${
                    active ? "text-gold" : "text-muted"
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
