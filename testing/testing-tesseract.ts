// Tesseract
// Convert an image into texts
// To run: node testing/testing-tesseract.ts

import Tesseract from "tesseract.js";

const result = await Tesseract.recognize(
    "./testing/sample3.png",
    "eng"
);

try {
    const filePath = "testing/output/sample_text1.txt";

    console.log(result.data.text);

} catch (error){
    console.log(error);
}