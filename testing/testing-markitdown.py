# Markitdown
# Does not support scanned pdf and pictures
from markitdown import MarkItDown
import os

md = MarkItDown()

result = md.convert("testing/finstat.pdf")

filepath = "testing/output/sample1.txt"
os.makedirs("testing/output", exist_ok=True)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(result.text_content) 

print("Done")