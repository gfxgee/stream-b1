import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// Single switch for the whole app. Set AI_PROVIDER=openai to use OpenAI;
// anything else (or unset) uses Gemini.
export type AiProvider = "gemini" | "openai";

export function activeProvider(): AiProvider {
  return process.env.AI_PROVIDER?.toLowerCase() === "openai" ? "openai" : "gemini";
}

export function providerLabel(): string {
  return activeProvider() === "openai"
    ? process.env.OPENAI_MODEL || "gpt-4o-mini"
    : process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

// True when the active provider has its API key set.
export function isAiConfigured(): boolean {
  return activeProvider() === "openai"
    ? Boolean(process.env.OPENAI_API_KEY)
    : Boolean(process.env.GEMINI_API_KEY);
}

type GenOpts = {
  system: string;
  user: string;
  // Provider-neutral JSON Schema (objects must set additionalProperties:false
  // and list every property in `required` — OpenAI strict mode needs this).
  schema: Record<string, unknown>;
  schemaName: string;
  temperature?: number;
  maxOutputTokens?: number;
};

async function callGemini(o: GenOpts): Promise<unknown> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const res = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: o.user,
    config: {
      systemInstruction: o.system,
      responseMimeType: "application/json",
      responseJsonSchema: o.schema,
      temperature: o.temperature ?? 0.6,
      // Disable thinking so the whole budget goes to the JSON answer.
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: o.maxOutputTokens ?? 2048,
    },
  });
  const text = res.text;
  if (!text) throw new Error("Empty response from Gemini.");
  return JSON.parse(text);
}

async function callOpenAI(o: GenOpts): Promise<unknown> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: o.system },
      { role: "user", content: o.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: o.schemaName, schema: o.schema, strict: true },
    },
    temperature: o.temperature ?? 0.6,
    max_completion_tokens: o.maxOutputTokens ?? 2048,
  });
  const choice = res.choices[0];
  if (choice?.finish_reason === "length") {
    throw new Error(
      "OpenAI response was truncated (raise max_completion_tokens / shorten the prompt)."
    );
  }
  const text = choice?.message?.content;
  if (!text)
    throw new Error(`Empty response from OpenAI (finish_reason=${choice?.finish_reason}).`);
  return JSON.parse(text);
}

// Generates a JSON object matching `schema` from the active provider.
// Returns the parsed (unvalidated) object — callers validate shape themselves.
export async function generateJSON(o: GenOpts): Promise<unknown> {
  console.log(`[ai] provider=${activeProvider()} model=${providerLabel()}`);
  return activeProvider() === "openai" ? callOpenAI(o) : callGemini(o);
}
