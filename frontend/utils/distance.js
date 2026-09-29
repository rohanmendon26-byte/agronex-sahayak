// Geo-Proximity & Distance Matching Utility for AgroNex Sahayak

export function getCoordinates(loc) {
    if (!loc) return { lat: 13.2210, lng: 74.8020 }; // Default Shirva Center

    if (typeof loc === "object" && loc !== null) {
        if (loc.lat && loc.lng) {
            return { lat: Number(loc.lat), lng: Number(loc.lng) };
        }
    }

    const text = (typeof loc === "string" ? loc : JSON.stringify(loc)).toLowerCase();

    if (text.includes("shirva main") || text.includes("market")) return { lat: 13.2230, lng: 74.8040 };
    if (text.includes("shirva")) return { lat: 13.2210, lng: 74.8020 };
    if (text.includes("katapady")) return { lat: 13.2640, lng: 74.7860 };
    if (text.includes("kaup") || text.includes("kapu")) return { lat: 13.2310, lng: 74.7420 };
    if (text.includes("manipal")) return { lat: 13.3525, lng: 74.7928 };
    if (text.includes("udupi")) return { lat: 13.3409, lng: 74.7421 };
    if (text.includes("moodabidri")) return { lat: 13.0673, lng: 74.9961 };

    // Hash fallback for deterministic realistic distance (0.4 km - 3.2 km)
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (hash << 5) - hash + text.charCodeAt(i);
    const offsetLat = (Math.abs(hash) % 40) / 1000;
    const offsetLng = (Math.abs(hash * 3) % 40) / 1000;
    return { lat: 13.2210 + offsetLat, lng: 74.8020 + offsetLng };
}

export function calculateDistance(loc1, loc2) {
    const coords1 = getCoordinates(loc1);
    const coords2 = getCoordinates(loc2);

    const R = 6371; // Radius of the Earth in km
    const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
    const dLng = ((coords2.lng - coords1.lng) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((coords1.lat * Math.PI) / 180) *
            Math.cos((coords2.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    return Math.max(0.4, Math.round(distanceKm * 10) / 10);
}
