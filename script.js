let map;
let userMarker;
const dangerZones = [
    { lat: 40.7128, lng: -74.0060, radius: 1000, reason: "High crime rate area" }, // New York City
    { lat: 19.02561401268015, lng: 72.84165777089925, radius: 150, reason: "Restricted residential area" }, // Home
    { lat: 19.1073017, lng: 72.83747696904763, radius: 25, reason: "No entry zone " }, // College
];

const policeStations = [
    { name: "JUHU POLICE STATION", phone: "26184432, 26183856, 8976951982", lat: 19.1075, lng: 72.8263 },
    { name: "DN Nagar Police station", phone: "26304002, 26303893, 8976951983", lat: 19.1269, lng: 72.8253 },
    { name: "Versova Police station", phone: "26304812, 8976952040", lat: 19.1308, lng: 72.8181 }
];

const hospitals = [
    { name: "Gr8 Smile Dental Clinic", phone: "+91 22 2684 2451", lat: 19.1096, lng: 72.8259 },
    { name: "Nanavati Hospital", phone: "022 2626 7500", lat: 19.1047, lng: 72.8385 },
    { name: "Orbit Eye Hospital", phone: "022 2677 1188", lat: 19.1153, lng: 72.8341 },
    { name: "Shivam Nursing Home", phone: "022 2657 1386", lat: 19.1189, lng: 72.8470 },
    { name: "Bharatiya Arogya Nidhi Sheth Kantilal C. Parikh General Hospital", phone: "022 2620 6021", lat: 19.1058, lng: 72.8331 },
    { name: "Umang Maternity and Surgical Nursing Home", phone: "+91 22 2820 3041", lat: 19.1242, lng: 72.8449 },
    { name: "Dr. R. N. Cooper Medical College and General Hospital", phone: "022 2620 7254", lat: 19.1075, lng: 72.8400 }
];

function initMap() {
    map = L.map('map').setView([19.0760, 72.8777], 11); // Mumbai coordinates

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create user marker
    userMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'user-marker',
            html: '<div class="pulse"></div>',
            iconSize: [20, 20]
        })
    }).addTo(map);

    // Draw danger zones
    dangerZones.forEach(zone => {
        L.circle([zone.lat, zone.lng], {
            color: '#e74c3c',
            fillColor: '#e74c3c',
            fillOpacity: 0.3,
            radius: zone.radius
        }).bindPopup(zone.reason).addTo(map);
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
    map.setView([userLat, userLng], 15);

    // Check if user is in a danger zone
    const dangerZone = dangerZones.find(zone => {
        const distance = map.distance([userLat, userLng], [zone.lat, zone.lng]);
        return distance <= zone.radius;
    });

    const statusElement = document.getElementById('status');
    if (dangerZone) {
        statusElement.textContent = `WARNING: You are in a dangerous zone! Reason: ${dangerZone.reason} Call +1 (325) 252-2927`;
        statusElement.className = 'danger';
    } else {
        statusElement.textContent = 'You are in a safe area.';
        statusElement.className = 'safe';
    }

    // Find nearby hospitals and police stations
    findNearbyServices(userLat, userLng);
}

function findNearbyServices(lat, lng) {
    const hospitalIcon = L.divIcon({
        html: '<i class="fas fa-hospital" style="color: #3498db;"></i>',
        iconSize: [20, 20],
        className: 'hospital-icon'
    });

    const policeIcon = L.divIcon({
        html: '<i class="fas fa-shield-alt" style="color: #2ecc71;"></i>',
        iconSize: [20, 20],
        className: 'police-icon'
    });

    // Add markers for hospitals in our list
    hospitals.forEach(hospital => {
        const popupContent = `
            <strong>${hospital.name}</strong><br>
            Phone: <a href="tel:${hospital.phone}" onclick="openPhoneApp('${hospital.phone}'); return false;">${hospital.phone}</a>
        `;
        L.marker([hospital.lat, hospital.lng], {icon: hospitalIcon})
            .bindPopup(popupContent)
            .addTo(map);
    });

    // Find police stations
    const policeQuery = `
        [out:json];
        (
          node(around:5000,${lat},${lng})[amenity=police];
          way(around:5000,${lat},${lng})[amenity=police];
          relation(around:5000,${lat},${lng})[amenity=police];
        );
        out body;
        >;
        out skel qt;
    `;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(policeQuery)}`)
        .then(response => response.json())
        .then(data => {
            data.elements.forEach(element => {
                if (element.type === 'node' || (element.type === 'way' && element.center)) {
                    const position = element.type === 'node' ? [element.lat, element.lon] : [element.center.lat, element.center.lon];
                    const name = element.tags.name || "Police Station";
                    const matchedStation = policeStations.find(station => 
                        station.name.toLowerCase().replace(/[^\w\s]/gi, '') === name.toLowerCase().replace(/[^\w\s]/gi, '')
                    );
                    const phone = matchedStation ? matchedStation.phone : "Contact emergency services";
                    const popupContent = `
                        <strong>${name}</strong><br>
                        Phone: <a href="tel:${phone}" onclick="openPhoneApp('${phone}'); return false;">${phone}</a>
                    `;
                    L.marker(position, {icon: policeIcon})
                        .bindPopup(popupContent)
                        .addTo(map);
                }
            });
        });
}

function handleLocationError(error) {
    let message;
    if (error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = "WARNING: You are in a dangerous zone! Call +1 (325) 252-2927 for immediate assistance";
                setDefaultLocation();
                break;
            case error.POSITION_UNAVAILABLE:
                message = "Location information is unavailable. Using default location.";
                setDefaultLocation();
                break;
            case error.TIMEOUT:
                message = "The request to get user location timed out. Using default location.";
                setDefaultLocation();
                break;
            default:
                message = "An unknown error occurred. Using default location.";
                setDefaultLocation();
                break;
        }
    } else {
        message = "Geolocation is not supported by this browser. Using default location.";
        setDefaultLocation();
    }
    document.getElementById('status').textContent = message;
}

function setDefaultLocation() {
    const defaultLat = 19.1073017;
    const defaultLng = 72.83747696904763;
    updateLocation({ coords: { latitude: defaultLat, longitude: defaultLng } });
    console.log("Using default location.");
}

function openPhoneApp(phoneNumber) {
    window.location.href = `tel:${phoneNumber}`;
}

// Initialize the map when the page loads
window.onload = initMap;

