import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { session_id } = await req.json();

        // Get the session
        const session = await base44.entities.UserActivitySession.get(session_id);
        
        if (!session || session.user_id !== user.id) {
            return Response.json({ error: 'Session not found' }, { status: 404 });
        }

        const endTime = new Date();
        const startTime = new Date(session.start_time);
        const durationMinutes = Math.floor((endTime - startTime) / 60000);

        // Get health metrics during the activity period
        const metrics = await base44.entities.HealthMetric.filter({
            created_by: user.email
        }, '-timestamp', 50);

        const relevantMetrics = metrics.filter(m => {
            const metricTime = new Date(m.timestamp);
            return metricTime >= startTime && metricTime <= endTime;
        });

        // Analyze metrics based on activity type
        let verification = await analyzeActivity(session.activity_type, relevantMetrics, durationMinutes, base44);

        // Award points based on verification
        let points = 0;
        let achievement = null;

        if (verification.verified) {
            const pointsMap = {
                workout: 15,
                meditation: 10,
                meal_plan: 12,
                sleep: 10,
                goals: 15
            };
            
            points = pointsMap[session.activity_type] || 10;

            const achievementTitles = {
                workout: "Workout Completed! 💪",
                meditation: "Mindful Session Complete 🧘",
                meal_plan: "Nutrition Goal Achieved 🥗",
                sleep: "Rest Champion 😴",
                goals: "Goal Setter 🎯"
            };

            achievement = await base44.entities.Achievement.create({
                title: achievementTitles[session.activity_type],
                description: verification.feedback,
                points: points,
                category: session.activity_type === 'workout' || session.activity_type === 'meditation' ? 'exercise' : 
                         session.activity_type === 'meal_plan' ? 'nutrition' : 
                         session.activity_type === 'sleep' ? 'sleep' : 'milestone',
                rarity: "common",
                badge_icon: "trophy",
                unlocked_at: new Date().toISOString()
            });
        }

        // Update session
        await base44.entities.UserActivitySession.update(session_id, {
            end_time: endTime.toISOString(),
            status: verification.verified ? "verified" : "completed",
            verification_feedback: verification.feedback,
            metrics_observed: verification.metrics_summary,
            points_awarded: points,
            achievement_id: achievement?.id
        });

        return Response.json({ 
            success: true,
            verified: verification.verified,
            feedback: verification.feedback,
            points_earned: points,
            duration_minutes: durationMinutes,
            metrics_observed: verification.metrics_summary
        });

    } catch (error) {
        console.error("Error completing activity session:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function analyzeActivity(activityType, metrics, durationMinutes, base44) {
    // Organize metrics by type
    const heartRateMetrics = metrics.filter(m => m.metric_type === 'heart_rate');
    const stepsMetrics = metrics.filter(m => m.metric_type === 'steps');
    const bloodPressureMetrics = metrics.filter(m => m.metric_type === 'blood_pressure');
    
    let verified = false;
    let feedback = "";
    let metricsSummary = {};

    if (activityType === 'workout') {
        // Check for elevated heart rate and increased steps
        const avgHeartRate = heartRateMetrics.length > 0 
            ? heartRateMetrics.reduce((sum, m) => sum + m.value, 0) / heartRateMetrics.length 
            : 0;
        
        const totalSteps = stepsMetrics.length > 0 
            ? Math.max(...stepsMetrics.map(m => m.value)) 
            : 0;

        metricsSummary = {
            avg_heart_rate: Math.round(avgHeartRate),
            steps_detected: totalSteps,
            duration_minutes: durationMinutes
        };

        // Verification: Heart rate elevated (>90 bpm) OR significant steps OR duration completed
        if (avgHeartRate > 90 || totalSteps > 100 || durationMinutes >= 15) {
            verified = true;
            feedback = `Great workout! I observed your heart rate at ${Math.round(avgHeartRate)} bpm`;
            if (totalSteps > 100) feedback += ` and tracked ${totalSteps} steps`;
            if (bloodPressureMetrics.length > 0) {
                feedback += `. Your vitals show you were actively exercising! 💪`;
            } else {
                feedback += `. Keep pushing! 🔥`;
            }
        } else {
            feedback = `Activity recorded for ${durationMinutes} minutes. I didn't detect significant changes in your vitals. Try again! 💪`;
        }

    } else if (activityType === 'meditation') {
        // Check for stable/lowered heart rate
        const avgHeartRate = heartRateMetrics.length > 0 
            ? heartRateMetrics.reduce((sum, m) => sum + m.value, 0) / heartRateMetrics.length 
            : 0;

        metricsSummary = {
            avg_heart_rate: Math.round(avgHeartRate),
            duration_minutes: durationMinutes
        };

        // Verification: Heart rate stable (60-80) OR duration completed
        if ((avgHeartRate >= 60 && avgHeartRate <= 80) || durationMinutes >= 8) {
            verified = true;
            feedback = `Wonderful meditation! I observed a calm heart rate of ${Math.round(avgHeartRate)} bpm. Your body is relaxed 🧘`;
        } else if (avgHeartRate > 0) {
            feedback = `Session completed. Your heart rate was ${Math.round(avgHeartRate)} bpm. Try deeper relaxation next time 🌸`;
            verified = durationMinutes >= 5; // Still give points if they spent time
        } else {
            feedback = `Meditation session recorded for ${durationMinutes} minutes 🌸`;
            verified = durationMinutes >= 5;
        }

    } else {
        // For meal_plan, sleep, and goals - verify by duration or simple completion
        metricsSummary = { duration_minutes: durationMinutes };
        verified = true;
        feedback = `Activity completed! Well done on staying committed to your health journey! 🌟`;
    }

    return { verified, feedback, metrics_summary: metricsSummary };
}