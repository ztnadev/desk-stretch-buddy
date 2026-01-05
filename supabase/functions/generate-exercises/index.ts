import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExerciseHistory {
  exercise_name: string;
  completed_count: number;
  last_completed: string;
}

interface RequestBody {
  exerciseHistory: ExerciseHistory[];
  availableExercises: { id: string; name: string; category: string; target_area: string; difficulty: string }[];
  currentStreak: number;
  timeOfDay: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseHistory, availableExercises, currentStreak, timeOfDay }: RequestBody = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a helpful desk exercise advisor. Your job is to recommend 4-5 exercises for a 10-15 minute desk workout session.

Consider these factors when making recommendations:
1. Time of day: Morning sessions should be more energizing, afternoon sessions should help with mid-day slumps, evening sessions should focus on relaxation and stretching
2. User's exercise history: Try to vary exercises to avoid repetition while still including favorites
3. Current streak: For users with longer streaks, gradually introduce more challenging exercises
4. Balance: Include a mix of stretching, strength, and relaxation exercises
5. Target different body areas for a well-rounded session

Always prioritize exercises that are safe to do at a desk and don't require equipment.`;

    const userPrompt = `Please recommend 4-5 exercises for a desk workout session.

Current context:
- Time of day: ${timeOfDay}
- User's current streak: ${currentStreak} days
- Recent exercise history: ${exerciseHistory.length > 0 ? exerciseHistory.map(e => `${e.exercise_name} (done ${e.completed_count} times)`).join(", ") : "No recent history - this is a new user!"}

Available exercises:
${availableExercises.map(e => `- ${e.name} (${e.category}, targets: ${e.target_area}, difficulty: ${e.difficulty}, id: ${e.id})`).join("\n")}

Return the exercise IDs you recommend.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_exercises",
              description: "Returns the recommended exercise IDs for the user's session",
              parameters: {
                type: "object",
                properties: {
                  exercise_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "Array of exercise IDs to recommend (4-5 exercises)",
                  },
                  session_theme: {
                    type: "string",
                    description: "A short motivating theme for this session (e.g., 'Energizing Morning Flow')",
                  },
                  tip: {
                    type: "string",
                    description: "A brief wellness tip related to the exercises",
                  },
                },
                required: ["exercise_ids", "session_theme", "tip"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "recommend_exercises" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    // Validate that returned IDs are in available exercises
    const validIds = availableExercises.map(e => e.id);
    const validatedExerciseIds = result.exercise_ids.filter((id: string) => validIds.includes(id));
    
    // If AI returned fewer valid IDs, fill with random exercises
    while (validatedExerciseIds.length < 4) {
      const randomExercise = availableExercises[Math.floor(Math.random() * availableExercises.length)];
      if (!validatedExerciseIds.includes(randomExercise.id)) {
        validatedExerciseIds.push(randomExercise.id);
      }
    }

    return new Response(
      JSON.stringify({
        exercise_ids: validatedExerciseIds.slice(0, 5),
        session_theme: result.session_theme || "Your Daily Desk Workout",
        tip: result.tip || "Remember to breathe deeply and stay hydrated!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating exercises:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
