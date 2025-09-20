"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bike, BarChart3, Map, TrendingUp, Calendar } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
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

export function MainNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <Link href="/" className="flex items-center space-x-2">
        <Bike className="h-6 w-6" />
        <span className="font-bold">Indego Dashboard</span>
      </Link>

      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <NavigationMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      isActive && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
