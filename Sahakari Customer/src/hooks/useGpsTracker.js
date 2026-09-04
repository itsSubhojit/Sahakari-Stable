import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * High-definition GPS coordinates for realistic route simulation (Safdarjung & Green Park area, New Delhi)
 * Default route from Worker Hub to Customer Destination
 */
export const DEFAULT_ROUTE_COORDINATES = [
  { lat: 28.5535, lng: 77.2062, instruction: 'Worker departed hub at Hauz Khas', speed: 22, street: 'Aurobindo Marg' },
  { lat: 28.5562, lng: 77.2058, instruction: 'Heading North on Sri Aurobindo Marg', speed: 34, street: 'Aurobindo Marg' },
  { lat: 28.5598, lng: 77.2045, instruction: 'Approaching Green Park Market intersection', speed: 28, street: 'Green Park Main Rd' },
  { lat: 28.5630, lng: 77.2025, instruction: 'Turn left onto Chaudhary Jhandu Singh Marg', speed: 30, street: 'Jhandu Singh Marg' },
  { lat: 28.5655, lng: 77.1995, instruction: 'Merge onto Ring Road Service Lane towards Safdarjung', speed: 38, street: 'Ring Road' },
  { lat: 28.5678, lng: 77.1965, instruction: 'Passing Safdarjung Hospital Flyover', speed: 42, street: 'Ring Road Flyover' },
  { lat: 28.5695, lng: 77.1938, instruction: 'Take slight right into Safdarjung Enclave Block B', speed: 25, street: 'Safdarjung Enclave Rd' },
  { lat: 28.5710, lng: 77.1920, instruction: 'Turn right at B-Block Community Park', speed: 20, street: 'Park Avenue Sector 3' },
  { lat: 28.5722, lng: 77.1908, instruction: 'Entering lane towards 123 Safdarjung Enclave', speed: 15, street: 'Residential Lane 4' },
  { lat: 28.5731, lng: 77.1899, instruction: 'Arriving at customer destination (123 Safdarjung Enclave)', speed: 0, street: 'Destination' },
];

export const DEFAULT_CUSTOMER_LOCATION = {
  lat: 28.5731,
  lng: 77.1899,
  address: '123 Safdarjung Enclave, New Delhi',
  label: 'Your Home',
};

export const DEFAULT_WORKER_INITIAL_LOCATION = {
  lat: 28.5535,
  lng: 77.2062,
  address: 'Hauz Khas Service Hub, New Delhi',
};

// Calculate Haversine distance in meters
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate Bearing/Heading angle in degrees (0 = North, 90 = East, 180 = South, 270 = West)
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return bearing;
};
export function useGpsTracker(customWaypoints = null, customCustomerLocation = null) {
  const [dynamicWaypoints, setDynamicWaypoints] = useState(null);
  const waypoints = customWaypoints || dynamicWaypoints || DEFAULT_ROUTE_COORDINATES;
  const customerLoc = customCustomerLocation || DEFAULT_CUSTOMER_LOCATION;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 1 interpolation between currentIndex and currentIndex + 1
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 4x
  const [isUsingRealGps, setIsUsingRealGps] = useState(false);
  const [realGpsLocation, setRealGpsLocation] = useState(null);
  const [realGpsError, setRealGpsError] = useState(null);

  // Worker live coordinates
  const [workerPosition, setWorkerPosition] = useState({
    lat: waypoints[0]?.lat || 0,
    lng: waypoints[0]?.lng || 0,
    heading: 0,
    speed: waypoints[0]?.speed || 0,
    altitude: 215, // meters
    accuracy: 3, // meters
    battery: 88,
  });

  // Telemetry metrics
  const [distanceRemainingMeters, setDistanceRemainingMeters] = useState(2400);
  const [etaSeconds, setEtaSeconds] = useState(480);
  const [currentInstruction, setCurrentInstruction] = useState(waypoints[0]?.instruction || '');
  const [nextInstruction, setNextInstruction] = useState(waypoints[1]?.instruction || '');
  const [journeyStatus, setJourneyStatus] = useState('ON_THE_WAY'); // 'ON_THE_WAY', 'NEARBY', 'ARRIVED'

  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  const generateDynamicWaypoints = useCallback((destination) => {
    const points = [];
    const steps = 10;
    // Worker starts roughly 3km away
    const startLat = destination.lat - 0.02;
    const startLng = destination.lng - 0.015;
    
    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      points.push({
        lat: startLat + (destination.lat - startLat) * p,
        lng: startLng + (destination.lng - startLng) * p,
        instruction: i === 0 ? 'Worker departed hub' : (i === steps ? 'Arriving at your location' : 'En route to destination'),
        speed: 20 + Math.random() * 20,
        street: 'Service Route'
      });
    }
    return points;
  }, []);

  const requestRealGps = useCallback(() => {
    if (!navigator.geolocation) {
      setRealGpsError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const actualLoc = {
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          address: 'Current Live GPS Location',
          label: 'Your Live Position',
        };
        setRealGpsLocation(actualLoc);
        setIsUsingRealGps(true);
        setRealGpsError(null);
        
        // Snap the route to the new location
        const newWaypoints = generateDynamicWaypoints(actualLoc);
        setDynamicWaypoints(newWaypoints);
        setCurrentIndex(0);
        setProgress(0);
        setIsPlaying(true);
        setWorkerPosition(prev => ({ ...prev, lat: newWaypoints[0].lat, lng: newWaypoints[0].lng }));
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setRealGpsError(err.message || 'Location access denied');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [generateDynamicWaypoints]);

  // Automatically request real GPS location on mount
  useEffect(() => {
    requestRealGps();
  }, [requestRealGps]);

  // Main simulation loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 50; // update 20 times per sec for smooth movement
    const stepIncrement = 0.006 * simSpeed;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        let newProgress = prevProgress + stepIncrement;

        if (newProgress >= 1) {
          setCurrentIndex((prevIdx) => {
            if (prevIdx >= waypoints.length - 2) {
              // Reached final waypoint
              setIsPlaying(false);
              setJourneyStatus('ARRIVED');
              setDistanceRemainingMeters(0);
              setEtaSeconds(0);
              setCurrentInstruction('Worker has arrived at your location! Please share the 4-digit OTP.');
              setNextInstruction('Provide OTP: 4829');
              return waypoints.length - 1;
            }
            return prevIdx + 1;
          });
          return 0;
        }

        return newProgress;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, simSpeed, waypoints.length]);

  // Compute interpolated live coordinates and telemetry
  useEffect(() => {
    if (currentIndex >= waypoints.length - 1) {
      const finalPoint = waypoints[waypoints.length - 1];
      setWorkerPosition((prev) => ({
        ...prev,
        lat: finalPoint.lat,
        lng: finalPoint.lng,
        speed: 0,
        battery: 82,
      }));
      setDistanceRemainingMeters(0);
      setEtaSeconds(0);
      setJourneyStatus('ARRIVED');
      return;
    }

    const p1 = waypoints[currentIndex];
    const p2 = waypoints[currentIndex + 1];

    if (!p1 || !p2) return;

    // Linear interpolation of lat/lng
    const lat = p1.lat + (p2.lat - p1.lat) * progress;
    const lng = p1.lng + (p2.lng - p1.lng) * progress;
    const heading = calculateBearing(p1.lat, p1.lng, p2.lat, p2.lng);

    // Calculate total remaining distance from current position to end
    let totalRemaining = calculateDistanceMeters(lat, lng, p2.lat, p2.lng);
    for (let i = currentIndex + 1; i < waypoints.length - 1; i++) {
      totalRemaining += calculateDistanceMeters(
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng
      );
    }

    // Realistic fluctuating speed
    const currentSpeedKmh = Math.max(12, Math.round(p1.speed + (p2.speed - p1.speed) * progress + (Math.sin(progress * 10) * 3)));
    const avgSpeedMs = Math.max(currentSpeedKmh * (1000 / 3600), 5);
    const calculatedEta = Math.round(totalRemaining / avgSpeedMs);

    setDistanceRemainingMeters(Math.round(totalRemaining));
    setEtaSeconds(calculatedEta);

    // Status changes
    if (totalRemaining <= 150) {
      setJourneyStatus('ARRIVED');
    } else if (totalRemaining <= 600) {
      setJourneyStatus('NEARBY');
    } else {
      setJourneyStatus('ON_THE_WAY');
    }

    setCurrentInstruction(p1.instruction || 'Proceed along designated route');
    setNextInstruction(p2.instruction || 'Arriving at destination');

    setWorkerPosition({
      lat,
      lng,
      heading: Math.round(heading),
      speed: currentSpeedKmh,
      altitude: Math.round(214 + Math.sin(progress * 4) * 5),
      accuracy: 3,
      battery: Math.max(70, Math.round(88 - (currentIndex * 1.2))),
    });
  }, [currentIndex, progress, waypoints]);

  // Traversed path so far + full route path
  const fullPathCoordinates = waypoints.map((w) => [w.lat, w.lng]);
  const traversedPathCoordinates = [
    ...waypoints.slice(0, currentIndex + 1).map((w) => [w.lat, w.lng]),
    [workerPosition.lat, workerPosition.lng],
  ];
  const remainingPathCoordinates = [
    [workerPosition.lat, workerPosition.lng],
    ...waypoints.slice(currentIndex + 1).map((w) => [w.lat, w.lng]),
  ];

  const togglePlay = () => setIsPlaying((prev) => !prev);
  
  const resetSimulation = () => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPlaying(true);
    setJourneyStatus('ON_THE_WAY');
  };

  const jumpToDestination = () => {
    setCurrentIndex(waypoints.length - 1);
    setProgress(0);
    setIsPlaying(false);
  };

  return {
    workerPosition,
    customerLocation: isUsingRealGps && realGpsLocation ? realGpsLocation : customerLoc,
    distanceRemainingMeters,
    etaSeconds,
    currentInstruction,
    nextInstruction,
    journeyStatus,
    isPlaying,
    simSpeed,
    setSimSpeed,
    togglePlay,
    resetSimulation,
    jumpToDestination,
    fullPathCoordinates,
    traversedPathCoordinates,
    remainingPathCoordinates,
    waypoints,
    currentIndex,
    requestRealGps,
    isUsingRealGps,
    realGpsError,
  };
}
