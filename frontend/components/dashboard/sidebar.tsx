"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Wallet,
  FileText,
  Users,
  Settings,
  LogOut,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Line Items", href: "/line-items", icon: FileText },
  { name: "Users", href: "/users", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const currentUserId = 5;

  const [user, setUser] = useState<UserRecord | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("http://localhost:4000/api/users", {
          headers: {
            "x-user-id": "5",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load users");
        }

        const users = (await res.json()) as UserRecord[];
        const currentUser = users.find((u) => u.id === currentUserId) ?? null;
        setUser(currentUser);
      } catch (error) {
        console.error(error);
      }
    }

    loadUser();
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col bg-primary">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
          <FlaskConical className="h-5 w-5 text-accent-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-primary-foreground">
            LabGrant
          </span>
          <span className="text-xs text-primary-foreground/70">
            Budget Manager
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
            {user ? getInitials(user.name) : "--"}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary-foreground">
              {user?.name ?? "Loading..."}
            </p>
            <p className="text-xs text-primary-foreground/70">
              {user?.role ?? ""}
            </p>
          </div>
          <button className="rounded-lg p-2 text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
