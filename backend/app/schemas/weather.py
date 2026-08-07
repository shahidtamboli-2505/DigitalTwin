"""
Weather schemas.
"""

from pydantic import BaseModel


class CurrentWeatherResponse(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    wind_direction: float | None = None
    rainfall: float
    pressure: float | None = None
    description: str | None = None
    location: str = "Sangli"
    timestamp: str


class WeatherForecastDay(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    rainfall_probability: float
    rainfall_mm: float
    humidity: float
    wind_speed: float
    description: str | None = None


class WeatherForecastResponse(BaseModel):
    location: str = "Sangli"
    days: list[WeatherForecastDay]
