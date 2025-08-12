import { cn } from "@/lib/cn";
import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" };
export function Button({ className, variant="default", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm transition";
  const styles = variant === "outline"
    ? "border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
    : "bg-orange-500 text-white hover:bg-orange-600";
  return <button className={cn(base, styles, className)} {...props} />;
}
