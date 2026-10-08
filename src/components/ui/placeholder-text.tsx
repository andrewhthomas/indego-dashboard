import { cn } from "@/lib/utils";

interface PlaceholderTextProps {
  className?: string;
  children: React.ReactNode;
  loading?: boolean;
}

export function PlaceholderText({
  className,
  children,
  loading = true,
}: PlaceholderTextProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <span
      className={cn(
        "animate-pulse select-none pointer-events-none",
        "text-transparent bg-gradient-to-r from-muted via-muted/60 to-muted",
        "bg-clip-text blur-sm",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

interface SkeletonTextProps {
  className?: string;
  loading?: boolean;
  width?: string;
  height?: string;
}

export function SkeletonText({
  className,
  loading = true,
  width = "100%",
  height = "1em",
}: SkeletonTextProps) {
  if (!loading) {
    return null;
  }

  return (
    <div
      className={cn("animate-pulse bg-muted rounded", className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
