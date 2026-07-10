import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    // Eleven Labs credentials are app-wide, so all users can access them
    const voiceId = Deno.env.get('ELEVEN_LABS_VOICE_ID');
    const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY');

    console.log('Voice ID from env:', voiceId);
    console.log('API Key present:', !!apiKey);

    if (!voiceId || !apiKey) {
      return Response.json({ error: 'Eleven Labs credentials not configured' }, { status: 400 });
    }

    return Response.json({
      voiceId,
      apiKey
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});