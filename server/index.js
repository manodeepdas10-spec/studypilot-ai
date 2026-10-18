import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({ origin: "http://127.0.0.1:5173" }));
app.use(express.json({ limit: "200kb" }));

const client = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const MAX_TEXT_LENGTH = 16000;

function validateText(text) {
    if (typeof text !== "string" || !text.trim()) {
        return "Please add your study notes first.";
    }
    if (text.length > MAX_TEXT_LENGTH) {
        return `Please keep your notes under ${MAX_TEXT_LENGTH.toLocaleString()} characters.`;
    }
    return null;
}

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(client) });
})

app.post("/api/study", async (req, res) => {
    const { action, text, count } = req.body ?? {};
    const invalid = validateText(text);
    if (invalid) return res.status(400).json({ error: invalid });

    const allowed = new Set(["summarize", "quiz", "flashcards"]);
    if (!allowed.has(action)) {
        return res.status(400).json({ error: "Unknown study action. "});
    }

    if (!client) {
        return res.status(503).json({
            error: "AI is not configured yet. Add OPENAI_API_KEY to your .env file, then restart the server."
        });
    }

    const safeCount = Math.max(3, Math.min(10, Number.parseInt(count, 10) || 5));
    const instructions = {
        summarize:
            "You are StudyPilot, a careful study assistant. Summarize only the supplied notes. Use a clear title, short sections, key concepts, and a final quick-revision list. Do not invent facts. If the notes are unclear, say so.",
        quiz:
            `You are Studypilot, a careful study assistant. Create exactly ${safeCount} multiple-choice questions based only on the supplied notes. Return ONLY valid JSON with this shape: {"questions":[{"question":"...","options":["A ...","B ...","C ...","D ..."],"answer":0,"explanation":"..."}]}. answer must be an integer from 0 to 3. Include four options per question. Make distractors plausible, and do not add facts absent form the notes.`,
        flashcards:
            `You are Studypilot, a careful study assistant. Create ${safeCount} useful flashcards from the supplied notes. Return ONLY valid JSON with this shape: {"cards":[{"front":"Question or term","back":"Clear answer"}]}. Keep answers accurate and grounded in the notes.`
    };

    try {
        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL || "gpt-6-astra",
            instructions: instructions[action],
            input: text
        });
        const output = response.output_text?.trim();
        if (!output) throw new Error("The AI returned an empty response.");

        if (action === "quiz" || action === "flashcards") {
            const cleaned = output.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
            let parsed;
            try {
                parsed = JSON.parse(cleaned);
            } catch {
                throw new Error("The AI response was not valid JSON. Please try again.");
            }
            return res.json({ result: parsed });
        }
        return res.json({ result: output });
    } catch (error) {
        console.error("Study endpoint error:", error?.message || error);
        const status = error?.status === 401 ? 502 : 500;
        return res.status(status).json({
            error: error?.status === 401
                ? "The API key was rejected. Check the key in your .env file."
                : "Could not generate study material. Check your API setup and try again."
        });
    }
});

app.listen(port, "127.0.0.1", () => {
    console.log(`StudyPilot API running at http://127.0.0.1:${port}`);
});