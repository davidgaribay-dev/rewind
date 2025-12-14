"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import type { Conversation } from "../../lib/types"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { formatNumber, formatModelName } from "../../lib/stats"

export const columns: ColumnDef<Conversation>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"))
      return (
        <div className="font-medium">
          {format(date, "MMM dd, yyyy HH:mm")}
        </div>
      )
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "preview",
    header: "Preview",
    cell: ({ row }) => {
      const preview = row.getValue("preview") as string
      return (
        <div className="max-w-md truncate text-muted-foreground">
          {preview || "No preview available"}
        </div>
      )
    },
  },
  {
    accessorKey: "messageCount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Messages
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.getValue("messageCount")} messages
        </Badge>
      )
    },
  },
  {
    accessorKey: "model",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Model
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const model = row.getValue("model") as string | undefined
      if (!model) return <span className="text-muted-foreground">-</span>
      return <Badge>{formatModelName(model)}</Badge>
    },
  },
  {
    accessorKey: "totalTokens",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tokens
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const tokens = row.getValue("totalTokens") as number | undefined
      if (!tokens) return <div className="text-right text-muted-foreground">-</div>
      return (
        <div className="text-right font-medium">
          {formatNumber(tokens)}
        </div>
      )
    },
  },
]
