import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only seed data if user is in demo mode
    if (!user.demo_mode) {
      return Response.json({ message: 'User not in demo mode' });
    }

    // Check if demo data already exists
    const existingMetrics = await base44.asServiceRole.entities.HealthMetric.filter({
      created_by: user.email
    });

    if (existingMetrics.length > 0) {
      return Response.json({ message: 'Demo data already seeded' });
    }

    // Create realistic health metrics
    const now = new Date();
    const metricsToCreate = [
      { metric_type: 'heart_rate', value: 72, unit: 'bpm', timestamp: new Date(now - 5 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'spo2', value: 98, unit: '%', timestamp: new Date(now - 5 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'temperature', value: 98.2, unit: '°F', timestamp: new Date(now - 10 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'steps', value: 8432, unit: 'steps', timestamp: new Date(now - 1 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'sleep', value: 7.5, unit: 'hours', timestamp: new Date(now - 24 * 60 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'calories', value: 2150, unit: 'kcal', timestamp: new Date(now - 1 * 60000).toISOString(), source: 'demo' },
      { metric_type: 'weight', value: 172, unit: 'lbs', timestamp: new Date(now - 24 * 60 * 60000).toISOString(), source: 'demo' },
    ];

    await base44.asServiceRole.entities.HealthMetric.bulkCreate(metricsToCreate);

    // Create demo achievements
    const achievementsToCreate = [
      { title: '7-Day Streak', description: 'Logged vitals for 7 consecutive days', points: 50, badge_icon: 'flame', category: 'consistency', rarity: 'rare' },
      { title: 'Step Master', description: 'Reached 10,000 steps in a day', points: 30, badge_icon: 'footprints', category: 'exercise', rarity: 'common' },
      { title: 'Sleep Champion', description: 'Achieved 8 hours of sleep', points: 25, badge_icon: 'moon', category: 'sleep', rarity: 'common' },
    ];

    await base44.asServiceRole.entities.Achievement.bulkCreate(achievementsToCreate);

    // Create demo challenges
    const challengesToCreate = [
      {
        title: 'Daily Steps Challenge',
        description: 'Walk 10,000 steps every day',
        challenge_type: 'steps',
        target_value: 10000,
        current_value: 8432,
        duration_days: 7,
        points_reward: 100,
        status: 'active',
        start_date: new Date(now - 2 * 24 * 60 * 60000).toISOString().split('T')[0],
        end_date: new Date(now + 5 * 24 * 60 * 60000).toISOString().split('T')[0],
        participants: [user.id]
      }
    ];

    await base44.asServiceRole.entities.Challenge.bulkCreate(challengesToCreate);

    return Response.json({ 
      message: 'Demo data seeded successfully',
      metrics: metricsToCreate.length,
      achievements: achievementsToCreate.length,
      challenges: challengesToCreate.length
    });

  } catch (error) {
    console.error('Error seeding demo data:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});