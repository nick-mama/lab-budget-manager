"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function SettingsForm() {
  const currentUserId = 5; // In a real app, get this from auth context or similar

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch(`http://localhost:4000/api/users`, {
          headers: {
            "x-user-id": "5",
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load users");
        }

        const users = (await res.json()) as UserRecord[];
        const currentUser = users.find((user) => user.id === currentUserId);

        if (!currentUser) {
          throw new Error("User not found");
        }

        const parts = currentUser.name.trim().split(/\s+/);
        const first = parts[0] ?? "";
        const last = parts.slice(1).join(" ");

        setFirstName(first);
        setLastName(last);
        setEmail(currentUser.email);
        setRole(currentUser.role);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadUser();
  }, []);

  const profileDisabled = useMemo(
    () => loadingProfile || savingProfile,
    [loadingProfile, savingProfile],
  );

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !role.trim()
    ) {
      toast.error("Please fill out all profile fields.");
      return;
    }

    try {
      setSavingProfile(true);

      const res = await fetch(
        `http://localhost:4000/api/users/${currentUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": "5",
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            role,
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update profile");
      }

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill out all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    toast.message("Password update is not connected yet.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Profile Settings</CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="bg-secondary"
                  disabled={profileDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="bg-secondary"
                  disabled={profileDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary"
                disabled={profileDisabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">
                Role
              </Label>
              <Select
                value={role}
                onValueChange={setRole}
                disabled={profileDisabled}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Researcher">Researcher</SelectItem>
                  <SelectItem value="Lab Manager">Lab Manager</SelectItem>
                  <SelectItem value="Financial Admin">
                    Financial Admin
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={profileDisabled}
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Security</CardTitle>
          <CardDescription>
            Manage your account security settings.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-foreground">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                className="bg-secondary"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">
                New Password
              </Label>
              <Input
                id="newPassword"
                type="password"
                className="bg-secondary"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="bg-secondary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
