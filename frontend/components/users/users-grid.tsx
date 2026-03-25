"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MoreHorizontal, FolderKanban } from "lucide-react";

// Sample user data
const users = [
  {
    id: "USR-001",
    name: "Geoffrey Agustin",
    email: "geoffrey.agustin@university.edu",
    role: "Lab Manager",
    projects: ["Biotech Lab Development", "Neural Networks Study"],
    avatar: "GA",
  },
  {
    id: "USR-002",
    name: "Camden Forbes",
    email: "camden.forbes@university.edu",
    role: "Researcher",
    projects: ["Quantum Computing Lab"],
    avatar: "CF",
  },
  {
    id: "USR-003",
    name: "Mehak Jammu",
    email: "mehak.jammu@university.edu",
    role: "Lab Manager",
    projects: ["Neural Networks Study"],
    avatar: "MJ",
  },
  {
    id: "USR-004",
    name: "Nick Mamaoag",
    email: "nick.mamaoag@university.edu",
    role: "Lab Manager",
    projects: ["Biotech Lab Development"],
    avatar: "NM",
  },
  {
    id: "USR-005",
    name: "Christopher Velez",
    email: "christopher.velez@university.edu",
    role: "Financial Admin",
    projects: ["All Projects"],
    avatar: "CV",
  },
];

function getRoleBadgeStyles(role: string): string {
  switch (role) {
    case "Lab Manager":
      return "bg-primary/10 text-primary";
    case "Financial Admin":
      return "bg-[#2A9D8F]/10 text-[#2A9D8F]";
    case "Researcher":
      return "bg-[#F59E0B]/10 text-[#F59E0B]";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function UsersGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => (
        <Card key={user.id} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {user.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeStyles(
                      user.role,
                    )}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <FolderKanban className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="line-clamp-2">{user.projects.join(", ")}</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
              >
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
