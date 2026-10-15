import { ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { issueCategories } from "../data/mockData";
import { useStore } from "../store";

const steps = ["Details", "Evidence", "Review"];

export default function ReportIssue() {
  const { addReport } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [incidentAt, setIncidentAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [involved, setInvolved] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function onFiles(e: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []));
  }

  function next() {
    if (step === 0) {
      if (!category) return setError("Choose a category.");
      if (description.trim().length < 20) return setError("Describe the issue in at least 20 characters.");
      if (!location.trim()) return setError("Enter where this happened.");
      if (!incidentAt) return setError("Enter the date and time.");
    }
    if (step === 1 && files.length === 0) return setError("Add at least one photo or video.");
    setError("");
    setStep(step + 1);
  }

  async function submit() {
    if (!confirmed) return setError("Confirm that your report is accurate before submitting.");
    setBusy(true);
    try {
      const id = await addReport({ category, description, location, incidentAt, mediaCount: files.length });
      navigate("/my-reports", { state: { created: id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow">
      <h1>Report an issue</h1>
      <p className="muted">
        Your report opens a case for a verifier to review. Evidence is private and is only seen by reviewers.
      </p>

      <ol className="stepper" aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} className={i === step ? "current" : i < step ? "done" : ""}>
            <span className="step-n">{i + 1}</span> {s}
          </li>
        ))}
      </ol>

      <div className="form">
        {step === 0 && (
          <>
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select a category</option>
                {issueCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              What did you see?
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label>
              Location
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Street, landmark or ward" />
            </label>
            <label>
              Date and time
              <input type="datetime-local" value={incidentAt} onChange={(e) => setIncidentAt(e.target.value)} />
            </label>
          </>
        )}

        {step === 1 && (
          <>
            <label>
              Photos or video
              <input type="file" accept="image/*,video/*" multiple onChange={onFiles} />
            </label>
            {files.length > 0 && (
              <ul className="plain-list">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
            <label>
              Person, vehicle or organisation (only if needed for this category)
              <textarea rows={3} value={involved} onChange={(e) => setInvolved(e.target.value)} />
              <span className="hint">Leave this blank if the issue can be reviewed without naming anyone. Details you add are only visible to verifiers.</span>
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <dl className="review">
              <div><dt>Category</dt><dd>{category}</dd></div>
              <div><dt>Description</dt><dd>{description}</dd></div>
              <div><dt>Location</dt><dd>{location}</dd></div>
              <div><dt>Date and time</dt><dd>{incidentAt.replace("T", " ")}</dd></div>
              <div><dt>Files</dt><dd>{files.length}</dd></div>
              {involved.trim() && <div><dt>Person or vehicle details</dt><dd>{involved}</dd></div>}
            </dl>
            <label className="check">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
              I confirm this report is accurate and the evidence is unedited. I understand that false or abusive reports have consequences.
            </label>
          </>
        )}

        {error && <p className="error" role="alert">{error}</p>}

        <div className="btn-row">
          {step > 0 && <button className="btn" onClick={() => { setError(""); setStep(step - 1); }}>Back</button>}
          {step < 2 ? (
            <button className="btn btn-primary" onClick={next}>Continue</button>
          ) : (
            <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? "Submitting..." : "Submit report"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
