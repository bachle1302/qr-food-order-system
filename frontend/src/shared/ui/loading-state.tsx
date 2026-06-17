type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Dang tai..." }: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}
