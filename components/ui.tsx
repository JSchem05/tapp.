import { cn } from "@/lib/utils";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes
} from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[16px] border border-line bg-white p-5 shadow-soft transition duration-150 hover:shadow-lift",
        className
      )}
      {...props}
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-amber px-4 text-sm font-semibold text-white transition duration-150 hover:bg-clay disabled:cursor-not-allowed disabled:opacity-60",
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
        "inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line bg-white px-4 text-sm font-semibold text-ink transition duration-150 hover:bg-blueSoft disabled:cursor-not-allowed disabled:opacity-60",
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
        "h-10 w-full rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-amber focus:ring-4 focus:ring-amber/15",
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
        "h-10 w-full rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none transition focus:border-amber focus:ring-4 focus:ring-amber/15",
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
