import { GoogleGenAI } from "@google/genai";

interface ParsedDtrEntry {
  day: number;
  morningIn: string | null;
  morningOut: string | null;
  afternoonIn: string | null;
  afternoonOut: string | null;
  overtimeIn: string | null;
  overtimeOut: string | null;
}

export interface ProcessedDtrEntry {
  day: number;
  clockIn: string | null;
  clockOut: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  hasData: boolean;
}

const DTR_EXTRACTION_PROMPT = `You are analyzing a Philippine Daily Time Record (DTR) form image.
The DTR is a physical card/sheet used to record employee work hours. It typically has:
- A header with Employee No., Name, Position, Department, Pay Ending date
- Two halves: days 1-15 on one side and days 16-31 on the other
- Columns for each day: MORNING (IN/OUT), AFTERNOON (IN/OUT), OVERTIME (IN/OUT)
- Times are handwritten

Extract ALL days that have at least one time entry. For each day with data, return:
{
  "day": <number 1-31>,
  "morningIn": "<HH:mm or null>",
  "morningOut": "<HH:mm or null>",
  "afternoonIn": "<HH:mm or null>",
  "afternoonOut": "<HH:mm or null>",
  "overtimeIn": "<HH:mm or null>",
  "overtimeOut": "<HH:mm or null>"
}

Rules:
- Use 24-hour time format (e.g., "08:00", "13:30", "17:00")
- If morning times look like AM times (7, 8, 9, 10, 11, 12), keep as-is in 24h
- If afternoon/overtime times look like PM (1, 2, 3, 4, 5, 6), convert to 24h (add 12)
- If a time cell is empty, blank, or unreadable, use null
- Only include days that have at least one non-null time entry
- Return ONLY a raw JSON array — no markdown code fences, no explanation`;

export async function parseDtrImage(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ProcessedDtrEntry[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not configured. Please add it to your .env file."
    ) as Error & { statusCode: number };
    err.statusCode = 500;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });
  const base64 = imageBuffer.toString("base64");

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: DTR_EXTRACTION_PROMPT },
            { inlineData: { data: base64, mimeType } },
          ],
        },
      ],
    });
  } catch (err) {
    const e = err as Error;
    const parseErr = new Error(
      `Failed to process image with AI: ${e.message}`
    ) as Error & { statusCode: number };
    parseErr.statusCode = 502;
    throw parseErr;
  }

  const text = response.text ?? "";
  if (!text.trim()) {
    const err = new Error(
      "AI returned an empty response. The image may be unclear or not a DTR form."
    ) as Error & { statusCode: number };
    err.statusCode = 422;
    throw err;
  }

  let raw: ParsedDtrEntry[];
  try {
    // Strip markdown fences if AI includes them despite instructions
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    raw = JSON.parse(cleaned);
  } catch {
    const err = new Error(
      "Failed to parse AI response. The image may not be a valid DTR form."
    ) as Error & { statusCode: number };
    err.statusCode = 422;
    throw err;
  }

  if (!Array.isArray(raw) || raw.length === 0) {
    const err = new Error(
      "No time entries were found in the DTR image. Please ensure the image is clear and contains filled-in time entries."
    ) as Error & { statusCode: number };
    err.statusCode = 422;
    throw err;
  }

  // Map 6-column DTR to single-shift model
  return raw
    .map((entry) => {
      const clockIn =
        entry.morningIn ?? entry.afternoonIn ?? entry.overtimeIn ?? null;
      const clockOut =
        entry.overtimeOut ?? entry.afternoonOut ?? entry.morningOut ?? null;

      // Break is the gap between morning out and afternoon in
      const breakStartTime = entry.morningOut ?? null;
      const breakEndTime = entry.afternoonIn ?? null;

      // Only include break if both endpoints exist
      const hasBreak = Boolean(breakStartTime && breakEndTime);

      return {
        day: entry.day,
        clockIn,
        clockOut,
        breakStartTime: hasBreak ? breakStartTime : null,
        breakEndTime: hasBreak ? breakEndTime : null,
        hasData: Boolean(clockIn || clockOut),
      };
    })
    .filter((e) => e.hasData);
}
