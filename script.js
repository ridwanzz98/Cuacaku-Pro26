/* =========================================================
   CUACAKU V1.0.0
   TAHAP 4
   GPS + MAP + REVERSE GEOCODING + WEATHER
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIG
    ===================================================== */

    const CONFIG = {
        weatherApi:
            "https://api.open-meteo.com/v1/forecast",

        locationApi:
            "https://api.bigdatacloud.net/data/reverse-geocode-client",

        language: "id",

        forecastDays: 7,

        gpsOptions: {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 300000
        },

        weatherRefreshInterval: 15 * 60 * 1000
    };


    /* =====================================================
       STATE
    ===================================================== */

    const state = {
        coordinates: null,
        location: null,
        weather: null,
        map: null,
        marker: null,
        accuracyCircle: null,
        weatherTimer: null,
        isLoadingLocation: false
    };


    /* =====================================================
       DOM
    ===================================================== */

    const $ = (selector) => document.querySelector(selector);

    const elements = {
        topLocation: $("#topLocation"),

        locationName: $("#locationName"),
        locationAddress: $("#locationAddress"),
        coordinates: $("#coordinates"),

        mapLocationName: $("#mapLocationName"),
        mapCoordinates: $("#mapCoordinates"),

        currentTemp: $("#currentTemp"),
        feelsLike: $("#feelsLike"),
        weatherDescription: $("#weatherDescription"),
        weatherIcon: $("#weatherIcon"),
        currentDate: $("#currentDate"),

        refreshButton: $("#refreshButton"),
        mobileRefresh: $("#mobileRefresh"),

        locationButton: $("#locationButton"),
        mobileLocationButton: $("#mobileLocationButton"),

        updateText: $("#updateText"),

        toast: $("#toast"),
        toastMessage: $("#toastMessage"),

        summaryText: $(".summary-text"),

        weatherMap: $("#weatherMap")
    };


    /* =====================================================
       WEATHER CODE
    ===================================================== */

    function getWeatherInfo(code) {

        const weather = {
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
                description: "Berawan",
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

        return weather[code] || {
            description: "Kondisi Tidak Diketahui",
            icon: "🌤️"
        };
    }


    /* =====================================================
       DATE
    ===================================================== */

    function formatDate(dateString) {

        const date = new Date(dateString);

        return new Intl.DateTimeFormat("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }


    function formatShortDate(dateString) {

        const date = new Date(dateString);

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "short"
        }).format(date);
    }


    function formatHour(dateString) {

        const date = new Date(dateString);

        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        }).format(date);
    }


    /* =====================================================
       WIND
    ===================================================== */

    function getWindDirection(degrees) {

        if (typeof degrees !== "number") {
            return "-";
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
            Math.round(degrees / 45) % 8;

        return directions[index];
    }


    /* =====================================================
       HTML SAFETY
    ===================================================== */

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer;

    function showToast(message, type = "success") {

        if (!elements.toast || !elements.toastMessage) {
            return;
        }

        elements.toastMessage.textContent = message;

        elements.toast.classList.add("show");

        if (type === "error") {
            elements.toast.classList.add("error");
        } else {
            elements.toast.classList.remove("error");
        }

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            elements.toast.classList.remove("show");
        }, 3500);
    }


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    function setLocationLoading(loading) {

        state.isLoadingLocation = loading;

        if (elements.locationButton) {

            if (loading) {

                elements.locationButton.disabled = true;

                elements.locationButton.innerHTML =
                    `<span>⟳</span> Mencari lokasi...`;

            } else {

                elements.locationButton.disabled = false;

                elements.locationButton.innerHTML =
                    `<span>⌖</span> Gunakan Lokasi Saya`;
            }
        }

        if (elements.mobileLocationButton) {
            elements.mobileLocationButton.disabled = loading;
        }
    }


    /* =====================================================
       INITIALIZE MAP
    ===================================================== */

    function initializeMap() {

        if (!elements.weatherMap) {
            console.warn("Elemen #weatherMap tidak ditemukan.");
            return;
        }

        if (typeof L === "undefined") {
            console.error(
                "Leaflet belum dimuat. Pastikan Leaflet JS ada sebelum script.js."
            );

            return;
        }

        /*
         * Posisi awal sementara.
         * Akan diganti ketika GPS berhasil.
         */

        const defaultPosition = [
            -2.5,
            118
        ];

        state.map = L.map(
            elements.weatherMap,
            {
                zoomControl: true,
                attributionControl: true
            }
        ).setView(defaultPosition, 5);


        /* TILE MAP */

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }
        ).addTo(state.map);


        /*
         * Marker belum dibuat.
         * Marker baru dibuat setelah GPS berhasil.
         */
    }


    /* =====================================================
       UPDATE MAP
    ===================================================== */

    function updateMap(latitude, longitude, accuracy) {

        if (!state.map) {
            return;
        }

        const position = [
            latitude,
            longitude
        ];


        /* MARKER */

        if (!state.marker) {

            state.marker = L.marker(position)
                .addTo(state.map);

        } else {

            state.marker.setLatLng(position);
        }


        /* ACCURACY CIRCLE */

        if (accuracy) {

            if (!state.accuracyCircle) {

                state.accuracyCircle =
                    L.circle(
                        position,
                        {
                            radius: accuracy,
                            weight: 1,
                            fillOpacity: 0.08
                        }
                    ).addTo(state.map);

            } else {

                state.accuracyCircle.setLatLng(position);

                state.accuracyCircle.setRadius(
                    accuracy
                );
            }
        }


        /*
         * Fokus ke lokasi GPS
         */

        state.map.setView(
            position,
            16,
            {
                animate: true
            }
        );


        /*
         * Popup marker
         */

        if (state.marker) {

            const accuracyText =
                accuracy
                    ? `Akurasi ±${Math.round(accuracy)} meter`
                    : "Akurasi GPS tidak tersedia";

            state.marker.bindPopup(
                `
                <div style="min-width:180px">
                    <strong>📍 Lokasi Anda</strong>
                    <br>
                    <small>
                        ${latitude.toFixed(6)},
                        ${longitude.toFixed(6)}
                    </small>
                    <br>
                    <small>${accuracyText}</small>
                </div>
                `
            );
        }
    }


    /* =====================================================
       REVERSE GEOCODING
    ===================================================== */

    async function reverseGeocode(latitude, longitude) {

        const url =
            `${CONFIG.locationApi}?latitude=${encodeURIComponent(latitude)}` +
            `&longitude=${encodeURIComponent(longitude)}` +
            `&localityLanguage=${CONFIG.language}`;


        const response =
            await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json"
                }
            });


        if (!response.ok) {
            throw new Error(
                `Reverse geocoding gagal (${response.status})`
            );
        }


        const data = await response.json();

        return parseLocation(data);
    }


    /* =====================================================
       PARSE LOCATION
    ===================================================== */

    function parseLocation(data) {

        const result = {
            village: "",
            district: "",
            regency: "",
            province: "",
            country: "",
            postcode: "",
            displayName: ""
        };


        /*
         * DATA UTAMA
         */

        result.province =
            data.principalSubdivision || "";


        result.country =
            data.countryName || "";


        result.postcode =
            data.postcode || "";


        /*
         * ADMINISTRATIVE HIERARCHY
         */

        const administrative =
            data?.localityInfo?.administrative || [];


        administrative.forEach(item => {

            const name =
                item?.name || "";

            const description =
                String(item?.description || "")
                    .toLowerCase();

            const adminLevel =
                Number(item?.adminLevel);


            /*
             * INDONESIA
             *
             * adminLevel dapat berbeda
             * tergantung data wilayah.
             */

            if (
                !result.district &&
                (
                    description.includes("district") ||
                    description.includes("kecamatan") ||
                    description.includes("subdistrict") ||
                    adminLevel === 6
                )
            ) {
                result.district = name;
            }


            if (
                !result.regency &&
                (
                    description.includes("regency") ||
                    description.includes("kabupaten") ||
                    description.includes("municipality") ||
                    description.includes("city") ||
                    adminLevel === 5
                )
            ) {
                result.regency = name;
            }


            if (
                !result.province &&
                (
                    description.includes("province") ||
                    description.includes("provinsi") ||
                    description.includes("state") ||
                    adminLevel === 4
                )
            ) {
                result.province = name;
            }
        });


        /*
         * FALLBACK LOCALITY
         */

        if (!result.village) {

            result.village =
                data.locality ||
                data.localityName ||
                data.city ||
                "";
        }


        /*
         * Jika Kabupaten belum ditemukan
         */

        if (!result.regency) {

            result.regency =
                data.city ||
                data.localityInfo?.administrative
                    ?.find(item => {

                        const description =
                            String(
                                item?.description || ""
                            ).toLowerCase();

                        return (
                            description.includes("regency") ||
                            description.includes("kabupaten")
                        );
                    })
                    ?.name ||
                "";
        }


        /*
         * Nama tampilan utama
         */

        result.displayName =
            result.village ||
            result.district ||
            result.regency ||
            result.province ||
            "Lokasi Anda";


        return result;
    }


    /* =====================================================
       DISPLAY LOCATION
    ===================================================== */

    function displayLocation(location) {

        state.location = location;


        /*
         * TOPBAR
         */

        if (elements.topLocation) {

            elements.topLocation.textContent =
                location.district
                    ? `Kec. ${location.district}`
                    : location.displayName;
        }


        /*
         * LOCATION CARD
         */

        if (elements.locationName) {

            elements.locationName.textContent =
                location.village ||
                location.displayName;
        }


        /*
         * ADDRESS
         */

        if (elements.locationAddress) {

            const addressParts = [];

            if (location.district) {
                addressParts.push(
                    `Kecamatan ${location.district}`
                );
            }

            if (location.regency) {
                addressParts.push(
                    location.regency
                );
            }

            if (location.province) {
                addressParts.push(
                    location.province
                );
            }

            elements.locationAddress.textContent =
                addressParts.length
                    ? addressParts.join(", ")
                    : "Lokasi berhasil ditemukan";
        }


        /*
         * MAP LOCATION NAME
         */

        if (elements.mapLocationName) {

            elements.mapLocationName.textContent =
                location.district
                    ? `Kecamatan ${location.district}`
                    : location.displayName;
        }
    }


    /* =====================================================
       DISPLAY COORDINATES
    ===================================================== */

    function displayCoordinates(
        latitude,
        longitude,
        accuracy
    ) {

        const coordinateText =
            `Latitude ${latitude.toFixed(6)} • Longitude ${longitude.toFixed(6)}`;


        if (elements.coordinates) {

            elements.coordinates.textContent =
                accuracy
                    ? `${coordinateText} • Akurasi ±${Math.round(accuracy)} m`
                    : coordinateText;
        }


        if (elements.mapCoordinates) {

            elements.mapCoordinates.textContent =
                coordinateText;
        }
    }


    /* =====================================================
       GET GPS
    ===================================================== */

    function getGPSPosition() {

        return new Promise(
            (resolve, reject) => {

                if (!navigator.geolocation) {

                    reject(
                        new Error(
                            "Browser tidak mendukung GPS."
                        )
                    );

                    return;
                }


                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    CONFIG.gpsOptions
                );
            }
        );
    }


    /* =====================================================
       LOAD LOCATION
    ===================================================== */

    async function loadLocation() {

        if (state.isLoadingLocation) {
            return;
        }

        setLocationLoading(true);


        try {

            showToast(
                "Meminta izin dan mencari lokasi GPS..."
            );


            const position =
                await getGPSPosition();


            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            state.coordinates = {
                latitude,
                longitude,
                accuracy
            };


            /*
             * UPDATE MAP SECEPATNYA
             */

            updateMap(
                latitude,
                longitude,
                accuracy
            );


            displayCoordinates(
                latitude,
                longitude,
                accuracy
            );


            /*
             * REVERSE GEOCODING
             */

            if (elements.topLocation) {
                elements.topLocation.textContent =
                    "Mencari nama wilayah...";
            }


            const location =
                await reverseGeocode(
                    latitude,
                    longitude
                );


            displayLocation(location);


            /*
             * LOAD WEATHER
             */

            await loadWeather(
                latitude,
                longitude
            );


            showToast(
                "Lokasi dan cuaca berhasil diperbarui."
            );


        } catch (error) {

            console.error(
                "CUACAKU Location Error:",
                error
            );


            let message =
                "Gagal mendapatkan lokasi.";


            if (error.code === 1) {

                message =
                    "Izin lokasi ditolak. Aktifkan izin lokasi pada browser.";

            } else if (error.code === 2) {

                message =
                    "Lokasi tidak tersedia. Pastikan GPS/perangkat lokasi aktif.";

            } else if (error.code === 3) {

                message =
                    "Waktu pencarian lokasi habis. Coba lagi.";

            } else if (
                error.message &&
                error.message.includes("Reverse")
            ) {

                message =
                    "GPS berhasil, tetapi nama wilayah belum dapat ditemukan.";
            }


            showToast(
                message,
                "error"
            );


        } finally {

            setLocationLoading(false);
        }
    }


    /* =====================================================
       WEATHER API
    ===================================================== */

    async function loadWeather(
        latitude,
        longitude
    ) {

        const params = new URLSearchParams({

            latitude: latitude,

            longitude: longitude,

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
                ].join(","),

            timezone: "auto",

            temperature_unit: "celsius",

            wind_speed_unit: "kmh",

            precipitation_unit: "mm",

            forecast_days:
                CONFIG.forecastDays
        });


        const response =
            await fetch(
                `${CONFIG.weatherApi}?${params.toString()}`
            );


        if (!response.ok) {

            throw new Error(
                `Weather API gagal (${response.status})`
            );
        }


        const data =
            await response.json();


        state.weather = data;


        updateCurrentWeather(data);

        updateHourlyForecast(data);

        updateDailyForecast(data);

        updateSunTimes(data);

        updateSummary(data);

        updateStats(data);


        updateLastUpdate();


        return data;
    }


    /* =====================================================
       CURRENT WEATHER
    ===================================================== */

    function updateCurrentWeather(data) {

        const current =
            data.current;

        if (!current) {
            return;
        }


        const info =
            getWeatherInfo(
                current.weather_code
            );


        /*
         * TEMPERATURE
         */

        if (elements.currentTemp) {

            elements.currentTemp.innerHTML =
                `${Math.round(current.temperature_2m)}<span>°C</span>`;
        }


        /*
         * DESCRIPTION
         */

        if (elements.weatherDescription) {

            elements.weatherDescription.textContent =
                info.description;
        }


        /*
         * ICON
         */

        if (elements.weatherIcon) {

            elements.weatherIcon.textContent =
                info.icon;
        }


        /*
         * FEELS LIKE
         */

        if (elements.feelsLike) {

            elements.feelsLike.textContent =
                `${Math.round(current.apparent_temperature)}°C`;
        }


        /*
         * DATE
         */

        if (elements.currentDate) {

            elements.currentDate.textContent =
                formatDate(current.time);
        }
    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats(data) {

        const current =
            data.current;

        const hourly =
            data.hourly;


        const statCards =
            document.querySelectorAll(".stat-card");


        if (!statCards.length) {
            return;
        }


        /*
         * SUHU
         */

        if (statCards[0]) {

            const value =
                Math.round(
                    current.temperature_2m
                );

            const valueEl =
                statCards[0].querySelector(
                    ".stat-value"
                );

            const descEl =
                statCards[0].querySelector("p");

            if (valueEl) {
                valueEl.innerHTML =
                    `${value}<span>°C</span>`;
            }

            if (descEl) {
                descEl.textContent =
                    "Suhu udara saat ini";
            }
        }


        /*
         * KELEMBAPAN
         */

        if (statCards[1]) {

            const value =
                Math.round(
                    current.relative_humidity_2m
                );

            const valueEl =
                statCards[1].querySelector(
                    ".stat-value"
                );

            const descEl =
                statCards[1].querySelector("p");

            if (valueEl) {
                valueEl.innerHTML =
                    `${value}<span>%</span>`;
            }

            if (descEl) {
                descEl.textContent =
                    "Kelembapan udara";
            }
        }


        /*
         * ANGIN
         */

        if (statCards[2]) {

            const wind =
                Math.round(
                    current.wind_speed_10m
                );

            const direction =
                getWindDirection(
                    current.wind_direction_10m
                );

            const valueEl =
                statCards[2].querySelector(
                    ".stat-value"
                );

            const descEl =
                statCards[2].querySelector("p");

            if (valueEl) {
                valueEl.innerHTML =
                    `${wind}<span> km/j</span>`;
            }

            if (descEl) {
                descEl.textContent =
                    `Arah ${direction}`;
            }
        }


        /*
         * PELUANG HUJAN
         *
         * Ambil jam terdekat
         */

        if (statCards[3] && hourly) {

            const precipitationProbability =
                hourly
                    .precipitation_probability?.[0] ?? 0;

            const valueEl =
                statCards[3].querySelector(
                    ".stat-value"
                );

            const descEl =
                statCards[3].querySelector("p");

            if (valueEl) {
                valueEl.innerHTML =
                    `${Math.round(precipitationProbability)}<span>%</span>`;
            }

            if (descEl) {
                descEl.textContent =
                    "Peluang hujan";
            }
        }
    }


    /* =====================================================
       HOURLY FORECAST
    ===================================================== */

    function updateHourlyForecast(data) {

        const container =
            document.querySelector(
                ".hourly-container"
            );


        if (!container || !data.hourly) {
            return;
        }


        const hourly =
            data.hourly;


        const now =
            new Date();


        let startIndex =
            hourly.time.findIndex(
                time =>
                    new Date(time) >= now
            );


        if (startIndex < 0) {
            startIndex = 0;
        }


        /*
         * Tampilkan 8 jam
         */

        const count = 8;


        container.innerHTML = "";


        for (
            let i = startIndex;
            i < Math.min(
                startIndex + count,
                hourly.time.length
            );
            i++
        ) {

            const info =
                getWeatherInfo(
                    hourly.weather_code[i]
                );


            const time =
                formatHour(
                    hourly.time[i]
                );


            const temperature =
                Math.round(
                    hourly.temperature_2m[i]
                );


            const rain =
                Math.round(
                    hourly
                        .precipitation_probability[i] ?? 0
                );


            const article =
                document.createElement("article");


            article.className =
                `hour-card${i === startIndex ? " active" : ""}`;


            article.innerHTML = `
                <span>${escapeHTML(time)}</span>
                <strong>${info.icon}</strong>
                <b>${temperature}°</b>
                <small>${rain}%</small>
            `;


            container.appendChild(article);
        }
    }


    /* =====================================================
       DAILY FORECAST
    ===================================================== */

    function updateDailyForecast(data) {

        const container =
            document.querySelector(
                ".forecast-list"
            );


        if (!container || !data.daily) {
            return;
        }


        const daily =
            data.daily;


        container.innerHTML = "";


        for (
            let i = 0;
            i < daily.time.length;
            i++
        ) {

            const info =
                getWeatherInfo(
                    daily.weather_code[i]
                );


            const max =
                Math.round(
                    daily.temperature_2m_max[i]
                );


            const min =
                Math.round(
                    daily.temperature_2m_min[i]
                );


            const rain =
                Math.round(
                    daily
                        .precipitation_probability_max[i] ?? 0
                );


            const article =
                document.createElement("article");


            article.className =
                `forecast-card${i === 0 ? " today" : ""}`;


            const dayName =
                i === 0
                    ? "Hari Ini"
                    : new Intl.DateTimeFormat(
                        "id-ID",
                        {
                            weekday: "long"
                        }
                    ).format(
                        new Date(daily.time[i])
                    );


            article.innerHTML = `
                <div class="forecast-day">
                    <strong>${escapeHTML(dayName)}</strong>
                    <span>${escapeHTML(formatShortDate(daily.time[i]))}</span>
                </div>

                <div class="forecast-condition">
                    <span>${info.icon}</span>
                    <strong>${escapeHTML(info.description)}</strong>
                </div>

                <div class="forecast-rain">
                    <span>💧</span>
                    <strong>${rain}%</strong>
                </div>

                <div class="forecast-temp">
                    <strong>${max}°</strong>
                    <span>${min}°</span>
                </div>
            `;


            container.appendChild(article);
        }
    }


    /* =====================================================
       SUNRISE & SUNSET
    ===================================================== */

    function updateSunTimes(data) {

        const sunrise =
            data.daily?.sunrise?.[0];

        const sunset =
            data.daily?.sunset?.[0];


        const sunTimes =
            document.querySelector(
                ".sun-times"
            );


        if (!sunTimes) {
            return;
        }


        const values =
            sunTimes.querySelectorAll(
                "strong"
            );


        if (values[0] && sunrise) {

            values[0].textContent =
                formatHour(sunrise);
        }


        if (values[1] && sunset) {

            values[1].textContent =
                formatHour(sunset);
        }
    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function updateSummary(data) {

        if (!elements.summaryText) {
            return;
        }


        const daily =
            data.daily;


        if (!daily) {
            return;
        }


        const max =
            Math.round(
                daily.temperature_2m_max[0]
            );


        const min =
            Math.round(
                daily.temperature_2m_min[0]
            );


        const rain =
            Math.round(
                daily
                    .precipitation_probability_max[0] ?? 0
            );


        const weather =
            getWeatherInfo(
                daily.weather_code[0]
            );


        let rainText;


        if (rain >= 70) {

            rainText =
                "potensi hujan cukup tinggi";

        } else if (rain >= 40) {

            rainText =
                "terdapat potensi hujan";

        } else {

            rainText =
                "potensi hujan relatif rendah";
        }


        elements.summaryText.textContent =
            `Hari ini diperkirakan ${weather.description.toLowerCase()} ` +
            `dengan suhu sekitar ${min}°C hingga ${max}°C. ` +
            `Peluang hujan maksimum sekitar ${rain}%, sehingga ${rainText}.`;
    }


    /* =====================================================
       UPDATE STATUS
    ===================================================== */

    function updateLastUpdate() {

        if (!elements.updateText) {
            return;
        }


        const now =
            new Date();


        elements.updateText.textContent =
            `Diperbarui ${new Intl.DateTimeFormat(
                "id-ID",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            ).format(now)}`;
    }


    /* =====================================================
       REFRESH WEATHER
    ===================================================== */

    async function refreshWeather() {

        if (
            !state.coordinates ||
            state.isLoadingLocation
        ) {

            await loadLocation();

            return;
        }


        try {

            showToast(
                "Memperbarui data cuaca..."
            );


            await loadWeather(
                state.coordinates.latitude,
                state.coordinates.longitude
            );


            showToast(
                "Data cuaca berhasil diperbarui."
            );


        } catch (error) {

            console.error(
                "Weather refresh error:",
                error
            );


            showToast(
                "Gagal memperbarui data cuaca.",
                "error"
            );
        }
    }


    /* =====================================================
       AUTO WEATHER REFRESH
    ===================================================== */

    function startAutoRefresh() {

        clearInterval(
            state.weatherTimer
        );


        state.weatherTimer =
            setInterval(
                async () => {

                    if (
                        state.coordinates &&
                        !state.isLoadingLocation
                    ) {

                        try {

                            await loadWeather(
                                state.coordinates.latitude,
                                state.coordinates.longitude
                            );

                        } catch (error) {

                            console.error(
                                "Auto refresh error:",
                                error
                            );
                        }
                    }

                },
                CONFIG.weatherRefreshInterval
            );
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        /*
         * DESKTOP LOCATION
         */

        if (elements.locationButton) {

            elements.locationButton.addEventListener(
                "click",
                loadLocation
            );
        }


        /*
         * MOBILE LOCATION
         */

        if (elements.mobileLocationButton) {

            elements.mobileLocationButton.addEventListener(
                "click",
                loadLocation
            );
        }


        /*
         * DESKTOP REFRESH
         */

        if (elements.refreshButton) {

            elements.refreshButton.addEventListener(
                "click",
                refreshWeather
            );
        }


        /*
         * MOBILE REFRESH
         */

        if (elements.mobileRefresh) {

            elements.mobileRefresh.addEventListener(
                "click",
                refreshWeather
            );
        }
    }


    /* =====================================================
       DEBUG API
    ===================================================== */

    window.CUACAKU = {

        coordinates: () =>
            state.coordinates,

        location: () =>
            state.location,

        weather: () =>
            state.weather,

        map: () =>
            state.map,

        refresh: refreshWeather,

        gps: loadLocation
    };


    /* =====================================================
       INIT
    ===================================================== */

    function init() {

        initializeMap();

        setupEvents();

        startAutoRefresh();


        /*
         * Jangan meminta GPS otomatis.
         *
         * Pengguna menekan:
         * "Gunakan Lokasi Saya"
         */

        console.log(
            "🌦️ CUACAKU V1.0.0 — Tahap 4 aktif."
        );
    }


    /*
     * DOM READY
     */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();
    }

})();
