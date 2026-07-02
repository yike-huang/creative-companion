export function PageHero({
  title,
  intro,
}: {
  title: string;
  intro: string;
}) {
  return (
    <div className="paper-surface relative overflow-hidden rounded-3xl border border-border/70 p-6 shadow-sm md:p-8">
      <div className="absolute right-5 top-5 hidden gap-2 md:flex" aria-hidden="true">
        <span className="size-4 rounded-full bg-rose-200/80" />
        <span className="size-4 rounded-full bg-emerald-200/80" />
        <span className="size-4 rounded-full bg-sky-200/80" />
      </div>
      <div className="grid max-w-3xl gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-base leading-7 text-muted-foreground">{intro}</p>
        <div className="mt-2 flex gap-2" aria-hidden="true">
          <span className="paint-ribbon w-20 bg-rose-200/80" />
        </div>
      </div>
    </div>
  );
}
