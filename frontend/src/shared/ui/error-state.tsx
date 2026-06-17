type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({
  title = "Co loi xay ra",
  message,
}: ErrorStateProps) {
  return (
    <div className="border-l-4 border-destructive py-3 pl-4">
      <h2 className="font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
