type InfoPageProps = {
  title: string;
  children: React.ReactNode;
};

export function InfoPage({ title, children }: InfoPageProps) {
  return (
    <main className="info-page">
      <a className="back-link" href="/">
        Sales Tax Reconciler
      </a>
      <h1>{title}</h1>
      <div className="info-body">{children}</div>
    </main>
  );
}
