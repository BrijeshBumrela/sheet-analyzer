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
    max_tokens: 1000,
    messages: [
      {
        role: "system",
        content: `
        You are a helpful assistant that normalizes data from a Google Sheet.
        Your task is to process rows of data where each row contains key-value pairs.
        The keys may vary but have similar meanings. Map similar keys to standardized ones:
          - "First name", "name", "full name" → "name"
          - "email", "email id", "email address" → "email"
        Ignore unrecognized keys and return only the standardized fields.
        Input is an array of strings where each string is one cell and has the fields like email and name separated by \n.
          Example: ['name: Anjali\nemail Id: anjali.email@gmail.com', 'First name: Brijesh\nemail: email@gmail.com']
        Return the data as a valid JSON array, starting directly with '[', with no extra characters or text. Here's the structure:
          Example: [{ "name": "Brijesh", "email": "brijesh@gmail.com" }, { "name": "Anjali", "email": "anjali@gmail.com" }]

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
