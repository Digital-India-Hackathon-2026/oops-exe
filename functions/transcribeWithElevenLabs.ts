import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = Deno.env.get("ELEVEN_LABS_API_KEY");
        if (!apiKey) {
            return Response.json({ error: 'Eleven Labs API key not configured' }, { status: 500 });
        }

        const formData = await req.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
            return Response.json({ error: 'No audio file provided' }, { status: 400 });
        }

        console.log('Audio file received, size:', audioFile.size);

        // Send audio to Eleven Labs Speech-to-Text
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append('audio', audioFile);

        console.log('Sending to Eleven Labs STT API...');
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
            },
            body: elevenLabsFormData
        });

        console.log('Eleven Labs STT response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Eleven Labs STT error:', response.status, errorText);
            // Return empty text instead of error to avoid breaking the flow
            return Response.json({ text: '' });
        }

        const result = await response.json();
        console.log('Transcription successful:', result);
        return Response.json({ text: result.text || '' });

    } catch (error) {
        console.error('Transcription error:', error);
        // Return empty text instead of error to avoid breaking the flow
        return Response.json({ text: '' });
    }
});