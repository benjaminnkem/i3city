export function PageHeader({
  title,
  description,
  actions,
}: Readonly<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-extrabold">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-prose">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
