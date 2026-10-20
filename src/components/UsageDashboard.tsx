import type { RankedMetric, UsageDashboardData } from "@/lib/usage";

function MetricList({
  title,
  items,
  empty,
}: {
  title: string;
  items: RankedMetric[];
  empty: string;
}) {
  return (
    <div className="panel panel--soft">
      <p className="feature__title">{title}</p>
      {items.length === 0 ? (
        <p className="card__desc">{empty}</p>
      ) : (
        <ol className="card__desc" style={{ margin: "12px 0 0", paddingLeft: "20px" }}>
          {items.map((item) => (
            <li key={`${item.postId ?? item.label}-${item.count}`}>
              {item.label} <strong>({item.count})</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function UsageDashboard({ data }: { data: UsageDashboardData }) {
  if (!data.configured) {
    return (
      <div className="panel panel--soft" style={{ marginBottom: "32px" }}>
        <p className="feature__title">Usage dashboard needs one database update</p>
        <p className="card__desc">
          Run the latest <code>supabase/schema.sql</code> in Supabase SQL Editor.
          New Search, Ask AI, article-view, and download activity will appear
          here afterward.
        </p>
      </div>
    );
  }

  const metrics = [
    ["Active visitors", data.totals.activeVisitors],
    ["Signed-in users", data.totals.signedInUsers],
    ["Page views", data.totals.pageViews],
    ["Searches", data.totals.searches],
    ["Ask AI questions", data.totals.asks],
    ["Article views", data.totals.articleViews],
    ["Downloads", data.totals.downloads],
    ["Unanswered asks", data.totals.unansweredAsks],
    ["Zero-result searches", data.totals.zeroResultSearches],
  ] as const;

  return (
    <section style={{ marginBottom: "40px" }}>
      <div className="section__head" style={{ marginBottom: "18px" }}>
        <div>
          <span className="section__eyebrow">Last {data.periodDays} days</span>
          <h2 className="feature__title">Library usage</h2>
          <p className="card__desc">
            Visitors are counted using a one-way keyed hash; raw IP addresses
            are not stored.
          </p>
        </div>
      </div>

      <div className="card-grid card-grid--3">
        {metrics.map(([label, value]) => (
          <div className="panel panel--soft" key={label}>
            <p className="section__title" style={{ marginBottom: "4px" }}>
              {value}
            </p>
            <p className="card__desc">{label}</p>
          </div>
        ))}
      </div>

      <div className="card-grid card-grid--2" style={{ marginTop: "20px" }}>
        <MetricList
          title="Questions students ask"
          items={data.topQuestions}
          empty="No Ask AI questions recorded yet."
        />
        <MetricList
          title="Search terms"
          items={data.topSearches}
          empty="No searches recorded yet."
        />
        <MetricList
          title="Content opportunities"
          items={data.unansweredQuestions}
          empty="No unanswered Ask AI topics."
        />
        <MetricList
          title="Search gaps"
          items={data.zeroResultSearches}
          empty="No zero-result searches."
        />
        <MetricList
          title="Most viewed articles"
          items={data.topViewed}
          empty="No article views recorded yet."
        />
        <MetricList
          title="Most visited pages"
          items={data.topPages}
          empty="No page views recorded yet."
        />
        <MetricList
          title="Most downloaded articles"
          items={data.topDownloaded}
          empty="No downloads recorded yet."
        />
        <MetricList
          title="Daily activity"
          items={data.dailyActivity}
          empty="No activity recorded yet."
        />
      </div>
    </section>
  );
}

