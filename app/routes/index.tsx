import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";
import { setLLM } from "~/server/setLLM";
import * as XLSX from "xlsx";

const normalizeSheet = createServerFn({ method: "POST" })
  .validator((d: { message: string[][]; code: string }) => d)
  .handler(async ({ data }) => {
    const result = await setLLM({
      rows: data.message.map((row) => row[0]),
      code: data.code,
    });
    return result;
  });

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [code, setCode] = useState("");
  const [parsedData, setParsedData] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload: React.InputHTMLAttributes<HTMLInputElement>["onChange"] =
    (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        setError("No file selected.");
        return;
      }

      const reader = new FileReader();

      if (file.name.endsWith(".xlsx")) {
        // Parse Excel file
        reader.onload = (e) => {
          if (!e.target?.result) return;
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName]
          );
          console.log(sheetData);
          setParsedData(sheetData.map((row) => Object.values(row)));
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError("Unsupported file type. Please upload a CSV or Excel file.");
      }
    };

  const generateResponse = async (data: string[][]) => {
    try {
      const res = await normalizeSheet({
        data: { message: data, code },
      });
      console.log(res);
    } catch (error) {
      alert("Invalid code");
    }
  };

  return (
    <div>
      <div>
        <input
          type="text"
          name="code"
          value={code}
          placeholder="Enter code"
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
      <div>
        <input type="file" onChange={handleFileUpload} />
      </div>
      <button
        type="button"
        disabled={!code}
        onClick={() => {
          generateResponse(parsedData);
        }}
      >
        Generate
      </button>
    </div>
  );
}
