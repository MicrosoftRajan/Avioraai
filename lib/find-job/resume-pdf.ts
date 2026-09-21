import { jsPDF } from "jspdf";

export function downloadPlainResumePdf(text: string, filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 48;
  const top = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - left * 2;
  const lineH = 14;
  const bottom = pageH - 48;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const wrapped = doc.splitTextToSize(text.trim() || "Empty resume", maxW) as string[];
  let y = top;
  for (const line of wrapped) {
    if (y > bottom) {
      doc.addPage();
      y = top;
    }
    doc.text(line, left, y);
    y += lineH;
  }

  const safe = filename.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-");
  doc.save(safe.endsWith(".pdf") ? safe : `${safe}.pdf`);
}

export function slugFilePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
