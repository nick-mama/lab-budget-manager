import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Wallet } from "lucide-react";

// Sample stats data
const stats = [
  {
    title: "Pending",
    value: "12",
    amount: "$28,450",
    icon: Clock,
    color: "text-[#F59E0B]",
    bgColor: "bg-[#F59E0B]/10",
  },
  {
    title: "Approved",
    value: "45",
    amount: "$156,800",
    icon: CheckCircle,
    color: "text-[#2E7D32]",
    bgColor: "bg-[#2E7D32]/10",
  },
  {
    title: "Rejected",
    value: "8",
    amount: "$12,500",
    icon: XCircle,
    color: "text-[#D32F2F]",
    bgColor: "bg-[#D32F2F]/10",
  },
  {
    title: "Reimbursed",
    value: "128",
    amount: "$409,250",
    icon: Wallet,
    color: "text-[#2A9D8F]",
    bgColor: "bg-[#2A9D8F]/10",
  },
];

export function LineItemsStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.amount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
