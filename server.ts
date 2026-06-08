import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
// @ts-ignore
import pdf from "pdf-parse";
const parsePdf = (pdf as any).default || pdf;
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import dotenv from "dotenv";
import { FINANCIAL_DICTIONARY } from "./server/dictionary";
import { extractValue, performOCR } from "./server/parser";
import { detectCompanyName, detectSector } from "./server/utils";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_ROOT = process.env.FINCORE_DB_PATH || "./fincore_db";
const STORAGE_ROOT = path.join(DB_ROOT, "original_reports");

[DB_ROOT, STORAGE_ROOT].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_ROOT),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// API ENDPOINTS

async function startServer() {
  app.use(express.json({ limit: "50mb" }));
  app.use("/reports", express.static(STORAGE_ROOT));

  // ── POST /api/parse - Parse files without saving ──
  app.post("/api/parse", upload.array("reports"), async (req: any, res) => {
    try {
      const files: Express.Multer.File[] = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const parsed = [];

      for (const file of files) {
        let text = "";
        let docType = "DIGITAL_PDF";

        try {
          if (file.mimetype === "application/pdf") {
            const buffer = fs.readFileSync(file.path);
            const pdfData = await parsePdf(buffer);
            text = pdfData.text || "";

            if (text.trim().length < 200) {
              console.log(`[OCR] Scanned PDF: ${file.originalname}`);
              text = await performOCR(file.path);
              docType = "SCANNED_PDF";
            }
          } else if (file.mimetype.startsWith("image/")) {
            console.log(`[OCR] Image: ${file.originalname}`);
            text = await performOCR(file.path);
            docType = "IMAGE";
          }
        } catch (parseErr) {
          console.error(`[WARN] Parse error for ${file.originalname}:`, parseErr);
          try {
            text = await performOCR(file.path);
            docType = "SCANNED_PDF";
          } catch {
            text = "";
          }
        }

        const suggestedCompanyName = detectCompanyName(text, file.originalname);
        const suggestedSector = detectSector(text, "TECHNOLOGY");

        // Extract all financial data
        const extractedData: Record<string, Record<string, { value: string | null; confidence: string }>> = {
          incomeStatement: {},
          balanceSheet: {},
          cashFlow: {},
          ratios: {},
          growth: {},
          advanced: {},
        };

        for (const [fieldId, config] of Object.entries(FINANCIAL_DICTIONARY)) {
          const result = extractValue(text, config.keywords);
          if (!extractedData[config.category]) {
            extractedData[config.category] = {};
          }
          extractedData[config.category][fieldId] = {
            value: result.value,
            confidence: result.confidence,
          };
        }

        parsed.push({
          fileId: file.filename,
          originalFileName: file.originalname,
          storedFileName: file.filename,
          docType,
          suggestedCompanyName,
          suggestedSector,
          extractedData,
          rawTextLength: text.length,
        });

        console.log(`[PARSED] ${file.originalname} → ${suggestedCompanyName} (${docType})`);
      }

      res.json({ success: true, parsed });
    } catch (err: any) {
      console.error("[ERROR] Parse failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/save - Save edited data ──
  app.post("/api/save", async (req, res) => {
    try {
      const { reports, year, sector } = req.body;

      if (!reports || !Array.isArray(reports)) {
        return res.status(400).json({ error: "Invalid reports data" });
      }

      const saved = [];

      for (const report of reports) {
        const { companyName, financials, storedFileName, originalFileName, docType } = report;

        const reportData = {
          CompanyReport: {
            Metadata: {
              CompanyName: companyName,
              FinancialYear: year,
              Sector: sector,
              OriginalFileName: originalFileName,
              StoredFileName: storedFileName,
              Currency: "MYR '000",
              DocType: docType,
              ProcessedAt: new Date().toISOString(),
            },
            Financials: financials,
          },
        };

        // Save XML
        const sectorDir = path.join(DB_ROOT, year, sector);
        if (!fs.existsSync(sectorDir)) fs.mkdirSync(sectorDir, { recursive: true });

        const safeName = companyName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60);
        const fileName = `${safeName}.xml`;
        const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
        fs.writeFileSync(path.join(sectorDir, fileName), builder.build(reportData));

        saved.push({
          companyName,
          fileName,
          sector,
          year,
        });

        console.log(`[SAVED] ${companyName} → ${sector}/${year}`);
      }

      res.json({ success: true, saved });
    } catch (err: any) {
      console.error("[ERROR] Save failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/reports/:year/:sector ──
  app.get("/api/reports/:year/:sector", (req, res) => {
    try {
      const { year, sector } = req.params;
      const sectorPath = path.join(DB_ROOT, year, sector);

      if (!fs.existsSync(sectorPath)) return res.json([]);

      const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true });
      const files = fs.readdirSync(sectorPath).filter((f) => f.endsWith(".xml"));

      const reports = files
        .map((file) => {
          try {
            const content = fs.readFileSync(path.join(sectorPath, file), "utf-8");
            return parser.parse(content).CompanyReport;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/archive ──
  app.get("/api/archive", (req, res) => {
    try {
      if (!fs.existsSync(DB_ROOT)) return res.json([]);

      const entries = fs.readdirSync(DB_ROOT, { withFileTypes: true });
      const years = entries.filter((e) => e.isDirectory() && /^\d{4}$/.test(e.name)).map((e) => e.name);

      const archive = years.map((year) => {
        const yearPath = path.join(DB_ROOT, year);
        const sectors = fs
          .readdirSync(yearPath, { withFileTypes: true })
          .filter((e) => e.isDirectory())
          .map((e) => e.name);
        return { year, sectors };
      });

      res.json(archive.sort((a, b) => Number(b.year) - Number(a.year)));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/ai-insights ──
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { reports, sector, year } = req.body;
      const apiKey = process.env.ZHIPU_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "ZHIPU_AI_API_KEY not configured" });
      }

      const prompt = `You are a financial analyst specializing in Bursa Malaysia.

Analyze the following financial data for companies in the ${sector} sector for FY${year}.
Provide a concise, structured comparison covering:
1. Revenue & Profitability
2. Balance Sheet Strength
3. Cash Flow Health
4. Ranking: which company appears strongest overall and why.

Keep it under 300 words. Be direct and professional.

DATA:
${JSON.stringify(
  reports.map((r: any) => ({
    company: r.Metadata?.CompanyName,
    financials: r.Financials,
  })),
  null,
  2
)}`;

      const response = await fetch("[open.bigmodel.cn](https://open.bigmodel.cn/api/paas/v4/chat/completions)", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4",
          messages: [{ role: "user", content: prompt }],
          stream: false,
          max_tokens: 600,
        }),
      });

      const data: any = await response.json();

      if (data.choices?.[0]?.message?.content) {
        res.json({ text: data.choices[0].message.content });
      } else {
        res.status(500).json({ error: data.error?.message || "Invalid response from AI" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Vite / Static ──
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (req, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n✅ FINCORE running → http://localhost:${PORT}`);
    console.log(`   DB Root : ${path.resolve(DB_ROOT)}`);
    console.log(`   Reports : ${path.resolve(STORAGE_ROOT)}\n`);
  });
}

startServer().catch(console.error);
