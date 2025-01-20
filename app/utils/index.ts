import * as XLSX from "xlsx";

export const downloadFile = (worksheet: XLSX.WorkSheet, file?: File) => {
  // Create a new workbook and append the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Write the workbook to a binary string
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  // Create a Blob from the binary string
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  // Create a link element
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file?.name || "output.xlsx";

  // Append the link to the document, click it, and remove it
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getDataFromSheet = async (file: File): Promise<unknown[]> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) throw new Error("Target not found");

      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheetDataJSON = XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName]
      );

      resolve(sheetDataJSON);
    };
    reader.readAsArrayBuffer(file);
  });
};
