const PlainReferenceButton = ({ label, onClick, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-xs font-semibold underline-offset-4 transition-colors ${
      isActive ? 'text-amber-700 underline' : 'text-amber-600 hover:underline'
    }`}
  >
    {label}
  </button>
)

const AnalysisPanel = ({
  data,
  onReferenceSelect,
  activeReferenceId,
  matchStatus
}) => {
  if (!data) return null

  return (
    <aside className="w-full max-w-xl overflow-y-auto border-l border-slate-200 px-8 py-6 text-base leading-relaxed text-slate-800">
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-ink">{data.summary.title}</h2>
        {data.summary.paragraphs.map((paragraph, index) => (
          <p key={`summary-${index}`}>{paragraph}</p>
        ))}
      </div>

      <section className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-ink">Findings</h3>
        {data.findings.map((finding) => (
          <p key={finding.id}>
            <span className="font-semibold">{finding.heading}:</span>{' '}
            {finding.body}{' '}
            <PlainReferenceButton
              label={`Highlight ${finding.referenceId} (Page ${finding.page})`}
              onClick={() =>
                onReferenceSelect({
                  id: finding.id,
                  referenceId: finding.referenceId,
                  page: finding.page,
                  query: finding.query
                })
              }
              isActive={activeReferenceId === finding.id}
            />
          </p>
        ))}
      </section>

      <section className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-ink">Supporting Evidence</h3>
        {data.supportingEvidence.map((item) => (
          <p key={item.id}>
            <span className="font-semibold">{item.label}:</span> {item.quote}{' '}
            <PlainReferenceButton
              label={`Highlight ${item.label} (Page ${item.page})`}
              onClick={() =>
                onReferenceSelect({
                  id: `evidence-${item.id}`,
                  referenceId: item.label,
                  page: item.page,
                  query: item.quote
                })
              }
              isActive={activeReferenceId === `evidence-${item.id}`}
            />
          </p>
        ))}
      </section>

      {matchStatus && (
        <p className="mt-8 text-sm text-slate-500">
          Status: <span className="font-medium text-slate-700">{matchStatus}</span>
        </p>
      )}
    </aside>
  )
}

export default AnalysisPanel

