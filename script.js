/* =========================================================
   CUACAKU V1.0.0
   TAHAP 3
   GPS + BIGDATACLOUD + OPEN-METEO

   FITUR:
   - GPS perangkat
   - Latitude / Longitude
   - Reverse geocoding
   - Desa / Kelurahan
   - Kecamatan
   - Kabupaten / Kota
   - Provinsi
   - Suhu aktual
   - Feels like
   - Kelembapan
   - Angin
   - Arah angin
   - Peluang hujan
   - Prakiraan per jam
   - Prakiraan 7 hari
   - Sunrise / Sunset
   - Refresh cuaca
   - Auto refresh
   ========================================================= */


/* =========================================================
   KONFIGURASI API
   ========================================================= */

const CONFIG = {

    WEATHER_API:
        "https://api.open-meteo.com/v1/forecast",

    LOCATION_API:
        "https://api.bigdatacloud.net/data/reverse-geocode-client",

    LANGUAGE:
        "id",

    FORECAST_DAYS:
        7,

    GPS_OPTIONS: {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 300000
    }

};


/* =========================================================
   STATE
   ========================================================= */

let currentCoordinates = null;

let currentWeatherData = null;

let currentLocationData = null;

let toastTimer = null;


/* =========================================================
   DOM
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
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateDateTime();

        setupInteractions();

        setupNavigation();

        setupHourlyScroll();

        console.log(
            "CUACAKU V1.0.0 Tahap 3 aktif."
        );

    }
);


/* =========================================================
   INTERACTION
   ========================================================= */

function setupInteractions() {

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            refreshWeather
        );

    }


    if (mobileRefresh) {

        mobileRefresh.addEventListener(
            "click",
            refreshWeather
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
   REFRESH
   ========================================================= */

function refreshWeather() {

    if (!currentCoordinates) {

        requestLocation();

        return;

    }


    loadWeatherForLocation(

        currentCoordinates.latitude,

        currentCoordinates.longitude

    );

}


/* =========================================================
   REQUEST GPS
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


            try {

                /*
                 * Jalankan reverse geocoding
                 */

                await loadLocationName(
                    latitude,
                    longitude
                );


                /*
                 * Kemudian ambil cuaca
                 */

                await loadWeatherForLocation(
                    latitude,
                    longitude,
                    false
                );


                setLocationLoading(
                    false
                );


                showToast(
                    "Lokasi dan cuaca berhasil diperbarui."
                );


            } catch (error) {

                console.error(error);


                setLocationLoading(
                    false
                );


                showToast(
                    "GPS aktif, tetapi sebagian data gagal dimuat."
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


    if (
        error &&
        error.code === 1
    ) {

        message =
            "Izin lokasi ditolak. Izinkan lokasi di browser.";

    }


    if (
        error &&
        error.code === 2
    ) {

        message =
            "Lokasi perangkat tidak tersedia.";

    }


    if (
        error &&
        error.code === 3
    ) {

        message =
            "GPS terlalu lama merespons. Silakan coba lagi.";

    }


    showToast(message);


    if (topLocation) {

        topLocation.textContent =
            "Lokasi belum tersedia";

    }

}


/* =========================================================
   LOADING LOCATION
   ========================================================= */

function setLocationLoading(
    loading
) {

    if (locationButton) {

        locationButton.disabled =
            loading;


        locationButton.innerHTML =
            loading
                ? "<span>⌛</span> Mencari Lokasi..."
                : "<span>⌖</span> Gunakan Lokasi Saya";

    }


    if (mobileLocationButton) {

        mobileLocationButton.disabled =
            loading;


        mobileLocationButton.innerHTML =
            loading
                ? "<span>⌛</span>"
                : "<span>⌖</span>";

    }

}


/* =========================================================
   COORDINATES
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
        `Latitude ${latitude.toFixed(6)} • Longitude ${longitude.toFixed(6)}${accuracyText}`;

}


/* =========================================================
   BIGDATACLOUD REVERSE GEOCODING
   ========================================================= */

async function loadLocationName(
    latitude,
    longitude
) {

    if (topLocation) {

        topLocation.textContent =
            "Mendeteksi nama wilayah...";

    }


    const params =
        new URLSearchParams({

            latitude:
                latitude,

            longitude:
                longitude,

            localityLanguage:
                CONFIG.LANGUAGE

        });


    const url =
        `${CONFIG.LOCATION_API}?${params.toString()}`;


    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Location API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        currentLocationData =
            parseBigDataCloudLocation(
                data
            );


        updateLocationUI(
            currentLocationData
        );


        console.log(
            "Location data:",
            currentLocationData
        );


        return currentLocationData;


    } catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        /*
         * GPS tetap dianggap aktif.
         */

        if (topLocation) {

            topLocation.textContent =
                "Lokasi GPS aktif";

        }


        if (locationName) {

            locationName.textContent =
                "Lokasi Anda";

        }


        if (locationAddress) {

            locationAddress.textContent =
                "Nama wilayah belum tersedia";

        }


        showToast(
            "GPS aktif, tetapi nama wilayah gagal ditemukan."
        );


        return null;

    }

}


/* =========================================================
   PARSE BIGDATACLOUD
   ========================================================= */

function parseBigDataCloudLocation(
    data
) {

    const localityInfo =
        data?.localityInfo;


    const administrative =
        localityInfo?.administrative || [];


    /*
     * Cari nama administratif berdasarkan level.
     */

    let district = "";

    let regency = "";

    let province = "";


    administrative.forEach(
        item => {

            const name =
                item?.name || "";

            const description =
                (
                    item?.description ||
                    ""
                ).toLowerCase();


            /*
             * Kecamatan
             */

            if (
                !district &&
                (
                    description.includes(
                        "district"
                    ) ||
                    description.includes(
                        "kecamatan"
                    )
                )
            ) {

                district =
                    name;

            }


            /*
             * Kabupaten / Regency
             */

            if (
                !regency &&
                (
                    description.includes(
                        "regency"
                    ) ||
                    description.includes(
                        "kabupaten"
                    ) ||
                    description.includes(
                        "municipality"
                    )
                )
            ) {

                regency =
                    name;

            }


            /*
             * Provinsi
             */

            if (
                !province &&
                (
                    description.includes(
                        "province"
                    ) ||
                    description.includes(
                        "provinsi"
                    ) ||
                    description.includes(
                        "state"
                    )
                )
            ) {

                province =
                    name;

            }

        }
    );


    /*
     * Fallback.
     */

    if (!province) {

        province =
            data?.principalSubdivision ||
            "";

    }


    if (!regency) {

        regency =
            data?.city ||
            "";

    }


    /*
     * Locality dapat berupa desa,
     * kelurahan, suburb atau area lokal.
     */

    const locality =
        data?.locality ||
        data?.localityName ||
        "";


    return {

        locality:
            cleanLocationName(
                locality
            ),

        district:
            cleanLocationName(
                district
            ),

        regency:
            cleanLocationName(
                regency
            ),

        province:
            cleanLocationName(
                province
            ),

        city:
            cleanLocationName(
                data?.city
            ),

        country:
            cleanLocationName(
                data?.countryName
            ),

        postcode:
            data?.postcode || "",

        latitude:
            data?.latitude,

        longitude:
            data?.longitude,

        lookupSource:
            data?.lookupSource ||
            "coordinates"

    };

}


/* =========================================================
   CLEAN LOCATION
   ========================================================= */

function cleanLocationName(
    value
) {

    if (
        !value ||
        String(value).trim() === ""
    ) {

        return "";

    }


    return String(value)
        .replace(
            /^Kecamatan\s+/i,
            ""
        )
        .replace(
            /^Kec\.\s+/i,
            ""
        )
        .replace(
            /^Kabupaten\s+/i,
            ""
        )
        .replace(
            /^Kab\.\s+/i,
            ""
        )
        .replace(
            /^Provinsi\s+/i,
            ""
        )
        .trim();

}


/* =========================================================
   UPDATE LOCATION UI
   ========================================================= */

function updateLocationUI(
    location
) {

    if (!location) {
        return;
    }


    const locality =
        location.locality ||
        "";


    const district =
        location.district ||
        "";


    const regency =
        location.regency ||
        "";


    const province =
        location.province ||
        "";


    /*
     * Nama utama
     */

    if (locationName) {

        locationName.textContent =
            locality ||
            district ||
            regency ||
            "Lokasi Anda";

    }


    /*
     * Alamat administratif
     */

    if (locationAddress) {

        const parts = [];


        if (district) {

            parts.push(
                `Kec. ${district}`
            );

        }


        if (regency) {

            parts.push(
                regency
            );

        }


        if (province) {

            parts.push(
                province
            );

        }


        if (
            parts.length === 0 &&
            location.country
        ) {

            parts.push(
                location.country
            );

        }


        locationAddress.textContent =
            parts.join(", ");

    }


    /*
     * Header lokasi
     */

    if (topLocation) {

        if (district) {

            topLocation.textContent =
                `Kec. ${district}`;

        } else if (locality) {

            topLocation.textContent =
                locality;

        } else {

            topLocation.textContent =
                "Lokasi GPS aktif";

        }

    }

}


/* =========================================================
   OPEN-METEO WEATHER
   ========================================================= */

async function loadWeatherForLocation(
    latitude,
    longitude,
    showLoading = true
) {

    if (showLoading) {

        showToast(
            "Mengambil data cuaca..."
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
                        "relative_humidity_2m",
                        "apparent_temperature",
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


        const response =
            await fetch(
                `${CONFIG.WEATHER_API}?${params.toString()}`
            );


        if (!response.ok) {

            throw new Error(
                `Weather API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        currentWeatherData =
            data;


        updateCurrentWeather(
            data
        );


        updateHourlyForecast(
            data
        );


        updateDailyForecast(
            data
        );


        updateSunriseSunset(
            data
        );


        updateSummary(
            data
        );


        updateDataStatus();


        return data;


    } catch (error) {

        console.error(
            "Weather error:",
            error
        );


        showToast(
            "Data cuaca gagal dimuat."
        );


        return null;

    }

}


/* =========================================================
   CURRENT WEATHER
   ========================================================= */

function updateCurrentWeather(
    data
) {

    const current =
        data?.current;


    if (!current) {
        return;
    }


    /*
     * SUHU
     */

    if (currentTemp) {

        currentTemp.textContent =
            roundValue(
                current.temperature_2m
            );

    }


    /*
     * FEELS LIKE
     */

    if (feelsLike) {

        feelsLike.textContent =
            `${roundValue(current.apparent_temperature)}°C`;

    }


    /*
     * KONDISI
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
     * STAT CARDS
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

        const direction =
            degreesToCompass(
                current.wind_direction_10m
            );


        updateStatCard(

            statCards[2],

            `${roundValue(current.wind_speed_10m)} km/j`,

            `Arah ${direction}`

        );


        /*
         * PELUANG HUJAN
         */

        const rainProbability =
            getNearestHourlyValue(

                data.hourly,

                "precipitation_probability",

                current.time

            );


        updateStatCard(

            statCards[3],

            `${roundValue(rainProbability)}%`,

            "Peluang hujan"

        );

    }

}


/* =========================================================
   STAT CARD
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


    const textElement =
        card.querySelector(
            "p"
        );


    if (valueElement) {

        valueElement.innerHTML =
            escapeHTML(
                String(value)
            )
            .replace(
                /°C/g,
                "<span>°C</span>"
            )
            .replace(
                /%/g,
                "<span>%</span>"
            )
            .replace(
                / km\/j/g,
                "<span> km/j</span>"
            );

    }


    if (textElement) {

        textElement.textContent =
            description;

    }

}


/* =========================================================
   HOURLY
   ========================================================= */

function updateHourlyForecast(
    data
) {

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


    const startIndex =
        findNearestTimeIndex(

            hourly.time,

            data.current?.time

        );


    let html = "";


    for (
        let i = startIndex;
        i < hourly.time.length &&
        i < startIndex + 8;
        i++
    ) {

        html +=
            createHourlyCard(

                hourly,

                i,

                i === startIndex

            );

    }


    container.innerHTML =
        html;

}


/* =========================================================
   HOURLY CARD
   ========================================================= */

function createHourlyCard(
    hourly,
    index,
    active
) {

    const time =
        hourly.time[index];


    const temperature =
        hourly.temperature_2m?.[index];


    const probability =
        hourly.precipitation_probability?.[index];


    const weather =
        getWeatherInfo(
            hourly.weather_code?.[index]
        );


    return `

        <article class="hour-card ${active ? "active" : ""}">

            <span>
                ${active ? "Sekarang" : formatHour(time)}
            </span>

            <strong>
                ${weather.icon}
            </strong>

            <b>
                ${roundValue(temperature)}°
            </b>

            <small>
                ${roundValue(probability)}%
            </small>

        </article>

    `;

}


/* =========================================================
   DAILY FORECAST
   ========================================================= */

function updateDailyForecast(
    data
) {

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


    let html = "";


    for (
        let i = 0;
        i < daily.time.length;
        i++
    ) {

        html +=
            createDailyCard(

                daily,

                i

            );

    }


    container.innerHTML =
        html;

}


/* =========================================================
   DAILY CARD
   ========================================================= */

function createDailyCard(
    daily,
    index
) {

    const weather =
        getWeatherInfo(
            daily.weather_code?.[index]
        );


    const max =
        daily.temperature_2m_max?.[index];


    const min =
        daily.temperature_2m_min?.[index];


    const rain =
        daily.precipitation_probability_max?.[index];


    const date =
        daily.time[index];


    return `

        <article class="forecast-card ${index === 0 ? "today" : ""}">

            <div class="forecast-day">

                <strong>
                    ${index === 0
                        ? "Hari Ini"
                        : getDayName(date)}
                </strong>

                <span>
                    ${formatDateShort(date)}
                </span>

            </div>


            <div class="forecast-condition">

                <span>
                    ${weather.icon}
                </span>

                <strong>
                    ${weather.description}
                </strong>

            </div>


            <div class="forecast-rain">

                <span>
                    💧
                </span>

                <strong>
                    ${roundValue(rain)}%
                </strong>

            </div>


            <div class="forecast-temp">

                <strong>
                    ${roundValue(max)}°
                </strong>

                <span>
                    ${roundValue(min)}°
                </span>

            </div>

        </article>

    `;

}


/* =========================================================
   SUNRISE / SUNSET
   ========================================================= */

function updateSunriseSunset(
    data
) {

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


    const elements =
        document.querySelectorAll(
            ".sun-times strong"
        );


    if (elements.length >= 2) {

        elements[0].textContent =
            sunrise;

        elements[1].textContent =
            sunset;

    }

}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(
    data
) {

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


    const summary =
        document.querySelector(
            ".summary-text"
        );


    if (!summary) {
        return;
    }


    summary.textContent =
        `Hari ini diperkirakan ${weather.description.toLowerCase()} dengan suhu ${min}°C hingga ${max}°C. Peluang hujan maksimum sekitar ${rain}%.`;

}


/* =========================================================
   WEATHER CODE
   ========================================================= */

function getWeatherInfo(
    code
) {

    const map = {

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
            description: "Gerimis Beku",
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
            description: "Hujan Beku",
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
        map[code] || {

            description:
                "Kondisi Tidak Diketahui",

            icon:
                "🌥️"

        }
    );

}


/* =========================================================
   WIND DIRECTION
   ========================================================= */

function degreesToCompass(
    degrees
) {

    if (
        degrees === null ||
        degrees === undefined
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
   FIND TIME INDEX
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
        new Date(
            targetTime
        ).getTime();


    let nearestIndex = 0;

    let nearestDifference =
        Infinity;


    times.forEach(
        (time, index) => {

            const value =
                new Date(
                    time
                ).getTime();


            const difference =
                Math.abs(
                    value - target
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
   NEAREST HOURLY VALUE
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
   FORMAT HOUR
   ========================================================= */

function formatHour(
    value
) {

    if (!value) {
        return "--:--";
    }


    const match =
        String(value).match(
            /T(\d{2}):(\d{2})/
        );


    if (!match) {
        return "--:--";
    }


    return `${match[1]}:${match[2]}`;

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    value
) {

    return formatHour(value);

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDateShort(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            `${value}T12:00:00`
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
   DAY NAME
   ========================================================= */

function getDayName(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(
            `${value}T12:00:00`
        );


    return date.toLocaleDateString(
        "id-ID",
        {
            weekday: "long"
        }
    );

}


/* =========================================================
   ROUND VALUE
   ========================================================= */

function roundValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        Number.isNaN(
            Number(value)
        )
    ) {

        return "—";

    }


    return Math.round(
        Number(value)
    );

}


/* =========================================================
   DATE
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
   DATA STATUS
   ========================================================= */

function updateDataStatus() {

    const element =
        document.getElementById(
            "updateText"
        );


    if (!element) {
        return;
    }


    element.textContent =
        `Diperbarui ${new Date().toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        )}`;

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    const items =
        document.querySelectorAll(
            ".nav-item, .mobile-nav-item"
        );


    items.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    items.forEach(
                        other => {

                            other.classList.remove(
                                "active"
                            );

                        }
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
   HOURLY SCROLL
   ========================================================= */

function setupHourlyScroll() {

    const container =
        document.querySelector(
            ".hourly-container"
        );


    if (!container) {
        return;
    }


    container.addEventListener(
        "wheel",
        event => {

            if (
                window.innerWidth <= 1100
            ) {

                container.scrollLeft +=
                    event.deltaY;

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
   AUTO REFRESH CUACA
   =========================================================

   Setiap 15 menit:
   - Tidak meminta GPS ulang
   - Menggunakan koordinat terakhir
   - Mengambil data cuaca terbaru

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
   DEBUG / CONSOLE
   ========================================================= */

window.CUACAKU = {

    coordinates:
        () => currentCoordinates,

    location:
        () => currentLocationData,

    weather:
        () => currentWeatherData,

    refresh:
        () => refreshWeather(),

    gps:
        () => requestLocation()

};


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   END
   ========================================================= */
