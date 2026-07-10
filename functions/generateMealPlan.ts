import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get activity data
        const vitals = await base44.entities.HealthMetric.filter(
            { created_by: user.email },
            '-timestamp',
            10
        );

        const steps = vitals.find(v => v.metric_type === 'steps')?.value || 0;
        const calories = vitals.find(v => v.metric_type === 'calories')?.value || 2000;

        // Generate meal plan
        const mealPlan = await base44.integrations.Core.InvokeLLM({
            prompt: `You're a friendly nutritionist. Create a simple, healthy meal plan for today.

User's activity:
- Steps: ${steps}
- Calories consumed: ${calories}

Provide 3 meals (breakfast, lunch, dinner) with:
- Simple, realistic meal suggestions
- Approximate calories
- Why it's good for them
- A fun, encouraging tip

Keep it practical and friendly!`,
            response_json_schema: {
                type: "object",
                properties: {
                    breakfast: {
                        type: "object",
                        properties: {
                            meal: { type: "string" },
                            calories: { type: "number" },
                            benefit: { type: "string" }
                        }
                    },
                    lunch: {
                        type: "object",
                        properties: {
                            meal: { type: "string" },
                            calories: { type: "number" },
                            benefit: { type: "string" }
                        }
                    },
                    dinner: {
                        type: "object",
                        properties: {
                            meal: { type: "string" },
                            calories: { type: "number" },
                            benefit: { type: "string" }
                        }
                    },
                    tip: { type: "string" }
                }
            }
        });

        return Response.json({ 
            success: true, 
            mealPlan,
            message: "Meal plan ready! Follow it to earn points 🍎"
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});