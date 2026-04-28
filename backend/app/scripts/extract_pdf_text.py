from pypdf import PdfReader
import os

files = [
    "c:/Users/HARI/OneDrive/Desktop/Virtual hackathon/SOP Housekeeping - Emergency Procedures.pdf",
    "c:/Users/HARI/OneDrive/Desktop/Virtual hackathon/Template-for-Emergency-Response-plan-Large-hotels.pdf"
]

output_file = "c:/Users/HARI/OneDrive/Desktop/Virtual hackathon/backend/app/scripts/extracted_sop.txt"

with open(output_file, "w", encoding="utf-8") as f:
    for file_path in files:
        f.write(f"\n--- {os.path.basename(file_path)} ---\n")
        if os.path.exists(file_path):
            reader = PdfReader(file_path)
            for page in reader.pages:
                f.write(page.extract_text() + "\n")
        else:
            f.write("File not found\n")

print(f"Extracted to {output_file}")
