import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import multer from "multer";
// @ts-ignore
import pdf from "pdf-parse";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import dotenv from "dotenv";
import { createWorker } from 'tesseract.js';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_ROOT = process.env.FINCORE_DB_PATH || "./fincore_db";
const STORAGE_ROOT = path.join(DB_ROOT, "original_reports");

// Handle pdf-parse ESM default export
const parsePdf = (pdf as any).default || pdf;

// Ensure DB and storage roots exist
[DB_ROOT, STORAGE_ROOT].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, STORAGE_ROOT),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Financial Dictionary for normalization
const DICTIONARY: Record<string, string[]> = {
  revenue: ["Revenue", "Turnover", "Total Revenue", "Income from operations"],
  netProfit: ["Profit After Tax", "Profit Attributable to Owners", "Net Income", "Net Profit"],
  costOfSales: ["Cost of Sales", "Cost of Revenue", "Direct Costs"],
  grossProfit: ["Gross Profit"],
  totalAssets: ["Total Assets"],
  totalLiabilities: ["Total Liabilities"],
  operatingCashFlow: ["Net Cash from Operating Activities", "Cash Generated from Operations"],
};

// Simple table row extractor using regex
function extractNumericValue(text: string, keys: string[]): string | null {
  for (const key of keys) {
    // Look for lines that start with the key (case insensitive) followed by numbers
    // This is a simplified logic for extraction
    const regex = new RegExp(`${key}\\s+([\\(]?[\\d,.]+[\\)]?)`, "i");
    const match = text.match(regex);
    if (match) {
      let val = match[1].replace(/[\(\),]/g, (m) => (m === "(" || m === ")" ? "-" : ""));
      return val.trim();
    }
  }
  return null;
}

async function performOCR(filePath: string) {
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  return text;
}

async function startServer() {
  // API routes
  app.use(express.json());

  // Serve original reports
  app.use("/reports", express.static(STORAGE_ROOT));

  // Analyze Documents (PDF or Image)
  app.post("/api/analyze", upload.array("reports"), async (req: any, res) => {
    try {
      const { year, sector } = req.body;
      const files = req.files as any[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      const results = [];

      for (const file of files) {
        let text = "";
        let docType = "DIGITAL_PDF";

        if (file.mimetype === "application/pdf") {
          const buffer = fs.readFileSync(file.path);
          const data = await parsePdf(buffer);
          text = data.text;

          // Detection: if very little text, assume it's a scanned PDF
          if (text.trim().length < 150) {
            console.log(`[OCR] Detected scanned PDF: ${file.originalname}`);
            text = await performOCR(file.path);
            docType = "SCANNED_PDF";
          }
        } else if (file.mimetype.startsWith("image/")) {
          console.log(`[OCR] Detected image: ${file.originalname}`);
          text = await performOCR(file.path);
          docType = "IMAGE";
        }

        // Metadata extraction (simplified)
        const companyNameMatch = text.match(/([A-Z\s]{4,}(?:BERHAD|BHD))/i);
        const companyName = companyNameMatch ? companyNameMatch[1].trim() : file.originalname.replace(/\.(pdf|png|jpg|jpeg)$/i, "");
        
        let detectedSector = sector;
        const lowText = text.toLowerCase();
        if (lowText.includes("semiconductor") || lowText.includes("software")) detectedSector = "TECHNOLOGY";
        else if (lowText.includes("palm oil") || lowText.includes("estate")) detectedSector = "PLANTATION";
        else if (lowText.includes("bank") || lowText.includes("insurance")) detectedSector = "FINANCIAL_SERVICES";

        const financials: any = {
          incomeStatement: {},
          balanceSheet: {},
          cashFlow: {},
        };

        for (const [id, keys] of Object.entries(DICTIONARY)) {
          const val = extractNumericValue(text, keys);
          if (id === "revenue" || id === "netProfit" || id === "costOfSales" || id === "grossProfit") {
            financials.incomeStatement[id] = val;
          } else if (id === "totalAssets" || id === "totalLiabilities") {
            financials.balanceSheet[id] = val;
          } else if (id === "operatingCashFlow") {
            financials.cashFlow[id] = val;
          }
        }

        const reportData = {
          CompanyReport: {
            Metadata: {
              CompanyName: companyName,
              FinancialYear: year,
              Sector: detectedSector,
              OriginalFileName: file.originalname,
              StoredFileName: file.filename,
              Currency: "MYR '000",
              DocType: docType
            },
            Financials: financials,
          },
        };

        // Save to XML
        const sectorDir = path.join(DB_ROOT, year, detectedSector);
        if (!fs.existsSync(sectorDir)) fs.mkdirSync(sectorDir, { recursive: true });

        const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}.xml`;
        const builder = new XMLBuilder({ format: true });
        const xmlContent = builder.build(reportData);
        fs.writeFileSync(path.join(sectorDir, fileName), xmlContent);

        results.push({
          companyName,
          detectedSector,
          isConflict: detectedSector !== sector,
          fileName,
          docType,
          storedFileName: file.filename
        });
      }

      res.json({ success: true, results });
    } catch (error: any) {
      console.error("Analysis failure:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get reports for a year/sector
  app.get("/api/reports/:year/:sector", async (req, res) => {
    try {
      const { year, sector } = req.params;
      const sectorPath = path.join(DB_ROOT, year, sector);

      if (!fs.existsSync(sectorPath)) {
        return res.json([]);
      }

      const files = fs.readdirSync(sectorPath);
      const parser = new XMLParser();
      const reports = files.map((file) => {
        const content = fs.readFileSync(path.join(sectorPath, file), "utf-8");
        return parser.parse(content).CompanyReport;
      });

      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get archive list
  app.get("/api/archive", async (req, res) => {
    try {
      if (!fs.existsSync(DB_ROOT)) return res.json([]);
      
      const years = fs.readdirSync(DB_ROOT).filter(f => !isNaN(Number(f)));
      const archive = years.map(year => {
        const yearPath = path.join(DB_ROOT, year);
        const sectors = fs.readdirSync(yearPath);
        return { year, sectors };
      });
      
      res.json(archive);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Zhipu AI (Zai) Insights Endpoint
  app.post("/api/ai-insights", async (req, res) => {
    try {
      const { reports, sector, year } = req.body;
      const apiKey = process.env.ZHIPU_AI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "ZHIPU_AI_API_KEY is not configured in the environment." });
      }

      const prompt = `Analyze the following financial data for companies in the ${sector} sector of Bursa Malaysia for FY${year}. 
      Provide a concise side-by-side comparison summary. Focus on:
      1. Profitability (Revenue and Net Profit growth/margins).
      2. Solvency (Total Assets vs Liabilities).
      3. Operational Efficiency.
      
      Keep it brief and professional.
      
      DATA: ${JSON.stringify(reports.map((r: any) => ({
        name: r.Metadata.CompanyName,
        financials: r.Financials
      })))}`;

      const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "glm-4",
          messages: [
            { role: "user", content: prompt }
          ],
          stream: false
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        res.json({ text: data.choices[0].message.content });
      } else {
        console.error("Zhipu AI error response:", data);
        res.status(500).json({ error: "Invalid response from Zhipu AI" });
      }
    } catch (error: any) {
      console.error("AI Insights Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
X