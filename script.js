```javascript
/* =========================================================
   CUACAKU V1.0.0
   TAHAP 2
   GPS + REVERSE GEOCODING + OPEN-METEO
   =========================================================

   FUNGSI:
   - Mengambil lokasi GPS perangkat
   - Menampilkan latitude & longitude
   - Mendeteksi nama lokasi
   - Mendeteksi desa/kelurahan
   - Mendeteksi kecamatan
   - Mendeteksi kabupaten
   - Mendeteksi provinsi
   - Mengambil data cuaca Open-Meteo
   - Cuaca berdasarkan koordinat GPS
   - Prakiraan per jam
   - Prakiraan 7 hari
   - Sunrise / sunset
   - Refresh data
   - Responsive UI tetap menggunakan HTML/CSS Tahap 1

   ========================================================= */


/* =========================================================
   KONFIGURASI
   ========================================================= */

const CONFIG = {

    // Open-Meteo
    WEATHER_API:
        "https://api.open-meteo.com/v1/forecast",

    // Reverse Geocoding
    GEOCODING_API:
        "https://nominatim.openstreetmap.org/reverse",

    // Bahasa Indonesia
    LANGUAGE:
        "id",

    // Jumlah hari prakiraan
    FORECAST_DAYS:
        7,

    // Akurasi GPS
    GPS_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 300000
    }

};


/* =========================================================
   ELEMENT DOM
   ========================================================= */

const refreshButton =
    document.getElementById("refreshButton");

const mobileRefresh =
    document.getElementById("mobileRefresh");

const locationButton =
    document.getElementById("locationButton");

const mobileLocationButton =
    document.getElementById("mobileLocationButton");

const settingsButton =
    document.getElementById("settingsButton");

const toast =
    document.getElementById("toast");

const toastMessage =
    document.getElementById("toastMessage");

const topLocation =
    document.getElementById("topLocation");

const locationName =
    document.getElementById("locationName");

const locationAddress =
    document.getElementById("locationAddress");

const coordinates =
    document.getElementById("coordinates");

const currentTemp =
    document.getElementById("currentTemp");

const feelsLike =
    document.getElementById("feelsLike");

const weatherDescription =
    document.getElementById("weatherDescription");

const weatherIcon =
    document.getElementById("weatherIcon");

const currentDate =
    document.getElementById("currentDate");


/* =========================================================
   STATE APLIKASI
   ========================================================= */

let currentCoordinates = null;

let currentWeatherData = null;

let currentLocationData = null;

let toastTimer = null;


/* =========================================================
   INISIALISASI
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateDateTime();

        setupInteractions();

        setupNavigation();

        setupHourlyScroll();

        /*
         * Jangan langsung meminta GPS ketika halaman dibuka.
         *
         * Browser membutuhkan izin pengguna.
         * GPS akan dijalankan ketika tombol
         * "Gunakan Lokasi Saya" ditekan.
         */

        showToast(
            "Tekan \"Gunakan Lokasi Saya\" untuk memulai."
        );

    }
);


/* =========================================================
   EVENT
   ========================================================= */

function setupInteractions() {

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                if (currentCoordinates) {

                    loadWeatherForLocation(
                        currentCoordinates.latitude,
                        currentCoordinates.longitude
                    );

                } else {

                    requestLocation();

                }

            }
        );

    }


    if (mobileRefresh) {

        mobileRefresh.addEventListener(
            "click",
            () => {

                if (currentCoordinates) {

                    loadWeatherForLocation(
                        currentCoordinates.latitude,
                        currentCoordinates.longitude
                    );

                } else {

                    requestLocation();

                }

            }
        );

    }


    if (locationButton) {

        locationButton.addEventListener(
            "click",
            requestLocation
        );

    }


    if (mobileLocationButton) {

        mobileLocationButton.addEventListener(
            "click",
            requestLocation
        );

    }


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            () => {

                showToast(
                    "Pengaturan akan tersedia pada versi berikutnya."
                );

            }
        );

    }

}


/* =========================================================
   GPS
   ========================================================= */

function requestLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Browser tidak mendukung GPS."
        );

        return;

    }


    setLocationLoading(true);


    showToast(
        "Mencari lokasi perangkat..."
    );


    navigator.geolocation.getCurrentPosition(

        async (position) => {

            try {

                const latitude =
                    position.coords.latitude;

                const longitude =
                    position.coords.longitude;


                const accuracy =
                    position.coords.accuracy;


                currentCoordinates = {

                    latitude,
                    longitude,
                    accuracy

                };


                updateCoordinates(
                    latitude,
                    longitude,
                    accuracy
                );


                showToast(
                    "Lokasi ditemukan. Mengambil data..."
                );


                /*
                 * Dua proses dilakukan setelah GPS:
                 *
                 * 1. Reverse geocoding
                 * 2. Weather API
                 */

                await loadLocationName(
                    latitude,
                    longitude
                );


                await loadWeatherForLocation(
                    latitude,
                    longitude,
                    false
                );


                setLocationLoading(false);


            } catch (error) {

                console.error(
                    "Location processing error:",
                    error
                );


                setLocationLoading(false);


                showToast(
                    "Lokasi ditemukan, tetapi data gagal dimuat."
                );

            }

        },


        (error) => {

            setLocationLoading(false);

            handleGPSError(error);

        },


        CONFIG.GPS_OPTIONS

    );

}


/* =========================================================
   GPS ERROR
   ========================================================= */

function handleGPSError(error) {

    let message =
        "Lokasi tidak dapat ditemukan.";


    switch (error.code) {

        case error.PERMISSION_DENIED:

            message =
                "Izin lokasi ditolak. Izinkan akses lokasi di browser.";

            break;


        case error.POSITION_UNAVAILABLE:

            message =
                "Lokasi perangkat tidak tersedia.";

            break;


        case error.TIMEOUT:

            message =
                "Pencarian lokasi terlalu lama. Coba lagi.";

            break;


        default:

            message =
                "Terjadi kesalahan saat mengambil lokasi.";

    }


    showToast(message);


    if (topLocation) {

        topLocation.textContent =
            "Lokasi belum tersedia";

    }

}


/* =========================================================
   STATUS TOMBOL LOKASI
   ========================================================= */

function setLocationLoading(isLoading) {

    if (locationButton) {

        locationButton.disabled =
            isLoading;

        locationButton.innerHTML =
            isLoading
                ? "<span>⌛</span> Mencari Lokasi..."
                : "<span>⌖</span> Gunakan Lokasi Saya";

    }


    if (mobileLocationButton) {

        mobileLocationButton.disabled =
            isLoading;

        mobileLocationButton.innerHTML =
            isLoading
                ? "<span>⌛</span>"
                : "<span>⌖</span>";

    }

}


/* =========================================================
   UPDATE KOORDINAT
   ========================================================= */

function updateCoordinates(
    latitude,
    longitude,
    accuracy
) {

    if (!coordinates) {
        return;
    }


    let accuracyText = "";


    if (
        typeof accuracy === "number" &&
        accuracy > 0
    ) {

        accuracyText =
            ` • Akurasi ±${Math.round(accuracy)} m`;

    }


    coordinates.textContent =
        `Latitude ${latitude.toFixed(5)} • Longitude ${longitude.toFixed(5)}${accuracyText}`;

}


/* =========================================================
   REVERSE GEOCODING
   =========================================================

   GPS:
   latitude + longitude

   ↓

   Nominatim

   ↓

   Desa
   Kecamatan
   Kabupaten
   Provinsi
   Negara

   ========================================================= */

async function loadLocationName(
    latitude,
    longitude
) {

    if (topLocation) {

        topLocation.textContent =
            "Mencari nama lokasi...";

    }


    const params =
        new URLSearchParams({

            format: "jsonv2",

            lat: latitude,

            lon: longitude,

            zoom: "18",

            addressdetails: "1",

            "accept-language":
                "id"

        });


    const url =
        `${CONFIG.GEOCODING_API}?${params.toString()}`;


    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Geocoding HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        currentLocationData =
            parseLocationData(data);


        updateLocationUI(
            currentLocationData
        );


        return currentLocationData;


    } catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        /*
         * GPS tetap bisa digunakan meskipun
         * reverse geocoding gagal.
         */

        if (topLocation) {

            topLocation.textContent =
                "Lokasi GPS ditemukan";

        }


        if (locationName) {

            locationName.textContent =
                "Lokasi GPS";

        }


        if (locationAddress) {

            locationAddress.textContent =
                "Nama wilayah belum tersedia";

        }


        showToast(
            "GPS aktif, tetapi nama wilayah belum ditemukan."
        );


        return null;

    }

}


/* =========================================================
   PARSE DATA LOKASI
   ========================================================= */

function parseLocationData(data) {

    const address =
        data?.address || {};


    /*
     * OSM tidak selalu menggunakan nama field
     * yang sama untuk setiap wilayah.
     *
     * Karena itu kita sediakan beberapa fallback.
     */


    const village =
        firstValid([

            address.village,

            address.town,

            address.suburb,

            address.municipality,

            address.hamlet,

            address.city_district

        ]);


    const district =
        firstValid([

            address.county,

            address.city_district,

            address.municipality

        ]);


    const city =
        firstValid([

            address.city,

            address.town,

            address.municipality,

            address.county

        ]);


    const province =
        firstValid([

            address.state,

            address.province,

            address.state_district

        ]);


    const country =
        firstValid([

            address.country

        ]);


    return {

        village:
            cleanPlaceName(village),

        district:
            cleanPlaceName(district),

        city:
            cleanPlaceName(city),

        province:
            cleanPlaceName(province),

        country:
            cleanPlaceName(country),

        displayName:
            data?.display_name || ""

    };

}


/* =========================================================
   FALLBACK VALUE
   ========================================================= */

function firstValid(values) {

    for (
        const value of values
    ) {

        if (
            value &&
            String(value).trim() !== ""
        ) {

            return String(value).trim();

        }

    }


    return "Tidak tersedia";

}


/* =========================================================
   MEMBERSIHKAN NAMA LOKASI
   ========================================================= */

function cleanPlaceName(name) {

    if (!name) {
        return "Tidak tersedia";
    }


    return String(name)
        .replace(
            /^(Kecamatan|Kec\.|Kabupaten|Kab\.|Kota|Provinsi)\s+/i,
            ""
        )
        .trim();

}


/* =========================================================
   UPDATE UI LOKASI
   ========================================================= */

function updateLocationUI(location) {

    if (!location) {
        return;
    }


    const village =
        location.village;


    const district =
        location.district;


    const city =
        location.city;


    const province =
        location.province;


    /*
     * Nama utama.
     */

    if (locationName) {

        if (
            village !== "Tidak tersedia"
        ) {

            locationName.textContent =
                village;

        } else if (
            district !== "Tidak tersedia"
        ) {

            locationName.textContent =
                district;

        } else {

            locationName.textContent =
                "Lokasi Anda";

        }

    }


    /*
     * Baris alamat.
     */

    if (locationAddress) {

        const parts = [];


        if (
            district !== "Tidak tersedia"
        ) {

            parts.push(
                `Kec. ${district}`
            );

        }


        if (
            city !== "Tidak tersedia"
        ) {

            parts.push(city);

        }


        if (
            province !== "Tidak tersedia"
        ) {

            parts.push(province);

        }


        locationAddress.textContent =
            parts.join(", ");

    }


    /*
     * Header.
     */

    if (topLocation) {

        if (
            district !== "Tidak tersedia"
        ) {

            topLocation.textContent =
                `Kec. ${district}`;

        } else if (
            village !== "Tidak tersedia"
        ) {

            topLocation.textContent =
                village;

        } else {

            topLocation.textContent =
                "Lokasi Anda";

        }

    }

}


/* =========================================================
   OPEN-METEO
   ========================================================= */

async function loadWeatherForLocation(
    latitude,
    longitude,
    showLoading = true
) {

    if (showLoading) {

        showToast(
            "Mengambil data cuaca terbaru..."
        );

    }


    try {

        const params =
            new URLSearchParams({

                latitude:
                    latitude,

                longitude:
                    longitude,

                timezone:
                    "auto",

                forecast_days:
                    CONFIG.FORECAST_DAYS,

                temperature_unit:
                    "celsius",

                wind_speed_unit:
                    "kmh",

                precipitation_unit:
                    "mm",

                current:
                    [
                        "temperature_2m",
                        "apparent_temperature",
                        "relative_humidity_2m",
                        "precipitation",
                        "rain",
                        "weather_code",
                        "cloud_cover",
                        "wind_speed_10m",
                        "wind_direction_10m",
                        "wind_gusts_10m"
                    ].join(","),

                hourly:
                    [
                        "temperature_2m",
                        "apparent_temperature",
                        "relative_humidity_2m",
                        "precipitation_probability",
                        "precipitation",
                        "rain",
                        "weather_code",
                        "cloud_cover",
                        "visibility",
                        "wind_speed_10m",
                        "wind_direction_10m",
                        "wind_gusts_10m"
                    ].join(","),

                daily:
                    [
                        "weather_code",
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "apparent_temperature_max",
                        "apparent_temperature_min",
                        "sunrise",
                        "sunset",
                        "precipitation_sum",
                        "rain_sum",
                        "precipitation_probability_max",
                        "wind_speed_10m_max",
                        "wind_gusts_10m_max"
                    ].join(",")

            });


        const url =
            `${CONFIG.WEATHER_API}?${params.toString()}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Weather HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        currentWeatherData =
            data;


        updateCurrentWeather(data);

        updateHourlyForecast(data);

        updateDailyForecast(data);

        updateSunriseSunset(data);

        updateSummary(data);


        updateDataStatus();


        showToast(
            "Data cuaca berhasil diperbarui."
        );


        return data;


    } catch (error) {

        console.error(
            "Weather API error:",
            error
        );


        showToast(
            "Gagal mengambil data cuaca."
        );


        return null;

    }

}


/* =========================================================
   CUACA SEKARANG
   ========================================================= */

function updateCurrentWeather(data) {

    const current =
        data?.current;


    if (!current) {
        return;
    }


    /*
     * Suhu
     */

    if (currentTemp) {

        currentTemp.textContent =
            roundValue(
                current.temperature_2m
            );

    }


    /*
     * Feels like
     */

    if (feelsLike) {

        feelsLike.textContent =
            `${roundValue(current.apparent_temperature)}°C`;

    }


    /*
     * Weather code
     */

    const weather =
        getWeatherInfo(
            current.weather_code
        );


    if (weatherDescription) {

        weatherDescription.textContent =
            weather.description;

    }


    if (weatherIcon) {

        weatherIcon.textContent =
            weather.icon;

    }


    /*
     * Statistik kartu.
     *
     * HTML Tahap 1 belum mempunyai ID khusus
     * untuk kartu statistik, jadi kita cari berdasarkan
     * urutannya.
     */

    const statCards =
        document.querySelectorAll(
            ".stat-card"
        );


    if (statCards.length >= 4) {

        /*
         * SUHU
         */

        updateStatCard(
            statCards[0],
            `${roundValue(current.temperature_2m)}°C`,
            "Suhu udara saat ini"
        );


        /*
         * KELEMBAPAN
         */

        updateStatCard(
            statCards[1],
            `${roundValue(current.relative_humidity_2m)}%`,
            "Kelembapan udara"
        );


        /*
         * ANGIN
         */

        const windDirection =
            degreesToCompass(
                current.wind_direction_10m
            );


        updateStatCard(
            statCards[2],
            `${roundValue(current.wind_speed_10m)} km/j`,
            `Arah ${windDirection}`
        );


        /*
         * HUJAN
         */

        const hourly =
            data.hourly;


        const probability =
            getNearestHourlyValue(
                hourly,
                "precipitation_probability",
                current.time
            );


        updateStatCard(
            statCards[3],
            `${roundValue(probability)}%`,
            "Peluang hujan"
        );

    }

}


/* =========================================================
   UPDATE STAT CARD
   ========================================================= */

function updateStatCard(
    card,
    value,
    description
) {

    if (!card) {
        return;
    }


    const valueElement =
        card.querySelector(
            ".stat-value"
        );


    const descriptionElement =
        card.querySelector(
            "p"
        );


    if (valueElement) {

        const match =
            String(value).match(
                /^(.+?)(°C|%| km\/j)?$/
            );


        if (match) {

            const main =
                match[1];

            const unit =
                match[2] || "";


            valueElement.innerHTML =
                `${main}<span>${unit}</span>`;

        } else {

            valueElement.textContent =
                value;

        }

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            description;

    }

}


/* =========================================================
   PRAKIRAAN PER JAM
   ========================================================= */

function updateHourlyForecast(data) {

    const hourly =
        data?.hourly;


    if (!hourly?.time) {
        return;
    }


    const container =
        document.querySelector(
            ".hourly-container"
        );


    if (!container) {
        return;
    }


    /*
     * Kita ambil 8 waktu mulai dari waktu terdekat
     * dengan sekarang.
     */

    const currentIndex =
        findNearestTimeIndex(
            hourly.time,
            data.current?.time
        );


    const startIndex =
        Math.max(
            currentIndex,
            0
        );


    const cards = [];


    for (
        let i = startIndex;
        i < hourly.time.length &&
        cards.length < 8;
        i++
    ) {

        cards.push(
            createHourlyCard(
                hourly,
                i,
                i === startIndex
            )
        );

    }


    container.innerHTML =
        cards.join("");

}


/* =========================================================
   CREATE HOURLY CARD
   ========================================================= */

function createHourlyCard(
    hourly,
    index,
    active
) {

    const time =
        hourly.time[index];


    const temperature =
        hourly.temperature_2m[index];


    const precipitationProbability =
        hourly.precipitation_probability?.[index];


    const weatherCode =
        hourly.weather_code?.[index];


    const weather =
        getWeatherInfo(
            weatherCode
        );


    const timeText =
        formatHour(time);


    const temperatureText =
        `${roundValue(temperature)}°`;


    const rainText =
        precipitationProbability == null
            ? "—"
            : `${roundValue(precipitationProbability)}%`;


    return `

        <article class="hour-card ${active ? "active" : ""}">

            <span>${timeText}</span>

            <strong>${weather.icon}</strong>

            <b>${temperatureText}</b>

            <small>${rainText}</small>

        </article>

    `;

}


/* =========================================================
   PRAKIRAAN 7 HARI
   ========================================================= */

function updateDailyForecast(data) {

    const daily =
        data?.daily;


    if (!daily?.time) {
        return;
    }


    const container =
        document.querySelector(
            ".forecast-list"
        );


    if (!container) {
        return;
    }


    const cards = [];


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        cards.push(
            createDailyCard(
                daily,
                i
            )
        );

    }


    container.innerHTML =
        cards.join("");

}


/* =========================================================
   CREATE DAILY CARD
   ========================================================= */

function createDailyCard(
    daily,
    index
) {

    const date =
        daily.time[index];


    const weatherCode =
        daily.weather_code[index];


    const weather =
        getWeatherInfo(
            weatherCode
        );


    const max =
        daily.temperature_2m_max[index];


    const min =
        daily.temperature_2m_min[index];


    const rainProbability =
        daily.precipitation_probability_max?.[index];


    const dayName =
        getDayName(
            date,
            index
        );


    const dateText =
        formatDateShort(
            date
        );


    const rainText =
        rainProbability == null
            ? "—"
            : `${roundValue(rainProbability)}%`;


    return `

        <article class="forecast-card ${index === 0 ? "today" : ""}">

            <div class="forecast-day">

                <strong>${dayName}</strong>

                <span>${dateText}</span>

            </div>


            <div class="forecast-condition">

                <span>${weather.icon}</span>

                <strong>${weather.description}</strong>

            </div>


            <div class="forecast-rain">

                <span>💧</span>

                <strong>${rainText}</strong>

            </div>


            <div class="forecast-temp">

                <strong>${roundValue(max)}°</strong>

                <span>${roundValue(min)}°</span>

            </div>

        </article>

    `;

}


/* =========================================================
   SUNRISE / SUNSET
   ========================================================= */

function updateSunriseSunset(data) {

    const daily =
        data?.daily;


    if (
        !daily?.sunrise ||
        !daily?.sunset
    ) {

        return;

    }


    const sunrise =
        formatTime(
            daily.sunrise[0]
        );


    const sunset =
        formatTime(
            daily.sunset[0]
        );


    const sunriseElements =
        document.querySelectorAll(
            ".sun-times strong"
        );


    if (
        sunriseElements.length >= 2
    ) {

        sunriseElements[0].textContent =
            sunrise;


        sunriseElements[1].textContent =
            sunset;

    }

}


/* =========================================================
   RINGKASAN CUACA
   ========================================================= */

function updateSummary(data) {

    const daily =
        data?.daily;


    if (!daily) {
        return;
    }


    const weather =
        getWeatherInfo(
            daily.weather_code?.[0]
        );


    const max =
        roundValue(
            daily.temperature_2m_max?.[0]
        );


    const min =
        roundValue(
            daily.temperature_2m_min?.[0]
        );


    const rain =
        roundValue(
            daily.precipitation_probability_max?.[0]
        );


    const summaryElement =
        document.querySelector(
            ".summary-text"
        );


    if (!summaryElement) {
        return;
    }


    summaryElement.textContent =
        `Hari ini diperkirakan ${weather.description.toLowerCase()} dengan suhu sekitar ${min}°C hingga ${max}°C dan peluang hujan maksimum sekitar ${rain}%.`;

}


/* =========================================================
   WEATHER CODE
   =========================================================

   WMO WEATHER INTERPRETATION

   ========================================================= */

function getWeatherInfo(code) {

    const weatherMap = {

        0: {
            description: "Cerah",
            icon: "☀️"
        },

        1: {
            description: "Cerah Berawan",
            icon: "🌤️"
        },

        2: {
            description: "Berawan Sebagian",
            icon: "⛅"
        },

        3: {
            description: "Mendung",
            icon: "☁️"
        },

        45: {
            description: "Berkabut",
            icon: "🌫️"
        },

        48: {
            description: "Kabut Tebal",
            icon: "🌫️"
        },

        51: {
            description: "Gerimis Ringan",
            icon: "🌦️"
        },

        53: {
            description: "Gerimis",
            icon: "🌦️"
        },

        55: {
            description: "Gerimis Lebat",
            icon: "🌧️"
        },

        56: {
            description: "Gerimis Beku Ringan",
            icon: "🌧️"
        },

        57: {
            description: "Gerimis Beku Lebat",
            icon: "🌧️"
        },

        61: {
            description: "Hujan Ringan",
            icon: "🌦️"
        },

        63: {
            description: "Hujan",
            icon: "🌧️"
        },

        65: {
            description: "Hujan Lebat",
            icon: "🌧️"
        },

        66: {
            description: "Hujan Beku Ringan",
            icon: "🌧️"
        },

        67: {
            description: "Hujan Beku Lebat",
            icon: "🌧️"
        },

        71: {
            description: "Salju Ringan",
            icon: "🌨️"
        },

        73: {
            description: "Salju",
            icon: "🌨️"
        },

        75: {
            description: "Salju Lebat",
            icon: "❄️"
        },

        77: {
            description: "Butiran Salju",
            icon: "❄️"
        },

        80: {
            description: "Hujan Lokal",
            icon: "🌦️"
        },

        81: {
            description: "Hujan Lokal",
            icon: "🌧️"
        },

        82: {
            description: "Hujan Sangat Lebat",
            icon: "⛈️"
        },

        85: {
            description: "Salju Lokal",
            icon: "🌨️"
        },

        86: {
            description: "Salju Lebat",
            icon: "❄️"
        },

        95: {
            description: "Badai Petir",
            icon: "⛈️"
        },

        96: {
            description: "Badai Petir + Hujan Es",
            icon: "⛈️"
        },

        99: {
            description: "Badai Petir + Hujan Es Lebat",
            icon: "⛈️"
        }

    };


    return (
        weatherMap[code] || {

            description:
                "Kondisi Tidak Diketahui",

            icon:
                "🌥️"

        }
    );

}


/* =========================================================
   ARAH ANGIN
   ========================================================= */

function degreesToCompass(
    degrees
) {

    if (
        degrees === null ||
        degrees === undefined ||
        Number.isNaN(Number(degrees))
    ) {

        return "—";

    }


    const directions = [

        "Utara",
        "Timur Laut",
        "Timur",
        "Tenggara",
        "Selatan",
        "Barat Daya",
        "Barat",
        "Barat Laut"

    ];


    const index =
        Math.round(
            Number(degrees) / 45
        ) % 8;


    return directions[index];

}


/* =========================================================
   MENCARI INDEX WAKTU TERDEKAT
   ========================================================= */

function findNearestTimeIndex(
    times,
    targetTime
) {

    if (
        !Array.isArray(times) ||
        !targetTime
    ) {

        return 0;

    }


    const target =
        new Date(targetTime).getTime();


    let nearestIndex = 0;

    let nearestDifference =
        Infinity;


    times.forEach(
        (time, index) => {

            const current =
                new Date(time).getTime();


            const difference =
                Math.abs(
                    current - target
                );


            if (
                difference <
                nearestDifference
            ) {

                nearestDifference =
                    difference;

                nearestIndex =
                    index;

            }

        }
    );


    return nearestIndex;

}


/* =========================================================
   NILAI HOURLY TERDEKAT
   ========================================================= */

function getNearestHourlyValue(
    hourly,
    property,
    targetTime
) {

    if (
        !hourly ||
        !hourly.time ||
        !hourly[property]
    ) {

        return 0;

    }


    const index =
        findNearestTimeIndex(
            hourly.time,
            targetTime
        );


    return (
        hourly[property][index] ?? 0
    );

}


/* =========================================================
   FORMAT JAM
   ========================================================= */

function formatHour(
    isoTime
) {

    if (!isoTime) {
        return "--:--";
    }


    const match =
        String(isoTime).match(
            /T(\d{2}):(\d{2})/
        );


    if (!match) {

        return "--:--";

    }


    return `${match[1]}:${match[2]}`;

}


/* =========================================================
   FORMAT WAKTU
   ========================================================= */

function formatTime(
    isoTime
) {

    return formatHour(
        isoTime
    );

}


/* =========================================================
   FORMAT TANGGAL
   ========================================================= */

function formatDateShort(
    dateString
) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(
            `${dateString}T12:00:00`
        );


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "numeric",
            month: "short"
        }
    );

}


/* =========================================================
   NAMA HARI
   ========================================================= */

function getDayName(
    dateString,
    index
) {

    if (index === 0) {
        return "Hari Ini";
    }


    const date =
        new Date(
            `${dateString}T12:00:00`
        );


    return date.toLocaleDateString(
        "id-ID",
        {
            weekday: "long"
        }
    );

}


/* =========================================================
   BULATKAN NILAI
   ========================================================= */

function roundValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(Number(value))
    ) {

        return "—";

    }


    return Math.round(
        Number(value)
    );

}


/* =========================================================
   UPDATE STATUS DATA
   ========================================================= */

function updateDataStatus() {

    const updateText =
        document.getElementById(
            "updateText"
        );


    if (!updateText) {
        return;
    }


    const now =
        new Date();


    updateText.textContent =
        `Diperbarui ${now.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )}`;

}


/* =========================================================
   TANGGAL HEADER
   ========================================================= */

function updateDateTime() {

    if (!currentDate) {
        return;
    }


    const now =
        new Date();


    currentDate.textContent =
        now.toLocaleDateString(
            "id-ID",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item, .mobile-nav-item"
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    navItems.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                    item.classList.add(
                        "active"
                    );

                }
            );

        }
    );

}


/* =========================================================
   HOURLY HORIZONTAL SCROLL
   ========================================================= */

function setupHourlyScroll() {

    const container =
        document.querySelector(
            ".hourly-container"
        );


    if (!container) {
        return;
    }


    /*
     * Mouse wheel desktop bisa digunakan
     * untuk menggeser prakiraan per jam.
     */

    container.addEventListener(
        "wheel",
        event => {

            if (
                window.innerWidth <= 1100
            ) {

                if (
                    Math.abs(event.deltaY) >
                    Math.abs(event.deltaX)
                ) {

                    container.scrollLeft +=
                        event.deltaY;

                }

            }

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message
) {

    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    toastMessage.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* =========================================================
   AUTO REFRESH
   =========================================================

   Tidak melakukan GPS berulang-ulang.

   Hanya memperbarui cuaca jika lokasi
   sudah pernah diperoleh.

   ========================================================= */

setInterval(
    () => {

        if (!currentCoordinates) {
            return;
        }


        loadWeatherForLocation(

            currentCoordinates.latitude,

            currentCoordinates.longitude,

            false

        );

    },
    15 * 60 * 1000
);


/* =========================================================
   ONLINE / OFFLINE
   ========================================================= */

window.addEventListener(
    "online",
    () => {

        showToast(
            "Koneksi internet kembali."
        );

    }
);


window.addEventListener(
    "offline",
    () => {

        showToast(
            "Tidak ada koneksi internet."
        );

    }
);


/* =========================================================
   ERROR GLOBAL
   ========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            "CUACAKU Error:",
            event.error || event.message
        );

    }
);


/* =========================================================
   DEBUG HELPER
   =========================================================

   Bisa digunakan melalui Console browser:

   currentCoordinates
   currentWeatherData
   currentLocationData

   ========================================================= */

window.CUACAKU = {

    getCoordinates:
        () => currentCoordinates,

    getWeather:
        () => currentWeatherData,

    getLocation:
        () => currentLocationData,

    refresh:
        () => {

            if (currentCoordinates) {

                return loadWeatherForLocation(

                    currentCoordinates.latitude,

                    currentCoordinates.longitude

                );

            }


            return requestLocation();

        }

};


/* =========================================================
   SELESAI
   ========================================================= */
```
