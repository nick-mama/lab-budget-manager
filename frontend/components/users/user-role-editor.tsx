"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UserRoleEditorProps = {
  userId: number;
  name: string;
  email: string;
  currentRole: string;
};

export function UserRoleEditor({
  userId,
  name,
  email,
  currentRole,
}: UserRoleEditorProps) {
  const { user: actingUser } = useCurrentUser();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  if (actingUser?.role !== "Financial Admin") {
    return null;
  }

  async function handleSaveRole() {
    if (!actingUser) {
      toast.error("No active user selected.");
      return;
    }

    try {
      setSaving(true);

      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] ?? "";
      const lastName = parts.slice(1).join(" ") || "-";

      const res = await fetch(`http://localhost:4000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": String(actingUser.id),
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          role,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update role");
      }

      toast.success("User role updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update role.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>User Role</Label>
        <Select value={role} onValueChange={setRole} disabled={saving}>
          <SelectTrigger className="bg-secondary">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Researcher">Researcher</SelectItem>
            <SelectItem value="Lab Manager">Lab Manager</SelectItem>
            <SelectItem value="Financial Admin">Financial Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSaveRole} disabled={saving}>
        {saving ? "Saving..." : "Update Role"}
      </Button>
    </div>
  );
}
