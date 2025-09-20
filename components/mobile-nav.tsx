"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Bike, BarChart3, Map, TrendingUp, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  {
    title: "Overview",
    href: "/",
    icon: BarChart3,
  },
  {
    title: "Trip Analytics",
    href: "/trips",
    icon: TrendingUp,
  },
  {
    title: "Station Map",
    href: "/stations",
    icon: Map,
  },
  {
    title: "Usage Patterns",
    href: "/patterns",
    icon: Calendar,
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <Bike className="mr-2 h-6 w-6" />
            Indego Dashboard
          </SheetTitle>
          <SheetDescription>
            Philadelphia bike share system analytics
          </SheetDescription>
        </SheetHeader>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center py-2 text-sm font-medium transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60",
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
