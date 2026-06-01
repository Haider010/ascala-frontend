import React from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";
import { prepareUplySocialPlannerCsv } from "../../services/uply";

function FileDrop({ label, description, accept, file, onChange }) {
  return (
    <label className={`uply-file-drop ${file ? "has-file" : ""}`}>
      <input
        type="file"
        accept={accept}
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <span className="uply-file-icon" aria-hidden="true">
        {file ? <CheckCircle2 size={22} /> : <UploadCloud size={22} />}
      </span>
      <span className="uply-file-copy">
        <strong>{label}</strong>
        <small>{file ? file.name : description}</small>
      </span>
    </label>
  );
}

export function UplyWorkspace({ appSessionToken }) {
  const [scheduleFile, setScheduleFile] = React.useState(null);
  const [mediaZip, setMediaZip] = React.useState(null);
  const [isPreparing, setIsPreparing] = React.useState(false);
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [summary, setSummary] = React.useState(null);

  async function handlePrepare(event) {
    event.preventDefault();
    if (!scheduleFile || !mediaZip || isPreparing) return;

    setIsPreparing(true);
    setStatus("");
    setError("");
    setSummary(null);

    try {
      const result = await prepareUplySocialPlannerCsv({
        appSessionToken,
        scheduleFile,
        mediaZip,
      });
      setSummary(result.summary);
      setStatus(`${result.filename} is ready. Media links were added to the GHL schedule CSV.`);
    } catch (prepareError) {
      setError(prepareError.message || "Unable to prepare the GHL CSV.");
    } finally {
      setIsPreparing(false);
    }
  }

  return (
    <section className="uply-workspace">
      <div className="uply-panel">
        <div className="uply-heading">
          <span className="uply-heading-icon" aria-hidden="true">
            <FileSpreadsheet size={24} />
          </span>
          <div>
            <h2>GHL bulk upload prep</h2>
            <p>
              Upload the GHL planner file and a ZIP of matching media. Uply uploads each media file to GHL,
              fills the image/video/GIF URL columns, and downloads a ready-to-import CSV.
            </p>
          </div>
        </div>

        <form className="uply-form" onSubmit={handlePrepare}>
          <FileDrop
            label="Planner file"
            description="CSV or XLSX exported from the GHL advanced sample"
            accept=".csv,.xlsx"
            file={scheduleFile}
            onChange={setScheduleFile}
          />
          <FileDrop
            label="Media ZIP"
            description="ZIP with files in the same order as the post rows"
            accept=".zip"
            file={mediaZip}
            onChange={setMediaZip}
          />

          <button
            className="uply-primary"
            type="submit"
            disabled={!scheduleFile || !mediaZip || !appSessionToken || isPreparing}
          >
            {isPreparing ? <Loader2 className="spin" size={18} /> : <UploadCloud size={18} />}
            {isPreparing ? "Preparing CSV..." : "Prepare GHL CSV"}
          </button>
        </form>

        {(status || error) && (
          <div className={`uply-status ${error ? "is-error" : ""}`} role={error ? "alert" : "status"}>
            {error || status}
          </div>
        )}
      </div>

      <aside className="uply-panel uply-rules">
        <div className="uply-section-label">Workflow</div>
        <ol>
          <li>Rows 1 and 2 are preserved from the GHL template.</li>
          <li>Media files are uploaded in ZIP order.</li>
          <li>File 1 fills post row 1, file 2 fills post row 2, and so on.</li>
          <li>Images go to <code>imageUrls</code>, GIFs to <code>gifUrl</code>, videos to <code>videoUrls</code>.</li>
          <li>The final CSV is capped at 90 post rows for GHL import.</li>
        </ol>

        {summary && (
          <div className="uply-summary">
            <div>
              <strong>{summary.mediaUploaded || 0}</strong>
              <span>Uploaded</span>
            </div>
            <div>
              <strong>{summary.postRows || 0}</strong>
              <span>Post rows</span>
            </div>
            <div>
              <strong>{summary.unmatchedPostRows || 0}</strong>
              <span>Rows without media</span>
            </div>
          </div>
        )}
      </aside>
    </section>
  );
}
