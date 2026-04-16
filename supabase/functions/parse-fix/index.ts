// supabase/functions/parse-fix/index.ts
// Deploy with: supabase functions deploy parse-fix
// Set secret: supabase secrets set GEMINI_API_KEY=your_key_here

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { text } = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "No text provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const prompt = `You are a task parser for a household chore app called FlatFix used by 7 roommates.
Parse the following natural language input into a structured task.
Respond with ONLY valid JSON, no markdown, no backticks, no explanation.

Input: "${text}"

Return this exact JSON structure:
{
  "title": "Short, clear task title (max 8 words)",
  "description": "Brief description of what needs to be done",
  "urgency": <number 1-4, where 1=low 2=medium 3=high 4=urgent>,
  "category": "<one of: trash, dishes, bathroom, kitchen, grocery, general>",
  "location": "<one of: kitchen, bathroom, living room, bedroom, hallway, outside, general>"
}

Urgency guidelines:
- 1 (low): Nice-to-have, no time pressure. Example: "we should reorganize the pantry sometime"
- 2 (medium): Should be done today or tomorrow. Example: "we're running low on dish soap"
- 3 (high): Needs attention within a few hours. Example: "the kitchen trash is full and starting to smell"
- 4 (urgent): Needs immediate attention. Example: "there's water leaking under the sink"`

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 256,
        },
      }),
    })

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    // Clean and parse JSON
    const cleaned = responseText.replace(/```json\n?|```\n?/g, "").trim()
    const parsed = JSON.parse(cleaned)

    // Validate fields
    const validCategories = ["trash", "dishes", "bathroom", "kitchen", "grocery", "general"]
    const validLocations = ["kitchen", "bathroom", "living room", "bedroom", "hallway", "outside", "general"]

    const fix = {
      title: String(parsed.title || "").slice(0, 100),
      description: String(parsed.description || "").slice(0, 500),
      urgency: Math.min(4, Math.max(1, Number(parsed.urgency) || 2)),
      category: validCategories.includes(parsed.category) ? parsed.category : "general",
      location: validLocations.includes(parsed.location) ? parsed.location : "general",
    }

    return new Response(
      JSON.stringify(fix),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Parse error:", error)
    return new Response(
      JSON.stringify({ error: "Failed to parse fix" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
