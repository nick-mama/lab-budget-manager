"use client";

import { use, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoleEditor } from "@/components/users/user-role-editor";
import { useApi } from "@/lib/api-client";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type ProjectSummary = {
  id: number;
  name: string;
  project_code: string;
};

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  managed_projects?: ProjectSummary[];
  member_projects?: ProjectSummary[];
};

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { apiFetch } = useApi();
  const { id } = use(params);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await apiFetch(`/api/users/${id}`);

        if (!res.ok) {
          if (res.status === 401) {
            setErrorMessage("You are not authorized. Please sign in again.");
            return;
          }

          if (res.status === 403) {
            setErrorMessage("You do not have permission to view this user.");
            return;
          }

          if (res.status === 404) {
            setErrorMessage("User not found.");
            return;
          }

          setErrorMessage("Failed to load user.");
          return;
        }

        const data = (await res.json()) as UserProfile;

        if (!cancelled) {
          setUser(data);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("Network error. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [apiFetch, id]);

  if (loading) {
    return (
      <DashboardLayout title="User Profile" subtitle="View member information.">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Loading user...</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait while we load that user profile.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout title="User Profile" subtitle="View member information.">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Could not load user</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage || "We could not load that user profile."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={user.name}
      subtitle={`Profile details for ${user.role}`}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {user.avatar ?? getInitials(user.name)}
            </div>

            <h2 className="mt-4 text-2xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user.role}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UserRoleEditor
            userId={user.id}
            name={user.name}
            email={user.email}
            currentRole={user.role}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Managed Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {!user.managed_projects || user.managed_projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user does not manage any projects.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.managed_projects.map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <p className="font-medium">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_code}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Project Membership</CardTitle>
        </CardHeader>
        <CardContent>
          {!user.member_projects || user.member_projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user is not a member of any additional projects.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.member_projects.map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <p className="font-medium">{project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_code}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}