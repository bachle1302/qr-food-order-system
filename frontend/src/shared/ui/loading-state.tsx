type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Dang tai..." }: LoadingStateProps) {
  return (
    <div className="border-y border-gray-200 py-6 text-sm text-muted-foreground dark:border-slate-800">
      {label}
    </div>
  );
}
