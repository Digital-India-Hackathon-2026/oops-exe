import React, { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertTriangle, User, Clock, CheckCircle, Mic, Hourglass, MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Fix for default Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: 'user-marker'
});

// Component to auto-follow location
function MapFollower({ position, shouldFollow }) {
  const map = useMap();
  
  useEffect(() => {
    if (position && shouldFollow) {
      map.flyTo(position, 17, { animate: true, duration: 1 });
    }
  }, [position, shouldFollow, map]);
  
  return null;
}

export default function LiveIncidentMap() {
  const [incidentId, setIncidentId] = useState(null);
  const [followUser, setFollowUser] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIncidentId(params.get('incidentId'));
  }, []);

  const { data: incidentData, isLoading, error } = useQuery({
    queryKey: ['publicIncident', incidentId],
    queryFn: async () => {
      const url = `/api/functions/getPublicIncident?incidentId=${incidentId}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.incident;
    },
    enabled: !!incidentId,
    refetchInterval: 1500, // Refetch every 1.5 seconds for more real-time updates
  });

  const incident = incidentData;

  useEffect(() => {
    if (incident?.last_known_location) {
      setLastUpdateTime(new Date(incident.last_known_location.timestamp));
    }
  }, [incident?.last_known_location]);
  
  const openInGoogleMaps = () => {
    if (incident?.last_known_location) {
      window.open(`https://www.google.com/maps?q=${incident.last_known_location.lat},${incident.last_known_location.lng}`, '_blank');
    }
  };
  
  if (isLoading && !incident) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading Live Map...</div>;
  }

  if (error || !incidentId) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Error loading incident data or incident not found.</div>;
  }

  if (!incident) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white text-center p-4">
            <AlertTriangle className="w-16 h-16 text-amber-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Waiting for Incident Data...</h2>
            <p className="text-slate-400">The live map will appear here once the incident has started and data is received.</p>
        </div>
      )
  }
  
  const position = incident.last_known_location ? [incident.last_known_location.lat, incident.last_known_location.lng] : null;
  const path = incident.location_history?.map(p => [p.lat, p.lng]) || [];

  return (
    <div className="h-full min-h-screen w-full flex flex-col bg-slate-900 text-white overflow-hidden">
        <style>{`
          .user-marker { filter: drop-shadow(0 0 8px #f87171); animation: pulse 2s infinite; }
          @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
          .leaflet-container { width: 100% !important; height: 100% !important; }
        `}</style>
      <header className="p-3 md:p-4 bg-slate-800 border-b border-slate-700 z-10 flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
          </motion.div>
          <h1 className="text-base md:text-xl font-bold">Live Emergency Report</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {incident.status === 'active' && (
            <Button size="sm" onClick={openInGoogleMaps} className="bg-blue-600 hover:bg-blue-700 text-xs md:text-sm px-2 md:px-3">
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> 
              <span className="hidden sm:inline">Open in </span>Google Maps
            </Button>
          )}
          {incident.status === 'active' ? (
            <Badge className="bg-red-500/80 animate-pulse flex items-center gap-1 md:gap-2 text-xs">
              <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
              LIVE
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-green-600 text-white text-xs">Ended Safely</Badge>
          )}
        </div>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative min-h-[300px] md:min-h-[400px] lg:min-h-0">
           <MapContainer center={position || [51.505, -0.09]} zoom={17} scrollWheelZoom={true} className="absolute inset-0">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapFollower position={position} shouldFollow={followUser && incident.status === 'active'} />
            {position && (
              <Marker position={position} icon={userIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>{incident.user_name}</strong><br />
                    <span className="text-xs">Last update: {new Date(incident.last_known_location.timestamp).toLocaleTimeString()}</span><br />
                    <span className="text-xs">Accuracy: {incident.last_known_location.accuracy?.toFixed(0) || 'N/A'}m</span>
                  </div>
                </Popup>
              </Marker>
            )}
            {path.length > 1 && <Polyline pathOptions={{ color: '#f87171', weight: 4, opacity: 0.8, dashArray: '10, 10' }} positions={path} />}
          </MapContainer>
          
          {/* Map Controls Overlay */}
          {incident.status === 'active' && (
            <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
              <Button 
                size="sm" 
                onClick={() => setFollowUser(!followUser)}
                className={followUser ? "bg-green-600 hover:bg-green-700" : "bg-slate-600 hover:bg-slate-700"}
              >
                <Navigation className="w-4 h-4 mr-2" />
                {followUser ? "Following" : "Follow User"}
              </Button>
            </div>
          )}
        </div>
        
        <div className="w-full lg:w-80 xl:w-96 bg-slate-800 p-3 md:p-4 overflow-y-auto border-t lg:border-t-0 lg:border-l border-slate-700 space-y-3 md:space-y-4 shrink-0 max-h-[50vh] lg:max-h-none">
            <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-base md:text-lg text-slate-200">Incident Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs md:text-sm p-3 md:p-4 pt-0">
                   <div className="flex items-center gap-2 md:gap-3">
                       <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                       <span className="text-slate-300 truncate">User: <strong className="text-white">{incident.user_name}</strong></span>
                   </div>
                   <div className="flex items-center gap-2 md:gap-3">
                       <Clock className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0" />
                       <span className="text-slate-300 truncate">Started: <strong className="text-white">{new Date(incident.start_time).toLocaleString()}</strong></span>
                   </div>
                   {incident.status === "ended" && incident.end_time && (
                      <div className="flex items-center gap-2 md:gap-3 text-green-400">
                         <CheckCircle className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                         <span className="text-slate-300 truncate">Ended: <strong className="text-white">{new Date(incident.end_time).toLocaleString()}</strong></span>
                       </div>
                   )}
                </CardContent>
            </Card>
            
            {/* Live Location Card */}
            {incident.status === 'active' && incident.last_known_location && (
              <Card className="bg-slate-900 border-red-500/50">
                <CardHeader className="pb-2 p-3 md:p-4">
                    <CardTitle className="text-base md:text-lg text-red-400 flex items-center gap-2">
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                          <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                        </motion.div>
                        Live Location
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs md:text-sm p-3 md:p-4 pt-0">
                   <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-800 p-2 rounded">
                       <p className="text-xs text-slate-400">Latitude</p>
                       <p className="font-mono text-white text-xs md:text-sm truncate">{incident.last_known_location.lat.toFixed(6)}</p>
                     </div>
                     <div className="bg-slate-800 p-2 rounded">
                       <p className="text-xs text-slate-400">Longitude</p>
                       <p className="font-mono text-white text-xs md:text-sm truncate">{incident.last_known_location.lng.toFixed(6)}</p>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-800 p-2 rounded">
                       <p className="text-xs text-slate-400">Accuracy</p>
                       <p className="text-white">{incident.last_known_location.accuracy?.toFixed(0) || 'N/A'}m</p>
                     </div>
                     <div className="bg-slate-800 p-2 rounded">
                       <p className="text-xs text-slate-400">Last Update</p>
                       <p className="text-white">{lastUpdateTime ? lastUpdateTime.toLocaleTimeString() : 'N/A'}</p>
                     </div>
                   </div>
                   <Button onClick={openInGoogleMaps} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-xs md:text-sm">
                     <ExternalLink className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Open in Google Maps
                   </Button>
                </CardContent>
              </Card>
            )}

            <Card className="bg-slate-900 border-slate-700">
                <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-base md:text-lg text-slate-200 flex items-center gap-2">
                        <Mic className="w-4 h-4 md:w-5 md:h-5 text-cyan-400" /> Audio Report
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0">
                    {incident.status === 'active' && (
                        <div className="flex flex-col items-center justify-center text-center p-3 md:p-4 bg-slate-800/50 rounded-lg">
                            <Hourglass className="w-6 h-6 md:w-8 md:h-8 text-cyan-400 mb-2 animate-spin" />
                            <p className="font-semibold text-cyan-300 text-sm md:text-base">Recording in Progress</p>
                            <p className="text-xs text-slate-400 mt-1">Audio available after emergency ends.</p>
                        </div>
                    )}
                    {incident.status === 'ended' && incident.audio_report_url && (
                        <div>
                            <audio controls src={incident.audio_report_url} className="w-full h-10">
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                   )}
                   {incident.status === 'ended' && !incident.audio_report_url && (
                        <div className="p-3 md:p-4 text-center bg-slate-800/50 rounded-lg">
                             <p className="text-xs md:text-sm text-slate-400">No audio report was saved for this incident.</p>
                        </div>
                   )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}