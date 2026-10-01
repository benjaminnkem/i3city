import {
  LayoutDashboardIcon,
  PackageIcon,
  TagsIcon,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const adminNav: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  { label: "Products", href: "/admin/products", icon: PackageIcon },
  { label: "Categories", href: "/admin/categories", icon: TagsIcon },
];

export function isActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
