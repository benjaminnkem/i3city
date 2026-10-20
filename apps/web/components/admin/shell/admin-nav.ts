import {
  LayoutDashboardIcon,
  MegaphoneIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  TagsIcon,
  TruckIcon,
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
  { label: "Orders", href: "/admin/orders", icon: ReceiptTextIcon },
  { label: "Products", href: "/admin/products", icon: PackageIcon },
  { label: "Categories", href: "/admin/categories", icon: TagsIcon },
  { label: "Delivery", href: "/admin/shipping", icon: TruckIcon },
  {
    label: "Announcements",
    href: "/admin/announcements",
    icon: MegaphoneIcon,
  },
  { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
];

export function isActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
