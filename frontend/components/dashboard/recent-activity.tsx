"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { FileText, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

// Sample activity data
const activities = [
  {
    id: 1,
    type: "submitted",
    description: "Camden Forbes submitted an expense request",
    amount: "$2,500",
    project: "AI Research",
    proj_id: 3,
    time: "2 hours ago",
    icon: FileText,
    status: "pending" as const,
  },
  {
    id: 2,
    type: "approved",
    description: "Geoffrey Agustin approved a request",
    amount: "$1,800",
    project: "Biotech Lab",
    proj_id: 1,
    time: "4 hours ago",
    icon: CheckCircle,
    status: "approved" as const,
  },
  {
    id: 3,
    type: "rejected",
    description: "Lab Manager rejected a request",
    amount: "$5,000",
    project: "Climate Study",
    proj_id: 4,
    time: "Yesterday",
    icon: XCircle,
    status: "rejected" as const,
  },
  {
    id: 4,
    type: "reimbursed",
    description: "Christopher Velez marked as reimbursed",
    amount: "$3,200",
    project: "Quantum Lab",
    proj_id: 2,
    time: "Yesterday",
    icon: DollarSign,
    status: "reimbursed" as const,
  },
  {
    id: 5,
    type: "submitted",
    description: "Mehak Jammu submitted an expense request",
    amount: "$980",
    project: "Robotics",
    proj_id: 6,
    time: "2 days ago",
    icon: FileText,
    status: "pending" as const,
  },
];

export function RecentActivity() {
  const router = useRouter();
  
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 rounded-lg border border-border p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <activity.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 font-semibold text-sm text-accent">
                  <span>
                    <button
                      onClick={() => router.push(`/projects/${activity.proj_id}`)}
                      className="hover:underline cursor-pointer"
                    >{activity.project}</button>
                  </span>
                  <span>•</span>
                  <span className="font-medium text-foreground">
                    {activity.amount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <StatusBadge status={activity.status} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
