import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";

export function Card({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-line bg-white p-5 shadow-soft transition duration-200 hover:shadow-lift",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-black hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function SecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-amber hover:bg-[#FFF9F1] hover:text-amber hover:shadow-soft disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[10px] border border-line bg-white px-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted/70 focus:border-amber focus:ring-4 focus:ring-amber/15",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-[10px] border border-line bg-white px-3 text-sm text-ink shadow-sm outline-none transition focus:border-amber focus:ring-4 focus:ring-amber/15",
        className
      )}
      {...props}
    />
  );
}

export function Label({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("text-sm font-medium text-muted", className)}>
      {children}
    </label>
  );
}
