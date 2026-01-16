
// OpenMeteo no requiere API Key
const API_KEY = '';

export interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    icon: string;
    wind: number;
    humidity: number;
}

// Mapa simple de códigos WMO a condiciones locales
const getConditionFromWMO = (code: number) => {
    if (code === 0) return { condition: 'Despejado', icon: '01d', desc: 'cielo claro' };
    if (code >= 1 && code <= 3) return { condition: 'Nublado', icon: '03d', desc: 'parcialmente nublado' };
    if (code >= 45 && code <= 48) return { condition: 'Niebla', icon: '50d', desc: 'bancos de niebla' };
    if (code >= 51 && code <= 67) return { condition: 'Lluvia', icon: '09d', desc: 'lluvia ligera' };
    if (code >= 71 && code <= 77) return { condition: 'Nieve', icon: '13d', desc: 'nieve ligera' };
    if (code >= 80 && code <= 82) return { condition: 'Lluvia', icon: '10d', desc: 'chubascos' };
    if (code >= 95) return { condition: 'Tormenta', icon: '11d', desc: 'tormenta eléctrica' };
    return { condition: 'Variable', icon: '02d', desc: 'clima variable' };
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh`
        );
        const data = await response.json();
        const current = data.current;
        const weatherInfo = getConditionFromWMO(current.weather_code);

        return {
            temp: Math.round(current.temperature_2m),
            condition: weatherInfo.condition,
            description: weatherInfo.desc,
            icon: weatherInfo.icon,
            wind: Math.round(current.wind_speed_10m),
            humidity: current.relative_humidity_2m
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        // Fallback gracioso si falla la red
        return {
            temp: 20,
            condition: 'Sin Datos',
            description: 'no disponible',
            icon: '03d',
            wind: 0,
            humidity: 0
        };
    }
};
