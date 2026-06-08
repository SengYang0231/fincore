import Tesseract from "tesseract.js";

/**
 * Perform optical character recognition on an image file
 */
export async function performOCR(filePath: string): Promise<string> {
  try {
    const result = await Tesseract.recognize(filePath, "eng");
    return result.data.text || "";
  } catch (err) {
    console.error("[OCR ERROR] Failed to recognize image:", err);
    return "";
  }
}

/**
 * Extracts a financial value from numerical strings, handling negative structures like (1,234)
 */
export function extractValue(text: string, keywords: string[]): { value: string | null; confidence: "high" | "medium" | "low" } {
  const lines = text.split("\n");
  
  for (const keyword of keywords) {
    const kwRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (kwRegex.test(line)) {
        // Look for numbers on the same line
        const sameLineNum = extractNumberFromLine(line, keyword);
        if (sameLineNum) {
          return { value: sameLineNum, confidence: "high" };
        }
        
        // If not found, check next line
        if (i + 1 < lines.length) {
          const nextLineNum = extractNumberFromLine(lines[i + 1], "");
          if (nextLineNum && lines[i + 1].trim().length < 40) {
            return { value: nextLineNum, confidence: "medium" };
          }
        }
      }
    }
  }
  
  return { value: null, confidence: "low" };
}

function extractNumberFromLine(line: string, keyword: string): string | null {
  // Remove keyword from the line to avoid matching numbers in headers/dates if any
  let normalizedLine = line;
  if (keyword) {
    normalizedLine = line.replace(new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  }
  
  // Regex to look for numbers, accounting for decimals, commas, parentheses (negative), and minus signs
  // Matches: 12,345, 12345, (1,234.56), -123.45
  const numRegex = /(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\b\d+\b)/;
  
  // Handle negativity indicators
  const negMatches = [
    /\(([\d,]+\.?\d*)\)/, // Parentheses like (12,345.50)
    /-\s*([\d,]+\.?\d*)/,  // Minus sign like -12,345
  ];

  for (const regex of negMatches) {
    const match = normalizedLine.match(regex);
    if (match && match[1]) {
      const parsedNum = cleanAndNormalizeNum(match[1]);
      if (parsedNum) {
        return `-${parsedNum}`;
      }
    }
  }

  const standardMatch = normalizedLine.match(numRegex);
  if (standardMatch && standardMatch[0]) {
    return cleanAndNormalizeNum(standardMatch[0]);
  }

  return null;
}

function cleanAndNormalizeNum(val: string): string | null {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  // Return the rounded integer or clean number format string
  return Math.round(num).toString();
}
