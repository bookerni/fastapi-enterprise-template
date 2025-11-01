from fastapi import APIRouter

from src.features.admin.api import router as admin_router


def register_v1_router() -> APIRouter:
    root_router = APIRouter()
    # Register admin routes without additional prefix for easier frontend access
    root_router.include_router(admin_router, tags=["Admin"])
    return root_router


router = register_v1_router()
