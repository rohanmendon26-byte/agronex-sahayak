// High-precision geolocation and reverse geocoding utility for AgroNex Sahayak

export async function reverseGeocode(lat, lng) {
  const numericLat = Number(lat);
  const numericLng = Number(lng);

  if (isNaN(numericLat) || isNaN(numericLng)) {
    return {
      lat: 13.2210,
      lng: 74.8020,
      locality: "Shirva",
      city: "Udupi",
      state: "Karnataka",
      displayName: "Shirva, Udupi"
    };
  }

  // 1. Try BigDataCloud Client Reverse Geocode (free, high precision, CORS-enabled)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numericLat}&longitude=${numericLng}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const rawLocality = data.locality || data.city || "";
      const adminDistrict =
        data.localityInfo?.administrative?.find(
          (a) => a.description?.toLowerCase().includes("district") || a.adminLevel === 5
        )?.name?.replace(/\s+district/i, "") ||
        data.city ||
        "";
      const state = data.principalSubdivision || "";

      const locality = rawLocality || adminDistrict || "Local Area";
      const parts = [rawLocality, adminDistrict, state]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

      const displayName = parts.length > 0 ? parts.join(", ") : `${numericLat.toFixed(4)}°N, ${numericLng.toFixed(4)}°E`;

      return {
        lat: numericLat,
        lng: numericLng,
        locality,
        city: adminDistrict || locality,
        state,
        displayName
      };
    }
  } catch (err) {
    // Continue to next fallback
  }

  // 2. Try OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numericLat}&lon=${numericLng}&zoom=16&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" }
      }
    );
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const locality =
        addr.village || addr.suburb || addr.neighbourhood || addr.town || addr.city || "Local Area";
      const district = addr.county || addr.state_district || addr.city || "";
      const state = addr.state || "";

      const parts = [locality, district, state]
        .filter(Boolean)
        .filter((v, i, a) => a.indexOf(v) === i);

      const displayName = parts.length > 0 ? parts.join(", ") : `${numericLat.toFixed(4)}°N, ${numericLng.toFixed(4)}°E`;

      return {
        lat: numericLat,
        lng: numericLng,
        locality,
        city: district || locality,
        state,
        displayName
      };
    }
  } catch (err) {
    // Continue to fallback
  }

  // 3. Fallback when network geocoding is unreachable
  return {
    lat: numericLat,
    lng: numericLng,
    locality: `Locality (${numericLat.toFixed(3)}°N, ${numericLng.toFixed(3)}°E)`,
    city: "Local Region",
    state: "",
    displayName: `GPS (${numericLat.toFixed(4)}°N, ${numericLng.toFixed(4)}°E)`
  };
}

export function getCurrentPositionAsync() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    // Tier 1: Try high accuracy first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        // If explicitly denied, fail immediately
        if (err.code === 1) {
          reject(new Error("Location permission denied. Please allow location access in your browser."));
          return;
        }

        // Tier 2: Fall back to low accuracy (Wi-Fi / cellular triangulation)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy
            });
          },
          (err2) => {
            if (err2.code === 1) {
              reject(new Error("Location access denied. Please enable location permissions."));
            } else if (err2.code === 2) {
              reject(new Error("Location unavailable. Please check device GPS or network."));
            } else if (err2.code === 3) {
              reject(new Error("Location timed out. Please click Autofill GPS to retry."));
            } else {
              reject(new Error("Failed to detect current location."));
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000
      }
    );
  });
}

export async function getUserLocation() {
  const coords = await getCurrentPositionAsync();
  const geoData = await reverseGeocode(coords.lat, coords.lng);
  return {
    ...geoData,
    accuracy: coords.accuracy
  };
}
