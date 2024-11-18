let map;
let userMarker;
const dangerZones = [
    { lat: 40.7128, lng: -74.0060, radius: 1000 }, // New York City
    { lat: 19.02561401268015, lng: 72.84165777089925, radius: 150 }, // Home
    { lat: 19.1073017,lng: 72.83747696904763, radius: 25 }, // College
    // Add more danger zones as needed
];

function initMap() {
    map = L.map('map').setView([0, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create user marker
    userMarker = L.marker([0, 0]).addTo(map);

    // Draw danger zones
    dangerZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.3,
            radius: zone.radius
        }).addTo(map);
    });

    // Start tracking user's location
    trackLocation();
}

function trackLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(updateLocation, handleLocationError, {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 27000
        });
    } else {
        handleLocationError();
    }
}

function updateLocation(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    // Update user marker position
    userMarker.setLatLng([userLat, userLng]);
    map.setView([userLat, userLng], 13);

    // Check if user is in a danger zone
    const inDangerZone = dangerZones.some(zone => {
        const distance = map.distance([userLat, userLng], [zone.lat, zone.lng]);
        return distance <= zone.radius;
    });

    const statusElement = document.getElementById('status');
    if (inDangerZone) {
        statusElement.textContent = 'WARNING: You are in a dangerous zone!';
        statusElement.className = 'danger';
    } else {
        statusElement.textContent = 'You are in a safe area.';
        statusElement.className = 'safe';
    }
}

function handleLocationError(error) {
    let message;
    if (error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                message = "The request to get user location timed out.";
                break;
            default:
                message = "An unknown error occurred.";
                break;
        }
    } else {
        message = "Geolocation is not supported by this browser.";
    }
    document.getElementById('status').textContent = message;
}

// Initialize the map when the page loads
window.onload = initMap;