"""
Infrastructure router — CRUD operations, filters, GeoJSON export.
"""

from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.dependencies.auth import RequireRole, get_current_user
from app.models.infrastructure import Infrastructure
from app.models.user import User
from app.schemas.infrastructure import (
    InfrastructureCreate,
    InfrastructureResponse,
    InfrastructureUpdate,
)

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure"])

@router.get("", response_model=list[InfrastructureResponse])
async def list_infrastructure(
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = Query(None, description="Filter by asset type (bridge, dam, hospital, road)"),
    status: str | None = Query(None, description="Filter by current_status"),
    search: str | None = Query(None, description="Search by name or category"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Retrieve all infrastructure assets stored in PostGIS database."""
    stmt = select(Infrastructure).where(Infrastructure.is_deleted == False)
    
    if type:
        stmt = stmt.where(Infrastructure.type == type)
    if status:
        stmt = stmt.where(Infrastructure.current_status == status)
    if search:
        stmt = stmt.where(
            or_(
                Infrastructure.name.ilike(f"%{search}%"),
                Infrastructure.category.ilike(f"%{search}%"),
            )
        )
        
    stmt = stmt.offset(skip).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/geojson")
async def get_infrastructure_geojson(
    db: Annotated[AsyncSession, Depends(get_db)],
    type: str | None = None,
):
    """Export infrastructure assets as GeoJSON FeatureCollection for MapLibre / Leaflet."""
    stmt = select(Infrastructure).where(Infrastructure.is_deleted == False)
    if type:
        stmt = stmt.where(Infrastructure.type == type)
        
    res = await db.execute(stmt)
    assets = res.scalars().all()

    features = []
    for a in assets:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [a.longitude, a.latitude]
            },
            "properties": {
                "id": str(a.id),
                "name": a.name,
                "type": a.type,
                "category": a.category,
                "condition": a.current_status,
                "risk_score": a.risk_score or 30.0,
                "health_score": a.health_score or 70.0,
                "construction_year": a.construction_year,
                "material": a.material,
                "description": a.description,
                "simulated": False,
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }


@router.get("/{asset_id}", response_model=InfrastructureResponse)
async def get_infrastructure_by_id(
    asset_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Retrieve detailed information for a single infrastructure asset."""
    res = await db.execute(select(Infrastructure).where(Infrastructure.id == asset_id, Infrastructure.is_deleted == False))
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Infrastructure asset not found")
    return asset


@router.post("", response_model=InfrastructureResponse, status_code=status.HTTP_201_CREATED)
async def create_infrastructure(
    req: InfrastructureCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(RequireRole(["Admin", "Field Officer"])),
):
    """Create a new infrastructure asset (Admin or Field Officer only)."""
    asset = Infrastructure(
        name=req.name,
        type=req.type,
        category=req.category,
        district=req.district,
        taluka=req.taluka,
        village=req.village,
        latitude=req.latitude,
        longitude=req.longitude,
        construction_year=req.construction_year,
        material=req.material,
        description=req.description,
        owner=req.owner,
        current_status="operational",
        risk_score=25.0,
        health_score=85.0,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.put("/{asset_id}", response_model=InfrastructureResponse)
async def update_infrastructure(
    asset_id: UUID,
    req: InfrastructureUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(RequireRole(["Admin", "Field Officer"])),
):
    """Update an infrastructure asset (Admin or Field Officer only)."""
    res = await db.execute(select(Infrastructure).where(Infrastructure.id == asset_id, Infrastructure.is_deleted == False))
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Infrastructure asset not found")

    update_data = req.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    await db.commit()
    await db.refresh(asset)
    return asset


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_infrastructure(
    asset_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: User = Depends(RequireRole(["Admin"])),
):
    """Soft delete an infrastructure asset (Admin only)."""
    res = await db.execute(select(Infrastructure).where(Infrastructure.id == asset_id, Infrastructure.is_deleted == False))
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Infrastructure asset not found")

    asset.is_deleted = True
    await db.commit()
