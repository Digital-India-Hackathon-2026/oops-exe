import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get recent vitals
        const vitals = await base44.entities.HealthMetric.filter(
            { created_by: user.email },
            '-timestamp',
            10
        );

        const heartRate = vitals.find(v => v.metric_type === 'heart_rate')?.value || 'unknown';
        const steps = vitals.find(v => v.metric_type === 'steps')?.value || 'unknown';
        const sleep = vitals.find(v => v.metric_type === 'sleep')?.value || 'unknown';

        // Generate AI-powered workout plan
        const plan = await base44.integrations.Core.InvokeLLM({
            prompt: `You're a friendly fitness coach. Create a personalized 20-minute workout plan for today.

User's recent data:
- Heart rate: ${heartRate} bpm
- Steps today: ${steps}
- Sleep last night: ${sleep} hours

Generate a workout plan with:
1. A warm-up (3-5 min)
2. Main exercises (12-15 min) - 3-4 exercises with reps/duration
3. Cool down (2-3 min)

Keep it simple, achievable, and encouraging. Use casual, friendly language. Format as a structured plan.`,
            response_json_schema: {
                type: "object",
                properties: {
                    warmup: { type: "string" },
                    exercises: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                name: { type: "string" },
                                duration: { type: "string" },
                                description: { type: "string" }
                            }
                        }
                    },
                    cooldown: { type: "string" },
                    motivation: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            plan,
            message: "Workout plan ready! Start when you're ready to earn points! 💪"
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});