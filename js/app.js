import { getWeather } from "./weather.js";
import { main } from "./menu.js";
import { getBeaches } from "./waterTemperature.js";
import { splash } from "./splash.js";

splash();
main();
getWeather();
getBeaches();

// registrere service worker
const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("../sw.js", {
        scope: "/",
      });
      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};
registerServiceWorker(); //

// Map accessToken
const mapbox_key =
  "pk.eyJ1Ijoic29maWFza2EiLCJhIjoiY2wxYnYyZjZuMDFpbDNkczltZ3Ywd2Y0cSJ9.j8Bz11OkdDq2188Buy9dGw";

// Hämta map
async function getMap() {
  mapboxgl.accessToken = mapbox_key;

  const bikeStations = await getStations();

  const bikeStatus = await getStatus();

  const osloBeachesFeatures = await getBeaches();

  // Hämta lediga plasser
  const getAvailabilityDocks = (id) => {
    const currentStation = bikeStatus.filter((station) => {
      return station.station_id === id;
    });
    return currentStation[0].num_docks_available;
  };
  // Hämta lediga sykkler
  const getAvailableBykes = (id) => {
    const currentStation = bikeStatus.filter((station) => {
      return station.station_id === id;
    });
    return currentStation[0].num_bikes_available;
  };

  // Hämta ut relevant data från API som jag vill bruke
  const featuresBikes = bikeStations.map((station) => {
    return {
      type: "Feature",
      properties: {
        station: station.name,
        address: station.address,
        availableBikes: getAvailableBykes(station.station_id),
        availableDocks: getAvailabilityDocks(station.station_id),
      },
      geometry: {
        type: "Point",
        coordinates: [station.lon, station.lat],
      },
    };
  });

  // fra mapbox
  const geoStations = {
    type: "FeatureCollection",
    features: featuresBikes,
  };

  const beachLocations = {
    type: "FeatureCollection",
    features: osloBeachesFeatures
  };

  const map = new mapboxgl.Map({
    container: "map", // container ID
    style: "mapbox://styles/mapbox/streets-v11", // style URL
    center: [10.75, 59.91], // starting position [lng, lat]
    zoom: 15, // starting zoom
  });

  map.addControl(
    new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
    })
  );

  //markers for strender
  beachLocations.features.forEach(beach => {
    // en div for marker
    const beachEl = document.createElement("div");
    // en class for strender 
    beachEl.classList.add("beach-place")
    // Add markers to the map.
    new mapboxgl.Marker(beachEl)
      .setLngLat(beach.geometry.coordinates)
      .addTo(map);

      // popup badeplass
      beachEl.addEventListener("click", () => {
        const allBeaches = document.querySelectorAll(".beach-place");
        const popUpBeachEl = document.querySelector(".beachContainer");
        const weatherEl = document.querySelector(".weather");
        popUpBeachEl.classList.remove("detailsHidden");

        map.flyTo({
          center: [
            beach.geometry.coordinates[0],
            beach.geometry.coordinates[1],
          ],
          essential: true,
          zoom: 16,
        });

        popUpMessageBeach(
          beach.properties.beach,
          beach.properties.temperature,
          beach.properties.address,
          beach.geometry.coordinates[0],
          beach.geometry.coordinates[1],
          map
        );

        weatherEl.classList.add("hiddenWeather");
        beachEl.classList.add("beach-place-active");

      });
  });

  function popUpMessageBeach(beach, temperature, address, lon, lat, map){
    const allBeaches = document.querySelectorAll(".beach-place");
    const weatherEl = document.querySelector(".weather");

    const beachContainer = document.querySelector(".beachContainer");
    beachContainer.classList.remove("detailsHidden");

    const close = document.querySelector(".close-beach");

    // lukke popup
    close.addEventListener("click", () => {

      beachContainer.classList.add("detailsHidden");
      weatherEl.classList.remove("hiddenWeather");

      allBeaches.forEach((item) => {
        item.classList.remove("beach-place-active");
      });

      map.flyTo({
        center: [lon, lat],
        essential: true,
        zoom: 15,
      });
    });
    
    //legge inn riktig data i popup
    const beachTitle = document.querySelector(".beachContainer h2");
    beachTitle.textContent = beach;
    const beachAddress = document.querySelector(".beachContainer .address");
    beachAddress.textContent = address;
    const beachTemperature = document.querySelector(".beachContainer .avilability .available-temperature p");
    beachTemperature.textContent = `${temperature} badetemperatur`;
  }


  // Lage popUp , Zoom(flyTo), toggle,
  geoStations.features.forEach(station => {
    const markerEl = document.createElement("div");
    const weatherEl = document.querySelector(".weather");
    markerEl.classList.add("marker");
    markerEl.setAttribute("availability", station.properties.availableBikes);
    markerEl.addEventListener("click", () => {
      // forEach för att nollställa alla markers som blir markerade. Ligger här och i funktionen
      const allMarkers = document.querySelectorAll(".marker");
      allMarkers.forEach((item) => {
        item.classList.remove("markerActive");
      });

      map.flyTo({
        center: [
          station.geometry.coordinates[0],
          station.geometry.coordinates[1],
        ],
        essential: true,
        zoom: 16,
      });

      popUpMessage(
        station.properties.station,
        station.properties.address,
        station.properties.availableBikes,
        station.properties.availableDocks,
        station.geometry.coordinates[0],
        station.geometry.coordinates[1],
        map
      );

      // her skal jeg add en class til weather i html, trenger ikke å ha classen
      weatherEl.classList.add("hiddenWeather");
      markerEl.classList.add("markerActive");
    });

    // Add markers to the map.
    new mapboxgl.Marker(markerEl)
      .setLngLat(station.geometry.coordinates)
      .addTo(map);
  });
    // Add geolocation
    navigator.geolocation.getCurrentPosition(position => {

      new mapboxgl.Marker({color: 'red'})
      .setLngLat([position.coords.longitude, position.coords.latitude])
      .addTo(map)

      map.flyTo({
        center:[position.coords.longitude, position.coords.latitude],
        zoom: 15,
        essential: true
      });
    });
};

// lage funktionen for hva som skjer med popUp och vilken data som skal hentes
function popUpMessage(station, address, bikes, docks, lat, lon, map) {
  const allMarkers = document.querySelectorAll(".marker");
  const weatherEl = document.querySelector(".weather");
  const markerEl = document.querySelector(".marker");

  const bikeContainerEl = document.querySelector(".bikeContainer");
  bikeContainerEl.classList.remove("detailsHidden");

  const closeDetails = document.querySelector(".bikeContainer .top img");

  //lukke popup
  closeDetails.addEventListener("click", () => {
    allMarkers.forEach((item) => {
      item.classList.remove("markerActive");
    });

    bikeContainerEl.classList.add("detailsHidden");
    weatherEl.classList.remove("hiddenWeather");

    map.flyTo({
      center: [lat, lon],
      essential: true,
      zoom: 15,
    });
  });

  // legge riktig data i popup
  const stationTitle = document.querySelector(".bikeContainer h2");
  stationTitle.textContent = station;
  const stationAddress = document.querySelector(".bikeContainer .address");
  stationAddress.textContent = address;
  const bikesAvilability = document.querySelector(
    ".bikeContainer .avilability .available-bikes p"
  );
  bikesAvilability.textContent = `${bikes} tilgjengelig`;
  const docksAvilability = document.querySelector(
    ".bikeContainer .avilability .available-docks p"
  );
  docksAvilability.textContent = `${docks} parkeringer`;
}

async function getStations() {
  // we need a proxy because the api is blocked from public access
  const corsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
    "https://gbfs.urbansharing.com/oslobysykkel.no/station_information.json"
  )}`;
  const response = await fetch(corsUrl);
  const result = await response.json();
  const stations = JSON.parse(result.contents);
  return stations.data.stations;
}

async function getStatus() {
  const corsUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
    "https://gbfs.urbansharing.com/oslobysykkel.no/station_status.json"
  )}`;
  const response = await fetch(corsUrl);
  const result = await response.json();
  const status = JSON.parse(result.contents);
  return status.data.stations;
}

getMap();


const toSave = 'Oslo';
localStorage.setItem('lastVisitCity', toSave);

const lastCity = localStorage.getItem('lastVisitCity');