import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { activity_type, plan_details, planned_duration_minutes } = await req.json();

        // Create activity session
        const session = await base44.entities.UserActivitySession.create({
            activity_type,
            user_id: user.id,
            plan_details,
            start_time: new Date().toISOString(),
            planned_duration_minutes: planned_duration_minutes || 20,
            status: "in_progress"
        });

        return Response.json({ 
            success: true, 
            session,
            message: "Activity started! I'm monitoring your progress... 👀"
        });

    } catch (error) {
        console.error("Error starting activity session:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});