import { XMLParser } from "fast-xml-parser";
import PDFDocument from "pdfkit";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (name) => ["part", "measure", "note"].includes(name)
});

export async function exportMusicXmlAsPdf(xml: string) {
  const parsed = parser.parse(xml) as Record<string, any>;
  const title =
    parsed?.["score-partwise"]?.work?.["work-title"] ??
    parsed?.["score-partwise"]?.identification?.creator ??
    "ScoreFlow Export";

  const doc = new PDFDocument({ margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const bufferPromise = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(22).text(String(title));
  doc.moveDown();
  doc.fontSize(11).fillColor("#6b7280").text("Export generated from MusicXML");
  doc.moveDown();

  const parts = parsed?.["score-partwise"]?.part;
  const normalizedParts = Array.isArray(parts) ? parts : parts ? [parts] : [];

  normalizedParts.forEach((part: Record<string, any>, partIndex: number) => {
    doc.fillColor("#111827").fontSize(16).text(`Part ${partIndex + 1}`);
    doc.moveDown(0.5);

    (part.measure ?? []).forEach((measure: Record<string, any>) => {
      const notes = (measure.note ?? [])
        .map((note: Record<string, any>) => {
          if (note.rest) return "rest";
          const pitch = note.pitch ?? {};
          const accidental = pitch.alter === 1 ? "#" : pitch.alter === -1 ? "b" : "";
          return `${pitch.step ?? "?"}${accidental}${pitch.octave ?? ""}`;
        })
        .join(" | ");

      doc.fontSize(11).text(`Measure ${measure.number ?? "?"}: ${notes}`);
    });

    doc.moveDown();
  });

  doc.end();

  return bufferPromise;
}
