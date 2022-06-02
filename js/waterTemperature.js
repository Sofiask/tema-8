const url = 'https://www.yr.no/api/v0/regions/NO-03/watertemperatures';

export async function getBeaches () {
    const response = await fetch(url);
    const result = await response.json(); 

    // Hämta information för alla plasser
    const currentIndex = result;
    // Hämta en specifik temperatur (index 0)
    // const temperature = currentIndex[0].temperature;

    const averageTemp = (result.reduce((previous, current) => {
        return previous + current.temperature
    }, 0) / result.length).toFixed(1);

   // Lägga inn temperatur i html
    const temperaturElement = document.querySelector('.p-water-temperature');
    temperaturElement.textContent = averageTemp;

    const resultFeatures = result.map(beach => {
        return {
            type: "Features",
            properties: {
                beach: beach.location.name,
                temperature: beach.temperature,
                address: beach.location.category.name
            },
            geometry: {
                type: "Point",
                coordinates: [beach.location.position.lon, beach.location.position.lat]
            }
        }
    });

    return resultFeatures;
};




