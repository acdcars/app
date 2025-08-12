import { cn } from "@/lib/cn";
import * as React from "react";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("block mb-1 text-sm text-neutral-300", className)} {...props} />;
}
