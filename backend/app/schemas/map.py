"""
Map schemas — GeoJSON responses, layer config.
"""

from pydantic import BaseModel


class MapLayerResponse(BaseModel):
    name: str
    label: str
    type: str  # point, line, polygon, heatmap
    visible: bool = True
    color: str | None = None


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict
    properties: dict


class GeoJSONResponse(BaseModel):
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]


class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    display_name: str
    place_id: str | None = None


class NearbyQuery(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 10.0
    type: str | None = None
