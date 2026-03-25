"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Sample data for the chart
const data = [
  { month: "Jan", expenses: 45000, revenue: 150000 },
  { month: "Feb", expenses: 52000, revenue: 150000 },
  { month: "Mar", expenses: 48000, revenue: 175000 },
  { month: "Apr", expenses: 61000, revenue: 175000 },
  { month: "May", expenses: 55000, revenue: 200000 },
  { month: "Jun", expenses: 67000, revenue: 200000 },
  { month: "Jul", expenses: 67000, revenue: 200000 },
  { month: "Aug", expenses: 80000, revenue: 50000 },
  { month: "Sep", expenses: 45000, revenue: 250000 },
  { month: "Oct", expenses: 50000, revenue: 120000 },
  { month: "Nov", expenses: 76000, revenue: 100000 },
  { month: "Dec", expenses: 100000, revenue: 170000 },
];

export function SpendingTrends() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">
          Monthly Spending Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
              <XAxis
                dataKey="month"
                interval={0}
                tick={{ fill: "#6B7280", fontSize: 10 }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={{ stroke: "#D1D5DB" }}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 12 }}
                axisLine={{ stroke: "#D1D5DB" }}
                tickLine={{ stroke: "#D1D5DB" }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "",
                ]}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#1E3A5F"
                strokeWidth={2}
                dot={{ fill: "#1E3A5F", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#2A9D8F"
                strokeWidth={2}
                dot={{ fill: "#2A9D8F", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
