import { FINANCIAL_DICTIONARY } from "../config/dictionary";
import { 
  ExtractedValue, 
  ExtractedFinancialPayload, 
  AnalysisOutput 
} from "../types/index";

export class ExtractionService {
  
  /**
   * Main entry point to process unstructured text into clean domain figures
   */
  public processFinancials(text: string, originalFileName: string): AnalysisOutput {
    const normalizedText = this.normalizeText(text);

    const suggestedCompanyName = this.detectCompanyName(normalizedText, originalFileName);
    const suggestedSector = this.detectSector(normalizedText, "TECHNOLOGY");
    const extractedData = this.extractAllMetrics(normalizedText);

    return {
      suggestedCompanyName,
      suggestedSector,
      extractedData,
    };
  }

  /**
   * Clean and normalize text for uniform strategy execution
   */
  private normalizeText(text: string): string {
    return text
      .replace(/[\r\n]+/g, "\n")
      .replace(/\t+/g, " ")
      .replace(/\s{2,}/g, " ")
      .replace(/['']/g, "'")
      .replace(/[""]/g, '"')
      .replace(/[']/g, "'");
  }

  /**
   * Evaluates corporate names using regional Malaysian structural naming markers
   */
  private detectCompanyName(text: string, fallback: string): string {
    const patterns = [
      /([A-Z][A-Z\s&()'.,]{3,60}(?:BERHAD|BHD\.?))/i,
      /([A-Z][A-Z\s&()'.,]{3,60}(?:SDN\.?\s*BHD\.?))/i,
      /([A-Z][A-Z\s&()'.,]{3,60}(?:PLC|LTD|LIMITED|CORPORATION|CORP))/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().replace(/\s+/g, " ").toUpperCase();
      }
    }

    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 25)) {
      if (line.length > 5 && line.length < 80 && /^[A-Z][A-Z\s&.()',-]+$/.test(line)) {
        return line;
      }
    }

    return fallback.replace(/\.(pdf|png|jpg|jpeg)$/i, "").replace(/[-_]/g, " ").trim();
  }

  /**
   * Identifies the primary operational sector baseline via token proximity checks
   */
  private detectSector(text: string, defaultSector: string): string {
    const lowerText = text.toLowerCase();
    const sectorKeywords: Record<string, string[]> = {
      TECHNOLOGY: ["semiconductor", "software", "tech", "it services", "cloud", "digital", "computer", "electronics"],
      PLANTATION: ["palm oil", "plantation", "estate", "rubber", "agriculture", "oleochemical"],
      FINANCIAL_SERVICES: ["bank", "insurance", "finance", "financial services", "capital", "securities", "investment bank"],
      CONSUMER_PRODUCTS: ["consumer", "retail", "beverage", "food", "household", "fmcg", "supermarket"],
      INDUSTRIAL_PRODUCTS: ["manufacturing", "industrial", "machinery", "equipment", "steel", "cement"],
      REITS: ["reit", "property fund", "real estate investment trust", "property trust"],
      ENERGY: ["oil", "gas", "energy", "petroleum", "power", "utility", "electricity"],
      HEALTHCARE: ["hospital", "pharma", "healthcare", "medical", "clinic", "pharmaceutical", "diagnostic"],
      CONSTRUCTION: ["construction", "contractor", "infrastructure", "building", "property development"],
    };

    for (const [sector, keywords] of Object.entries(sectorKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) return sector;
      }
    }

    return defaultSector;
  }

  /**
   * Parses localized financial notation formats into standard JS numeric elements
   */
  private parseFinancialNumber(str: string): number | null {
    if (!str) return null;

    let cleaned = str.trim();

    const isNegative = cleaned.startsWith("(") && cleaned.endsWith(")");
    if (isNegative) {
      cleaned = cleaned.slice(1, -1);
    }

    if (cleaned.endsWith("-") || cleaned.toUpperCase().endsWith("CR")) {
      cleaned = cleaned.replace(/[-]$/, "").replace(/CR$/i, "").trim();
    }

    cleaned = cleaned.replace(/[RM$€£¥,\s]/g, "");

    if (/[Mm]$/.test(cleaned)) {
      cleaned = cleaned.replace(/[Mm]$/, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : (isNegative ? -num : num) * 1000;
    }
    if (/[Kk]$/.test(cleaned)) {
      cleaned = cleaned.replace(/[Kk]$/, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : (isNegative ? -num : num);
    }

    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;

    return isNegative ? -num : num;
  }

  /**
   * Strategy 1: Column-based spatial reading extraction
   */
  private extractFromTableFormat(text: string, keywords: string[]): ExtractedValue | null {
    const lines = text.split("\n");

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      const keywordPattern = new RegExp(
        keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*"),
        "i"
      );

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineLower = line.toLowerCase();

        if (keywordPattern.test(line) || lineLower.includes(keywordLower)) {
          const numbers = line.match(/[\(\-]?[\d,]+\.?\d*[\)]?/g);
          if (numbers && numbers.length > 0) {
            for (const numStr of numbers) {
              const num = this.parseFinancialNumber(numStr);
              if (num !== null && Math.abs(num) >= 1) {
                return {
                  value: String(num),
                  confidence: "high",
                  source: `Line: "${line.trim().substring(0, 80)}..."`,
                };
              }
            }
          }

          for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
            const nextLine = lines[j];
            const numbers = nextLine.match(/[\(\-]?[\d,]+\.?\d*[\)]?/g);
            if (numbers && numbers.length > 0) {
              for (const numStr of numbers) {
                const num = this.parseFinancialNumber(numStr);
                if (num !== null && Math.abs(num) >= 1) {
                  return {
                    value: String(num),
                    confidence: "medium",
                    source: `Near: "${keyword}" → "${nextLine.trim().substring(0, 60)}..."`,
                  };
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Strategy 2: Direct syntax structural regular expression matching
   */
  private extractWithPatterns(text: string, keywords: string[]): ExtractedValue | null {
    for (const keyword of keywords) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const flexibleKeyword = escaped.replace(/\s+/g, "[\\s\\-_]*");

      const patterns = [
        new RegExp(`${flexibleKeyword}[:\\s]*([\\(\\-]?[\\d,]+\\.?\\d*[\\)]?)`, "i"),
        new RegExp(`${flexibleKeyword}[:\\s]*(?:RM|\\$)?\\s*([\\(\\-]?[\\d,]+\\.?\\d*[\\)]?)`, "i"),
        new RegExp(`([\\(\\-]?[\\d,]+\\.?\\d*[\\)]?)\\s*${flexibleKeyword}`, "i"),
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const num = this.parseFinancialNumber(match[1]);
          if (num !== null && Math.abs(num) >= 1) {
            return {
              value: String(num),
              confidence: "medium",
              source: `Pattern match for "${keyword}"`,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Low-level string distance helper
   */
  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Strategy 3: Tolerates character anomalies utilizing Levenshtein distance computations
   */
  private extractWithFuzzyMatch(text: string, keywords: string[]): ExtractedValue | null {
    const lines = text.split("\n");
    const threshold = 3; 

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();

      for (const line of lines) {
        const words = line.split(/\s+/);

        for (let start = 0; start < words.length; start++) {
          for (let len = 1; len <= Math.min(5, words.length - start); len++) {
            const segment = words.slice(start, start + len).join(" ").toLowerCase();
            const distance = this.levenshtein(keywordLower, segment);

            if (distance <= threshold) {
              const restOfLine = words.slice(start + len).join(" ");
              const numbers = restOfLine.match(/[\(\-]?[\d,]+\.?\d*[\)]?/g);

              if (numbers && numbers.length > 0) {
                for (const numStr of numbers) {
                  const num = this.parseFinancialNumber(numStr);
                  if (num !== null && Math.abs(num) >= 1) {
                    return {
                      value: String(num),
                      confidence: "low",
                      source: `Fuzzy match: "${segment}" ≈ "${keyword}"`,
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Orchestrates the fallback engine hierarchy per metrics group entry
   */
  private extractValue(text: string, keywords: string[]): ExtractedValue {
    let result = this.extractFromTableFormat(text, keywords);
    if (result?.value) return result;

    result = this.extractWithPatterns(text, keywords);
    if (result?.value) return result;

    result = this.extractWithFuzzyMatch(text, keywords);
    if (result?.value) return result;

    return { value: null, confidence: "low", source: "Not found" };
  }

  /**
   * Runs the cascading rules matrix across all properties in the financial data model
   */
  private extractAllMetrics(text: string): ExtractedFinancialPayload {
    const payload: ExtractedFinancialPayload = {
      incomeStatement: {},
      balanceSheet: {},
      cashFlow: {},
      ratios: {},
      growth: {},
      advanced: {},
    };

    for (const [fieldId, config] of Object.entries(FINANCIAL_DICTIONARY)) {
      const result = this.extractValue(text, config.keywords);
      
      if (!payload[config.category]) {
        payload[config.category] = {};
      }

      payload[config.category][fieldId] = {
        value: result.value,
        confidence: result.confidence,
      };
    }

    return payload;
  }
}