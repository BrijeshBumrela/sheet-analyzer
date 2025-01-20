import { openai } from "./ai";

export async function setLLM({
  rows,
  code,
}: {
  rows: Array<string>;
  code: string;
}) {
  if (!process.env.PRIVATE_CODE || code !== process.env.PRIVATE_CODE) {
    throw new Error("Invalid code");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.05,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `
        You are a helpful assistant that normalizes data from a Google Sheet.
        Your task is to find information about the company names.
        Specifically I want to know its country, company website (if available otherwise return None), LinkedIn page, Industry
        Input is an array of strings where each string is a company name
          Example: ['AMNEAL IRELAND LTD.', 'BAYER AG']
        Return the data as a valid JSON array, starting directly with '[', with no extra characters or text. Here's the structure:
          Example: [
            { "name": "AMNEAL IRELAND LTD.", "country": "Germany", companyWebsite: "http://website.link", linkedIn: "https://linkedin.com/amneal", industry: "Pharmaceutical Manufacturing" }, 
            { "name": "BAYER AG", "country": "India", companyWebsite: "http://website.link", linkedIn: "https://linkedin.com/bayer", industry: "Manufacturing" }
          ]

        `,
      },
      {
        role: "user",
        content: `Here are the rows of data:\n\n${JSON.stringify(rows, null, 2)}`,
      },
    ],
  });

  return response.choices[0].message.content;
}
