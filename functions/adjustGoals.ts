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
            20
        );

        const avgSteps = vitals.filter(v => v.metric_type === 'steps').reduce((acc, v) => acc + v.value, 0) / Math.max(vitals.filter(v => v.metric_type === 'steps').length, 1) || 5000;
        const avgSleep = vitals.filter(v => v.metric_type === 'sleep').reduce((acc, v) => acc + v.value, 0) / Math.max(vitals.filter(v => v.metric_type === 'sleep').length, 1) || 7;

        // Generate adaptive goals
        const goals = await base44.integrations.Core.InvokeLLM({
            prompt: `You're a smart health coach. Based on user's recent performance, suggest adaptive goals.

Current averages:
- Steps: ${Math.round(avgSteps)} per day
- Sleep: ${avgSleep.toFixed(1)} hours per night

Create 4 realistic, achievable goals for the next week:
1. Steps goal (slightly above current average)
2. Sleep goal (optimal range)
3. Active minutes goal
4. Mindfulness goal

Make goals motivating but attainable. Increase by 10-15% max.`,
            response_json_schema: {
                type: "object",
                properties: {
                    steps_goal: {
                        type: "object",
                        properties: {
                            target: { type: "number" },
                            reason: { type: "string" }
                        }
                    },
                    sleep_goal: {
                        type: "object",
                        properties: {
                            target: { type: "number" },
                            reason: { type: "string" }
                        }
                    },
                    active_minutes_goal: {
                        type: "object",
                        properties: {
                            target: { type: "number" },
                            reason: { type: "string" }
                        }
                    },
                    mindfulness_goal: {
                        type: "object",
                        properties: {
                            target: { type: "number" },
                            reason: { type: "string" }
                        }
                    },
                    motivation: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            goals,
            message: "Goals adjusted! Achieve them to earn points 🚀"
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});