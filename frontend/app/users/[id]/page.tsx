import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  projects?: string[];
};

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`http://localhost:4000/api/users/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return (
      <DashboardLayout title="User Profile" subtitle="View member information.">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">User not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load that user profile.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const user = (await res.json()) as UserProfile;

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
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {!user.projects || user.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This user is not assigned to any projects.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {user.projects.map((projectName) => (
                <div key={projectName} className="rounded-lg border p-4">
                  <p className="font-medium">{projectName}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
