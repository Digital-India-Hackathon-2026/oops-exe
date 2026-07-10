import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get stress level
        const vitals = await base44.entities.HealthMetric.filter(
            { created_by: user.email },
            '-timestamp',
            10
        );

        const stressLevel = vitals.find(v => v.metric_type === 'stress_level')?.value || 'unknown';

        // Generate AI meditation session
        const session = await base44.integrations.Core.InvokeLLM({
            prompt: `You're a calming meditation guide. Create a 10-minute guided meditation session.

User's stress level: ${stressLevel}%

Structure:
1. Opening (1 min) - settling in
2. Breathing technique (3 min)
3. Body scan or visualization (4 min)
4. Closing (2 min)

Use soothing, peaceful language. Keep it simple and accessible.`,
            response_json_schema: {
                type: "object",
                properties: {
                    opening: { type: "string" },
                    breathing: { type: "string" },
                    main_practice: { type: "string" },
                    closing: { type: "string" },
                    affirmation: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            session,
            message: "Meditation session ready! Begin to earn points 🧘"
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});