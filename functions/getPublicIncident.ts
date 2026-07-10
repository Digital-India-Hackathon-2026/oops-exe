import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const url = new URL(req.url);
        const incidentId = url.searchParams.get('incidentId');
        
        if (!incidentId) {
            return Response.json({ error: 'Incident ID is required in query parameters' }, { status: 400 });
        }

        const base44 = createClientFromRequest(req);
        
        // Use service role to fetch incident data without authentication
        const incident = await base44.asServiceRole.entities.EmergencyIncident.get(incidentId);
        
        if (!incident) {
            return Response.json({ error: 'Incident not found' }, { status: 404 });
        }

        return Response.json({ incident });
    } catch (error) {
        console.error('Error fetching incident:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});