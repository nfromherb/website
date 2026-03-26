import { IpcMain } from 'electron'
import axios from 'axios'
import { WeatherData, WeatherCondition, HourlyWeather } from '../../shared/types'
import { getSettings } from '../storage'

// WMO Weather interpretation codes → emoji + label
function interpretCode(code: number): WeatherCondition {
  const map: Record<number, [string, string]> = {
    0: ['Clear sky', '☀️'],
    1: ['Mainly clear', '🌤️'],
    2: ['Partly cloudy', '⛅'],
    3: ['Overcast', '☁️'],
    45: ['Foggy', '🌫️'],
    48: ['Icy fog', '🌫️'],
    51: ['Light drizzle', '🌦️'],
    53: ['Drizzle', '🌦️'],
    55: ['Heavy drizzle', '🌧️'],
    61: ['Light rain', '🌧️'],
    63: ['Rain', '🌧️'],
    65: ['Heavy rain', '🌧️'],
    71: ['Light snow', '🌨️'],
    73: ['Snow', '❄️'],
    75: ['Heavy snow', '❄️'],
    80: ['Rain showers', '🌦️'],
    81: ['Showers', '🌧️'],
    82: ['Violent showers', '⛈️'],
    95: ['Thunderstorm', '⛈️'],
    96: ['Thunderstorm w/ hail', '⛈️'],
    99: ['Thunderstorm w/ heavy hail', '⛈️']
  }
  const [label, emoji] = map[code] || ['Unknown', '🌡️']
  return { code, label, emoji }
}

async function getCoordinates(city: string): Promise<{ lat: number; lon: number }> {
  const res = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
    params: { name: city, count: 1, language: 'en', format: 'json' },
    timeout: 10000
  })
  const result = res.data?.results?.[0]
  if (!result) throw new Error(`City not found: ${city}`)
  return { lat: result.latitude, lon: result.longitude }
}

export function registerWeatherHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('weather:fetch', async (_event, { lat, lon } = {}) => {
    try {
      const settings = getSettings()

      let finalLat = lat ?? settings.weatherLat
      let finalLon = lon ?? settings.weatherLon

      // If no coordinates, try to geocode city name
      if (!finalLat || !finalLon) {
        const coords = await getCoordinates(settings.weatherCity || 'New York')
        finalLat = coords.lat
        finalLon = coords.lon
      }

      const res = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: finalLat,
          longitude: finalLon,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
          hourly: 'temperature_2m,weather_code',
          temperature_unit: 'celsius',
          wind_speed_unit: 'kmh',
          forecast_days: 1,
          timezone: 'auto'
        },
        timeout: 10000
      })

      const cur = res.data.current
      const hourly = res.data.hourly

      const hourlyData: HourlyWeather[] = hourly.time.slice(0, 12).map((time: string, i: number) => ({
        time,
        tempC: Math.round(hourly.temperature_2m[i]),
        condition: interpretCode(hourly.weather_code[i])
      }))

      const weather: WeatherData = {
        city: settings.weatherCity || 'Your Location',
        tempC: Math.round(cur.temperature_2m),
        tempF: Math.round((cur.temperature_2m * 9) / 5 + 32),
        feelsLikeC: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        windKph: Math.round(cur.wind_speed_10m),
        condition: interpretCode(cur.weather_code),
        hourly: hourlyData
      }

      return { ok: true, data: weather }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })
}
