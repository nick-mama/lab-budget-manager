"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Folder,
  Users,
  FileText,
  Settings,
  LayoutDashboard,
  Wallet
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useApi } from "@/lib/api-client";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [budgets, setBudgets] = React.useState<any[]>([]);
  const router = useRouter();
  const { apiFetch } = useApi();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const [hasFetched, setHasFetched] = React.useState(false);

  React.useEffect(() => {
    if (open && !hasFetched) {
      setHasFetched(true);
      apiFetch("/api/projects").then((res) => {
        if (res.ok) {
          res.json().then((data) => setProjects(Array.isArray(data) ? data : []));
        }
      });
      apiFetch("/api/users").then((res) => {
        if (res.ok) {
          res.json().then((data) => setUsers(Array.isArray(data) ? data : []));
        }
      });
      apiFetch("/api/budgets").then((res) => {
        if (res.ok) {
          res.json().then((data) => setBudgets(Array.isArray(data) ? data : []));
        }
      });
    }
  }, [open, apiFetch, hasFetched]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-[0.5rem] bg-secondary text-sm text-muted-foreground sm:pr-12 md:w-64 hover:bg-secondary/80 border-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Search projects, budgets...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/projects"))}>
              <Folder className="mr-2 h-4 w-4" />
              Projects
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/budgets"))}>
              <Wallet className="mr-2 h-4 w-4" />
              Budgets
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/line-items"))}>
              <FileText className="mr-2 h-4 w-4" />
              Line Items
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/users"))}>
              <Users className="mr-2 h-4 w-4" />
              Team Members
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          {projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={`Project ${project.name} ${project.project_code}`}
                  onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  {project.name} ({project.project_code})
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {budgets.length > 0 && (
            <CommandGroup heading="Budgets">
              {budgets.map((budget) => (
                <CommandItem
                  key={budget.id}
                  value={`Budget ${budget.project_name} ${budget.project_code}`}
                  onSelect={() => runCommand(() => router.push(`/projects/${budget.project_id}`))}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Budget for {budget.project_name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {users.length > 0 && (
            <CommandGroup heading="Users">
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`User ${user.name} ${user.email} ${user.role}`}
                  onSelect={() => runCommand(() => router.push(`/users`))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {user.name} - {user.role}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}