"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Sample data for the chart
const data = [
  {
    project: "Biotech",
    fullName: "Biotech Lab",
    allocated: 200000,
    spent: 145000,
  },
  {
    project: "Quantum",
    fullName: "Quantum Lab",
    allocated: 180000,
    spent: 155000,
  },
  {
    project: "Neural Nets",
    fullName: "Neural Networks Study",
    allocated: 85000,
    spent: 85000,
  },
];

export function BudgetChart() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">
          Budget Overview by Project
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#D1D5DB" />
              <XAxis
                dataKey="project"
                interval={0}
                angle={-20}
                textAnchor="end"
                height={70}
                tick={{ fill: "#6B7280", fontSize: 11 }}
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
              <Legend />
              <Bar
                dataKey="allocated"
                name="Allocated"
                fill="#1E3A5F"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="spent"
                name="Spent"
                fill="#2A9D8F"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
