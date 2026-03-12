import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const ParsedScheduleSchema = z.object({
    action: z.enum(["replace", "clear"]).optional(),
    subjects: z.array(z.object({
        name: z.string(),
        duration: z.number().positive(),
        colorClass: z.string(),
        isStanding: z.boolean().optional(),
        isBreak: z.boolean().optional(),
        fixedStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    })).optional(),
    timeBounds: z.object({
        start: z.string().regex(/^\d{2}:\d{2}$/),
        end: z.string().regex(/^\d{2}:\d{2}$/),
    }).optional(),
});

export type ParsedSchedule = z.infer<typeof ParsedScheduleSchema>;

export type GeminiHistoryEntry = { role: 'user' | 'model'; parts: { text: string }[] };

const getSystemPrompt = (
    standingItems: { name: string; durationMinutes: number; startTime?: string }[],
    currentItems: { title: string; durationMinutes: number; fixedStartTime?: string }[]
) => `
You are a helpful study assistant for a student. Your task is to parse a natural language prompt into a structured schedule plan, or update an existing one.

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
${standingItems.map(item => `- ${item.name} (${item.durationMinutes} mins${item.startTime ? `, fixed time: ${item.startTime}` : ''})`).join('\n') || 'None'}

CRITICAL INSTRUCTION FOR STANDING ITEMS:
You MUST include ALL of the user's standing items in your output "subjects" array.
You must decide the BEST ORDER for the tasks based on the user's prompt (e.g., if they say "music practice last", put that standing item at the end of the array).
For these standing items, you MUST include the property "isStanding": true and use "subject-pe" as the colorClass.
If a standing item has a fixed time listed above, you MUST include "fixedStartTime" with that exact HH:mm value on the item in the subjects array.
If the user asks for EXTRA time for a standing item, simply increase its duration in the output array.

CURRENT SCHEDULE (what is already planned):
${currentItems.length > 0
    ? currentItems.map(i => `- "${i.title}" (${i.durationMinutes} mins${i.fixedStartTime ? `, fixed at ${i.fixedStartTime}` : ''})`).join('\n')
    : 'Empty — nothing scheduled yet.'}

CONVERSATIONAL UPDATES:
- If the user asks to ADD, REMOVE, CHANGE, or MODIFY tasks, output the COMPLETE updated subjects array reflecting those changes to the current schedule above.
- If the user asks to CLEAR, DELETE EVERYTHING, START OVER, or similar, respond with ONLY: {"action": "clear"}
- Always return the full schedule, not just the changed parts.

Respond ONLY with the JSON block.
`;

export const parsePromptWithAI = async (
    prompt: string,
    standingItems: { name: string; durationMinutes: number; startTime?: string }[] = [],
    currentItems: { title: string; durationMinutes: number; fixedStartTime?: string }[] = [],
    chatHistory: GeminiHistoryEntry[] = []
): Promise<ParsedSchedule | null> => {
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn("Gemini API key is not set. Using mock parsing.");
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            systemInstruction: getSystemPrompt(standingItems, currentItems),
        });
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(prompt);
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
