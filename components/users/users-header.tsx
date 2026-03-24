"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Search } from "lucide-react"

export function UsersHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search team members..."
            className="bg-card pl-9"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="researcher">Researcher</SelectItem>
            <SelectItem value="lab-manager">Lab Manager</SelectItem>
            <SelectItem value="financial-admin">Financial Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
        <Plus className="h-4 w-4" />
        Add Member
      </Button>
    </div>
  )
}
