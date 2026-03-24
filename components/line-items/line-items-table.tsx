"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft } from "lucide-react";

// Sample line item data
const lineItems = [
  {
    id: "LI-001",
    description: "Grant Funding - NSF Award",
    project: "Biotech Lab Development",
    requestor: "Camden Forbes",
    type: "revenue" as const,
    amount: 50000,
    requestDate: "2024-03-14",
    status: "approved" as const,
  },
  {
    id: "LI-002",
    description: "Software Licenses",
    project: "Quantum Computing Lab",
    requestor: "Geoffrey Agustin",
    type: "expense" as const,
    amount: 5000,
    requestDate: "2024-03-12",
    status: "rejected" as const,
  },
  {
    id: "LI-003",
    description: "Equipment Maintenance",
    project: "Biotech Lab Development",
    requestor: "Christopher Velez",
    type: "expense" as const,
    amount: 3200,
    requestDate: "2024-03-09",
    status: "pending" as const,
  },
  {
    id: "LI-004",
    description: "Equipment Maintenance",
    project: "Neural Networks Study",
    requestor: "Mehak Jammu",
    type: "revenue" as const,
    amount: 10000,
    requestDate: "2024-03-28",
    status: "reimbursed" as const,
  },
];

export function LineItemsTable() {
  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">
                Description
              </TableHead>
              <TableHead className="text-muted-foreground">Project</TableHead>
              <TableHead className="text-muted-foreground">Requestor</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item) => (
              <TableRow key={item.id} className="border-border">
                <TableCell className="font-medium text-accent">
                  {item.id}
                </TableCell>
                <TableCell className="max-w-[200px] truncate font-medium text-foreground">
                  {item.description}
                </TableCell>
                <TableCell className="text-foreground">
                  {item.project}
                </TableCell>
                <TableCell className="text-foreground">
                  {item.requestor}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {item.type === "expense" ? (
                      <ArrowUpRight className="h-4 w-4 text-[#D32F2F]" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-[#2E7D32]" />
                    )}
                    <span className="capitalize text-foreground">
                      {item.type}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={`font-medium ${
                    item.type === "expense"
                      ? "text-[#D32F2F]"
                      : "text-[#2E7D32]"
                  }`}
                >
                  {item.type === "expense" ? "-" : "+"}$
                  {item.amount.toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.requestDate}
                </TableCell>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
