import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get sleep data
        const vitals = await base44.entities.HealthMetric.filter(
            { created_by: user.email },
            '-timestamp',
            10
        );

        const sleepHours = vitals.find(v => v.metric_type === 'sleep')?.value || 'unknown';
        const stressLevel = vitals.find(v => v.metric_type === 'stress_level')?.value || 'unknown';

        // Generate sleep optimization plan
        const plan = await base44.integrations.Core.InvokeLLM({
            prompt: `You're a sleep wellness coach. Create a personalized evening routine to improve sleep quality.

User's current sleep: ${sleepHours} hours
Stress level: ${stressLevel}%

Create a routine with:
1. Wind-down activities (1 hour before bed)
2. Bedroom optimization tips
3. Pre-sleep relaxation technique
4. Morning routine suggestion

Keep it practical, simple, and friendly!`,
            response_json_schema: {
                type: "object",
                properties: {
                    winddown_activities: {
                        type: "array",
                        items: { type: "string" }
                    },
                    bedroom_tips: {
                        type: "array",
                        items: { type: "string" }
                    },
                    relaxation_technique: { type: "string" },
                    morning_routine: { type: "string" },
                    sleep_goal: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            plan,
            message: "Sleep plan ready! Complete it to earn points 🌙"
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});