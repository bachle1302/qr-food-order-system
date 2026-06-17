type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "Co loi xay ra",
  message,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-card p-6">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
