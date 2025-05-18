const timeElement = document.getElementById('time');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const maxTempElement = document.querySelector('.max-temp');
const minTempElement = document.querySelector('.min-temp');
const hourlyForecastContainer = document.getElementById('hourly-forecast');
const feelsLikeElement = document.getElementById('feels-like');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const pressureElement = document.getElementById('pressure');
const glassyGradient = document.getElementById('glassy-gradient');
const menuButton = document.getElementById('menu-button');
const locationMenu = document.getElementById('location-menu');
const updateLocationButton = document.getElementById('update-location-button');
const locationInput = document.getElementById('location-input');
const closeMenuButton = document.getElementById('close-menu-button');

// Replace with your actual OpenWeatherMap API key
const apiKey = 'a80f44d99068a004db117c70b127bf7a';

function isDaytime(sunrise, sunset, timezone) {
    const nowUTC = Date.now();
    const localNow = new Date(nowUTC + timezone * 1000);
    const sunriseLocal = new Date((sunrise + timezone) * 1000);
    const sunsetLocal = new Date((sunset + timezone) * 1000);
    return localNow > sunriseLocal && localNow < sunsetLocal;
}

function updateGlassyGradient(weather) {
    const sunrise = weather.sys.sunrise;
    const sunset = weather.sys.sunset;
    const timezone = weather.timezone;
    const isDay = isDaytime(sunrise, sunset, timezone);
    let gradientColors;

    if (isDay) {
        // Yellowy-orange gradient for day
        gradientColors = 'linear-gradient(45deg, rgba(255, 215, 0, 0.5), rgba(255, 165, 0, 0.2))'; // Gold to Orange
    } else {
        // Bluish-purple gradient for night
        gradientColors = 'linear-gradient(45deg, rgba(138, 43, 226, 0.5), rgba(75, 0, 130, 0.2))'; // BlueViolet to Indigo
    }

    glassyGradient.style.background = gradientColors;
}

function updateTime() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'pm' : 'am';
    const day = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);
    const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now);
    const dayOfMonth = now.getDate();
    timeElement.textContent = `${hours}:${minutes} ${ampm}, ${day} ${month} ${dayOfMonth}`;
}

function getWeather(query) {
    let apiUrl;
    let forecastUrl;

    if (typeof query === 'string') {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${apiKey}&units=metric`;
    } else if (typeof query === 'object' && query.latitude && query.longitude) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${query.latitude}&lon=${query.longitude}&appid=${apiKey}&units=metric`;
        forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${query.latitude}&lon=${query.longitude}&appid=${apiKey}&units=metric`;
    } else {
        console.error('Invalid query for getWeather');
        return;
    }

    console.log('Fetching weather data...');

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Weather Data:', data);
            updateCurrentWeatherUI(data);
            updateGlassyGradient(data); // Pass the whole data object
            // After fetching current weather, fetch forecast
            fetch(forecastUrl)
                .then(response => response.json())
                .then(forecastData => {
                    console.log('Forecast Data:', forecastData);
                    updateHourlyForecastUI(forecastData.list);
                })
                .catch(error => {
                    console.error('Error fetching forecast data:', error);
                    locationElement.textContent = 'Error fetching forecast';
                });
        })
        .catch(error => {
            console.error('Error fetching weather data:', error);
            locationElement.textContent = 'Could not find location';
            temperatureElement.textContent = '--';
            descriptionElement.textContent = '--';
            maxTempElement.textContent = '--°C';
            minTempElement.textContent = '--°C';
            feelsLikeElement.textContent = '--°C';
            humidityElement.textContent = '--%';
            windElement.textContent = '-- m/s';
            pressureElement.textContent = '-- hPa';
            glassyGradient.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))'; // Reset gradient
            hourlyForecastContainer.innerHTML = '';
        });
}

function updateCurrentWeatherUI(data) {
    locationElement.textContent = data.name;
    temperatureElement.textContent = `${Math.round(data.main.temp)}°C`;
    descriptionElement.textContent = data.weather[0].description;
    maxTempElement.textContent = `${Math.round(data.main.temp_max)}°C`;
    minTempElement.textContent = `${Math.round(data.main.temp_min)}°C`;
    feelsLikeElement.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidityElement.textContent = `${data.main.humidity}%`;
    windElement.textContent = `${data.wind.speed} m/s`;
    pressureElement.textContent = `${data.main.pressure} hPa`;
}

function updateHourlyForecastUI(forecastList) {
    hourlyForecastContainer.innerHTML = ''; // Clear previous forecast
    const now = new Date();
    const displayedHours = new Set(); // To avoid duplicates

    forecastList.forEach(item => {
        const itemTimestamp = item.dt;
        const itemDate = new Date(itemTimestamp * 1000);
        const timeDifference = itemDate.getTime() - now.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        // Show forecast items within the next 24 hours
        if (hoursDifference > 0 && hoursDifference < 24) {
            const displayHour = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: true }).format(itemDate);
            const iconCode = item.weather[0].icon;
            const temperature = Math.round(item.main.temp);
            const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;
            const uniqueHourKey = `${itemDate.toDateString()}-${itemDate.getHours()}`;

            if (!displayedHours.has(uniqueHourKey)) {
                const hourlyItem = document.createElement('div');
                hourlyItem.classList.add('hourly-item');
                hourlyItem.innerHTML = `
                    <p>${displayHour}</p>
                    <img src="${iconUrl}" alt="weather icon">
                    <p>${temperature}°C</p>
                `;
                hourlyForecastContainer.appendChild(hourlyItem);
                displayedHours.add(uniqueHourKey);
            }
        }
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            getWeather({ latitude, longitude }); // Pass coordinates object
            // --- REVERSE GEOCODING TO GET CITY NAME (Optional) ---
            fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`)
                .then(response => response.json())
                .then(geoData => {
                    if (geoData && geoData.length > 0) {
                        locationElement.textContent = `${geoData[0].name}, ${geoData[0].country}`;
                    }
                })
                .catch(geoError => {
                    console.error('Error during reverse geocoding:', geoError);
                });
            // ------------------------------------------------------
        }, error => {
            console.error('Error getting location:', error);
            locationElement.textContent = 'Location access denied';
            temperatureElement.textContent = '--';
            descriptionElement.textContent = 'Please enable location';
            maxTempElement.textContent = '--°C';
            minTempElement.textContent = '--°C';
            feelsLikeElement.textContent = '--°C';
            humidityElement.textContent = '--%';
            windElement.textContent = '-- m/s';
            pressureElement.textContent = '-- hPa';
            glassyGradient.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))'; // Reset gradient
            hourlyForecastContainer.innerHTML = '';
        });
    } else {
        locationElement.textContent = 'Geolocation not supported';
        temperatureElement.textContent = '--';
        descriptionElement.textContent = 'Your browser does not support geolocation';
        maxTempElement.textContent = '--°C';
        minTempElement.textContent = '--°C';
        feelsLikeElement.textContent = '--°C';
        humidityElement.textContent = '--%';
        windElement.textContent = '-- m/s';
        pressureElement.textContent = '-- hPa';
        glassyGradient.style.background = 'linear-gradient(45deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1))'; // Reset gradient
        hourlyForecastContainer.innerHTML = '';
    }
}

function toggleLocationMenu() {
    locationMenu.classList.toggle('hidden');
}

function handleUpdateLocation() {
    const city = locationInput.value.trim();
    if (city) {
        getWeather(city);
        toggleLocationMenu(); // Close the menu after update
    } else {
        alert('Please enter a city name.');
    }
}

function handleCloseMenu() {
    toggleLocationMenu();
}

// Event listeners
menuButton.addEventListener('click', toggleLocationMenu);
updateLocationButton.addEventListener('click', handleUpdateLocation);
closeMenuButton.addEventListener('click', handleCloseMenu);

// Initial setup
updateTime();
setInterval(updateTime, 60000);
getLocation();
