import { cn } from "@/lib/cn";
import * as React from "react";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex items-center rounded-lg px-2 py-1 text-xs bg-neutral-700 text-neutral-200", className)} {...props} />;
}
