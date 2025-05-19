import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKeyboardNavigation } from "@/lib/accessibility";

type NavItem = {
  title: string;
  href: string;
  roles?: string[];
};

interface MainNavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
  onItemClick?: () => void;
}

export function MainNav({
  className,
  items,
  onItemClick,
  ...props
}: MainNavProps) {
  const pathname = usePathname();

  const handleKeyDown = useKeyboardNavigation(
    items,
    (item) => {
      window.location.href = item.href;
      onItemClick?.();
    },
    (item) => `nav-${item.href}`
  );

  return (
    <nav
      id="main-nav"
      aria-label="Main Navigation"
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <ul className="flex items-center space-x-4 lg:space-x-6" role="menubar">
        {items.map((item) => (
          <li key={item.href} role="none">
            <Link
              id={`nav-${item.href}`}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 py-1",
                pathname?.startsWith(item.href)
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
              role="menuitem"
              aria-current={pathname?.startsWith(item.href) ? "page" : undefined}
              onKeyDown={(e) => handleKeyDown(e, item)}
              onClick={onItemClick}
              tabIndex={0}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
