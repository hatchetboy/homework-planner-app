import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const ParsedScheduleSchema = z.object({
    subjects: z.array(z.object({
        name: z.string(),
        duration: z.number().positive(),
        colorClass: z.string(),
        isStanding: z.boolean().optional(),
        isBreak: z.boolean().optional(),
        fixedStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    })),
    timeBounds: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
    }).optional(),
});

export type ParsedSchedule = z.infer<typeof ParsedScheduleSchema>;

const getSystemPrompt = (standingItems: { name: string; durationMinutes: number }[]) => `
You are a helpful study assistant for a student. Your task is to parse a natural language prompt into a structured schedule plan.
Extract the subjects, their durations (in minutes), and any specific time bounds (start and end times) mentioned.

Subject colors mapping:
- Math/Maths -> subject-math
- Science -> subject-science
- English/Reading/Writing -> subject-english
- History -> subject-history
- Music/Piano/Instrument -> subject-music
- PE/Exercise/Sports -> subject-pe
- Everything else -> subject-other

Output format MUST be a single JSON block like this:
{
  "subjects": [
    { "name": "Math Homework", "duration": 30, "colorClass": "subject-math" },
    { "name": "Horn Practice", "duration": 15, "colorClass": "subject-pe", "isStanding": true },
    { "name": "Dinner", "duration": 30, "colorClass": "bg-gray-200 text-gray-700", "isBreak": true, "fixedStartTime": "18:00" },
    ...
  ],
  "timeBounds": { "start": "HH:mm", "end": "HH:mm" } // Optional
}

If the user does not explicitly state when their ENTIRE homework session starts or ends, DO NOT INCLUDE the timeBounds field.
NEVER use a time attached to a specific task (e.g. "dinner at 6pm") as the global timeBounds.
If a user specifies a strict start time for EXACTLY ONE task (like "dinner at 6pm"), include the "fixedStartTime" property on that specific task formatted as 24-hour "HH:mm".
**CRITICAL:** You MUST place tasks in the "subjects" array in the correct CHRONOLOGICAL order. If a task has a "fixedStartTime", it must be positioned in the list such that its calculated start time (summing previous durations + 5-minute break gaps) matches that time. You MUST move or reorder other tasks (including standing items) to ensure the timed task fits.
If no durations are mentioned, default to 30 minutes for regular subjects.
If the user specifies they have dinner, a snack, or explicit free time, include it in the "subjects" array with "isBreak": true and "colorClass": "bg-gray-200 text-gray-700".

The user already has the following standing items scheduled automatically:
${standingItems.map(item => `- ${item.name} (${item.durationMinutes} mins)`).join('\n') || 'None'}

CRITICAL INSTRUCTION FOR STANDING ITEMS:
You MUST include ALL of the user's standing items in your output "subjects" array.
You must decide the BEST ORDER for the tasks based on the user's prompt (e.g., if they say "music practice last", put that standing item at the end of the array).
For these standing items, you MUST include the property "isStanding": true and use "subject-pe" as the colorClass.
If the user asks for EXTRA time for a standing item, simply increase its duration in the output array.

Respond ONLY with the JSON block.
`;

export const parsePromptWithAI = async (
    prompt: string,
    standingItems: { name: string; durationMinutes: number }[] = []
): Promise<ParsedSchedule | null> => {
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn("Gemini API key is not set. Using mock parsing.");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent([getSystemPrompt(standingItems), prompt]);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const parsed = JSON.parse(jsonMatch[0]);
        const validated = ParsedScheduleSchema.safeParse(parsed);

        if (!validated.success) {
            console.error("AI response failed validation:", validated.error.flatten());
            return null;
        }

        return validated.data;
    } catch (error) {
        console.error("AI Parsing Error:", error);
        return null;
    }
};
