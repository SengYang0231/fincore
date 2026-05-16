// PDF parser
// Only for digital PDF
// Scan for words inside the PDF

import fs from "fs";
import { PDFParse } from "pdf-parse";

const dataBuffer = fs.readFileSync("./testing/sample2.pdf");

const parser = new PDFParse({ data: dataBuffer });

const result = await parser.getText();

console.log(result.text);