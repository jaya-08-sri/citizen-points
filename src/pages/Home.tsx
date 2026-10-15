import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Recognition for civic work that has been checked.</h1>
          <p className="lead">
            Earn points for verified contributions. Report civic issues with evidence.
            Redeem your points with local partners.
          </p>
          <div className="btn-row">
            <Link to="/login" className="btn btn-primary">Create account</Link>
            <Link to="/help" className="btn">See how verification works</Link>
          </div>
        </div>

        <aside className="slip" aria-label="Example of a verified report">
          <div className="slip-head">
            <div>
              <div className="slip-id">CASE-10231</div>
              <div className="slip-title">Illegal garbage dumping</div>
            </div>
            <div className="stamp" aria-hidden="true">Verified</div>
          </div>
          <ol className="slip-steps">
            <li><span className="dot done" />Report submitted with video and location</li>
            <li><span className="dot done" />Evidence stored privately</li>
            <li><span className="dot done" />Verifier reviewed the evidence</li>
            <li><span className="dot done" />Decision and reason recorded</li>
            <li><span className="dot points" />+20 points added to the ledger</li>
          </ol>
        </aside>
      </section>

      <section className="section">
        <h2>How points work</h2>
        <div className="grid-3">
          <div className="block">
            <h3>Earn</h3>
            <p>Join cleanups, tree planting, blood drives and volunteering. An organiser or authorised organisation confirms your part.</p>
          </div>
          <div className="block">
            <h3>Report</h3>
            <p>Send a report with photos or video. It becomes a case with its own ID, and a verifier decides the outcome.</p>
          </div>
          <div className="block">
            <h3>Redeem</h3>
            <p>Spend points on discounts and vouchers from partner businesses. Every redemption appears in your ledger.</p>
          </div>
        </div>
      </section>

      <section className="section rule-note">
        <h2>A report is not a verdict</h2>
        <p>
          Sending evidence opens a case for review. It never removes anyone's points by itself.
          Evidence stays private, every decision has a recorded reason, and anyone affected can appeal.
        </p>
      </section>
    </>
  );
}
