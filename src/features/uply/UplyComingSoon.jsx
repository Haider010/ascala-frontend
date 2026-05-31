import { UploadCloud } from "lucide-react";

export function UplyComingSoon() {
  return (
    <section className="uply-coming-soon">
      <div className="uply-coming-soon-icon" aria-hidden="true">
        <UploadCloud size={28} />
      </div>
      <div className="uply-coming-soon-copy">
        <strong>Uply is coming soon</strong>
        <span>
          Approved Escouade exports are ready. Publishing and distribution workflows will live here next.
        </span>
      </div>
    </section>
  );
}
