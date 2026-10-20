import {
  GalleryHorizontalIcon,
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

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboardIcon,
        exact: true,
      },
      { label: "Orders", href: "/admin/orders", icon: ReceiptTextIcon },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: PackageIcon },
      { label: "Categories", href: "/admin/categories", icon: TagsIcon },
    ],
  },
  {
    label: "Storefront",
    items: [
      { label: "Hero", href: "/admin/hero", icon: GalleryHorizontalIcon },
      {
        label: "Announcements",
        href: "/admin/announcements",
        icon: MegaphoneIcon,
      },
    ],
  },
  {
    label: "Store setup",
    items: [
      { label: "Delivery", href: "/admin/shipping", icon: TruckIcon },
      { label: "Settings", href: "/admin/settings", icon: SettingsIcon },
    ],
  },
];

export const adminNav: AdminNavItem[] = adminNavGroups.flatMap(
  (group) => group.items,
);

export function isActive(item: AdminNavItem, pathname: string): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
