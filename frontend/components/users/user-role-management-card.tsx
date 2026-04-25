"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserRoleEditor } from "@/components/users/user-role-editor";

type Props = {
  userId: number;
  name: string;
  email: string;
  currentRole: string;
};

export function UserRoleManagementCard({
  userId,
  name,
  email,
  currentRole,
}: Props) {
  const { user: actingUser } = useCurrentUser();

  if (actingUser?.role !== "Financial Admin") {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Role Management</CardTitle>
      </CardHeader>
      <CardContent>
        <UserRoleEditor
          userId={userId}
          name={name}
          email={email}
          currentRole={currentRole}
        />
      </CardContent>
    </Card>
  );
}
