import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

async function test() {
    // Read the env var from the .env file
    const envFile = fs.readFileSync('c:/Antigravity Dev/Test Projects/homework-planner/.env', 'utf-8');
    const match = envFile.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (!match) {
        console.error("No API key found");
        return;
    }
    const apiKey = match[1].trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const prompt = `
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
    { "name": "Dinner", "duration": 30, "colorClass": "bg-gray-200 text-gray-700", "isBreak": true, "fixedStartTime": "18:00" }
  ],
  "timeBounds": { "start": "HH:mm", "end": "HH:mm" } // Optional
}

If a user specifies a strict start time for EXACTLY ONE task (like "dinner at 6pm"), include the "fixedStartTime" property on that specific task formatted as 24-hour "HH:mm".
**CRITICAL:** You MUST place tasks in the "subjects" array in the correct CHRONOLOGICAL order. If a task has a "fixedStartTime", it must be positioned in the list such that its calculated start time (summing previous durations + 5-minute break gaps) matches that time. You MUST reorder other tasks (including standing items) to ensure the timed task fits.
 If no durations are mentioned, default to 30 minutes for regular subjects.
If the user specifies they have dinner, a snack, or explicit free time, include it in the "subjects" array with "isBreak": true and "colorClass": "bg-gray-200 text-gray-700".
None

The user already has the following standing items scheduled automatically:
- Vocal Practice (20 mins)
- Horn Practice (20 mins)

CRITICAL INSTRUCTION FOR STANDING ITEMS:
You MUST include ALL of the user's standing items in your output "subjects" array. 
You must decide the BEST ORDER for the tasks based on the user's prompt (e.g., if they say "music practice last", put that standing item at the end of the array).
For these standing items, you MUST include the property "isStanding": true and use "subject-pe" as the colorClass.
If the user asks for EXTRA time for a standing item, simply increase its duration in the output array.

Respond ONLY with the JSON block.
`;

    const userPrompt = "I have 20 mins of reading and 30 mins of math. I also have dinner at 6pm for 30mins.";

    try {
        const result = await model.generateContent([prompt, userPrompt]);
        const response = await result.response;
        console.log("AI Response:");
        console.log(response.text());
    } catch (e) {
        console.error(e);
    }
}

test();
