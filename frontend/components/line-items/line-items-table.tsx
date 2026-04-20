"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useApi } from "@/lib/api-client";

type LineItem = {
  id: number;
  item_code: string;
  description: string;
  project_name: string;
  requestor_name: string;
  type: "expense" | "revenue";
  amount: number;
  request_date: string;
  status: "pending" | "approved" | "rejected" | "reimbursed";
};

type Props = {
  filters?: { search: string; status: string; type: string; project_id: string };
  refreshKey?: number;
};

export function LineItemsTable({ filters, refreshKey }: Props) {
  const { apiFetch } = useApi();
  const [items, setItems] = React.useState<LineItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all-status") params.set("status", filters.status);
    if (filters?.type && filters.type !== "all-type") params.set("type", filters.type);
    if (filters?.project_id && filters.project_id !== "all-projects") params.set("project_id", filters.project_id);

    apiFetch(`/api/line-items?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [apiFetch, filters?.status, filters?.type, filters?.project_id, refreshKey]);

  const filtered = React.useMemo(() => {
    const q = filters?.search?.toLowerCase() ?? "";
    if (!q) return items;
    return items.filter((item) =>
      item.description.toLowerCase().includes(q) ||
      item.project_name?.toLowerCase().includes(q) ||
      item.requestor_name?.toLowerCase().includes(q) ||
      item.item_code?.toLowerCase().includes(q)
    );
  }, [items, filters?.search]);

  return (
    <Card className="bg-card">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">ID</TableHead>
              <TableHead className="text-muted-foreground">Description</TableHead>
              <TableHead className="text-muted-foreground">Project</TableHead>
              <TableHead className="text-muted-foreground">Requestor</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Amount</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No line items found.</TableCell></TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className="border-border">
                  <TableCell className="font-medium text-accent">{item.item_code}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium text-foreground">{item.description}</TableCell>
                  <TableCell className="text-foreground">{item.project_name}</TableCell>
                  <TableCell className="text-foreground">{item.requestor_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === "expense" ? <ArrowUpRight className="h-4 w-4 text-[#D32F2F]" /> : <ArrowDownLeft className="h-4 w-4 text-[#2E7D32]" />}
                      <span className="capitalize text-foreground">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className={`font-medium ${item.type === "expense" ? "text-[#D32F2F]" : "text-[#2E7D32]"}`}>
                    {item.type === "expense" ? "-" : "+"}${Number(item.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.request_date?.slice(0, 10)}</TableCell>
                  <TableCell><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}