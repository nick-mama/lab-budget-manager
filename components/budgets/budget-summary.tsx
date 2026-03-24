import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";

// Sample summary data
const summaryItems = [
  {
    title: "Total Allocated",
    value: "$465,000",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    title: "Total Spent",
    value: "$386,000",
    change: "73.6% utilized",
    changeType: "neutral" as const,
    icon: TrendingUp,
  },
  {
    title: "Remaining Balance",
    value: "$79,000",
    change: "26.4% available",
    changeType: "positive" as const,
    icon: PiggyBank,
  },
  {
    title: "Pending Expenses",
    value: "$24,500",
    change: "8 requests",
    changeType: "neutral" as const,
    icon: TrendingDown,
  },
];

export function BudgetSummary() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {summaryItems.map((item) => (
        <Card key={item.title} className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {item.value}
                </p>
                <p
                  className={`text-sm ${
                    item.changeType === "positive"
                      ? "text-[#2E7D32]"
                      : item.changeType === "negative"
                        ? "text-[#D32F2F]"
                        : "text-muted-foreground"
                  }`}
                >
                  {item.change}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
