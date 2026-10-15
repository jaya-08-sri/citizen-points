const items = [
  {
    q: "How are points awarded?",
    a: "Points are added only after an organiser, authorised organisation or verifier confirms the activity or report. Nothing is added just because you submitted it.",
  },
  {
    q: "What happens after I report an issue?",
    a: "Your report becomes a case with a case ID and is marked Under Verification. A verifier reviews the evidence and can approve it, reject it, close it as inconclusive, or ask you for more information.",
  },
  {
    q: "Can a report reduce someone's points?",
    a: "Not by itself. A reduction can only follow a reviewed case with evidence, a recorded reason and a named reviewer. The affected person is told and can appeal.",
  },
  {
    q: "How do appeals work?",
    a: "If points are reduced, use the Appeal button next to the entry in your ledger. A different reviewer looks at the case again and records the outcome.",
  },
  {
    q: "Who can see my evidence?",
    a: "Only verifiers with access to your case. Evidence is private by default and every access is logged.",
  },
  {
    q: "What happens to false or abusive reports?",
    a: "They can lead to points being removed from the reporter, limits on reporting, or account suspension after review.",
  },
];

export default function Help() {
  return (
    <div className="narrow">
      <h1>Help and rules</h1>
      <p className="muted">These are draft rules for the pilot. They will be published in full before launch.</p>
      {items.map((i) => (
        <details key={i.q} className="faq">
          <summary>{i.q}</summary>
          <p>{i.a}</p>
        </details>
      ))}
    </div>
  );
}
