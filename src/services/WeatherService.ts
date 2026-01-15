const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || ''; // Reemplazar con clave real

export interface WeatherData {
    temp: number;
    condition: string;
    description: string;
    icon: string;
    wind: number;
    humidity: number;
}

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
    // Si no hay API key, devolvemos un mock pero con estructura real
    if (!API_KEY) {
        return {
            temp: 22,
            condition: 'Nublado',
            description: 'nubes dispersas',
            icon: '03d',
            wind: 12,
            humidity: 65
        };
    }

    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
        const data = await response.json();

        return {
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            description: data.weather[0].description,
            icon: data.weather[0].icon,
            wind: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
            humidity: data.main.humidity
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        throw error;
    }
};
