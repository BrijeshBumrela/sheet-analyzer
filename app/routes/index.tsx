import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { useState } from "react";
import { setLLM } from "~/server/setLLM";
import * as XLSX from "xlsx";
import { downloadFile, getDataFromSheet } from "~/utils";

type TLLMResponse = {
  name: string;
  country: string;
  companyWebsite: string;
  linkedIn: string;
  industry: string;
};

const normalizeSheet = createServerFn({ method: "POST" })
  .validator((d: { message: string[]; code: string }) => d)
  .handler(async ({ data }) => {
    try {
      const result = await setLLM({
        rows: data.message,
        code: data.code,
      });
      if (!result) return;

      const response = JSON.parse(result) as { data: Array<TLLMResponse> };
      return response.data;
    } catch (error) {
      throw error;
    }
  });

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const [code, setCode] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(250);
  const [offset, setOffset] = useState(0);

  const handleFileUpload: React.InputHTMLAttributes<HTMLInputElement>["onChange"] =
    (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        alert("No file selected.");
        return;
      }

      setFile(file);
    };

  const dataToSheet = async (llmData: TLLMResponse[]) => {
    if (!file) {
      alert("No file selected.");
      return;
    }

    setFile(file);

    if (file.name.endsWith(".xlsx")) {
      const dataFromSheet = await getDataFromSheet(file);

      const finalData = dataFromSheet.map((row) => {
        const companyName = row.Company;
        const companyObject = llmData.find((each) => each.name === companyName);

        if (!companyObject) return row;

        return {
          ...row,
          "Linkdin of the Company": companyObject.linkedIn,
          Industry: companyObject.industry,
          "Country (HQ)": companyObject.country,
          "Company Website": companyObject.companyWebsite,
        };
      });

      const sheet = XLSX.utils.json_to_sheet(finalData);
      downloadFile(sheet, file);
    }
  };

  const generateResponse = async () => {
    try {
      if (!file) throw alert("file not found");
      const dataFromSheet = await getDataFromSheet(file);

      const finalSheetData = dataFromSheet
        .filter((row) => {
          return !(
            row["Linkdin of the Company"] &&
            row["Industry"] &&
            row["Country (HQ)"] &&
            row["Company Website"]
          );
        })
        .map((row) => row.Company)
        .slice(offset, offset + limit);

      setLoading(true);
      const res = await normalizeSheet({
        data: { message: finalSheetData, code },
      });
      if (!res) throw new Error("response did not generate");
      dataToSheet(res);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
        return;
      }
      alert("Invalid code");
    } finally {
      setLoading(false);
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
          generateResponse();
        }}
      >
        Generate
      </button>
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span>Offset: </span>
        <input
          type="number"
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
        />
        <h3>Analyzing will start from {offset} row</h3>
      </div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
        }}
      >
        <span>Limit(Optional): </span>
        <input
          type="number"
          value={offset}
          onChange={(e) => setLimit(Number(e.target.value))}
        />
        <h3>How many rows to analyze - {limit}</h3>
      </div>
      {loading ? <h3>Loading...</h3> : null}
    </div>
  );
}
