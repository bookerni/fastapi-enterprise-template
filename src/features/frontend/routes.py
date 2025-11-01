"""Frontend routes for serving HTML pages."""
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

# Initialize templates
templates_dir = Path(__file__).parent.parent.parent / "templates"
templates = Jinja2Templates(directory=str(templates_dir))

router = APIRouter(tags=["Frontend"])


@router.get("/", response_class=HTMLResponse, include_in_schema=False)
async def index(request: Request):
    """Redirect to dashboard or login."""
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/login", response_class=HTMLResponse, include_in_schema=False)
async def login_page(request: Request):
    """Login page."""
    return templates.TemplateResponse("login.html", {"request": request})


@router.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
async def dashboard(request: Request):
    """Dashboard page."""
    return templates.TemplateResponse("dashboard.html", {"request": request})


@router.get("/users", response_class=HTMLResponse, include_in_schema=False)
async def users_list(request: Request):
    """Users management page."""
    return templates.TemplateResponse("users/list.html", {"request": request})


@router.get("/groups", response_class=HTMLResponse, include_in_schema=False)
async def groups_list(request: Request):
    """Groups management page."""
    return templates.TemplateResponse("groups/list.html", {"request": request})


@router.get("/roles", response_class=HTMLResponse, include_in_schema=False)
async def roles_list(request: Request):
    """Roles management page."""
    return templates.TemplateResponse("roles/list.html", {"request": request})
