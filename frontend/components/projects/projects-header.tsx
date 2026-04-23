"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectFilters = {
  search: string;
  status: string;
  manager: string;
};

type Props = {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
};

export function ProjectsHeader({ filters, onFiltersChange }: Props) {
  function update<K extends keyof ProjectFilters>(
    key: K,
    value: ProjectFilters[K],
  ) {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  }

  function clearFilters() {
    onFiltersChange({
      search: "",
      status: "all",
      manager: "all",
    });
  }

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.manager !== "all";

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => update("search", e.target.value)}
          className="pl-9"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 p-4">
          <DropdownMenuLabel className="px-0 text-sm font-semibold">
            Filter Projects
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => update("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lab Manager</Label>
              <Select
                value={filters.manager}
                onValueChange={(value) => update("manager", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  <SelectItem value="Nick Mamaoag">Nick Mamaoag</SelectItem>
                  <SelectItem value="Geoffrey Agustin">
                    Geoffrey Agustin
                  </SelectItem>
                  <SelectItem value="Mehak Jammu">Mehak Jammu</SelectItem>
                  <SelectItem value="Camden Forbes">Camden Forbes</SelectItem>
                  <SelectItem value="Christopher Velez">
                    Christopher Velez
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            ) : null}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
