// Tesseract
// Convert an image into texts

import Tesseract from "tesseract.js";

const result = await Tesseract.recognize(
    "./sample3.png",
    "eng"
);

console.log(result.data.text);