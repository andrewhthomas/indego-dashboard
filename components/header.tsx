import { MainNav } from "@/components/main-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-3 flex h-14 items-center">
        <MainNav />
        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
