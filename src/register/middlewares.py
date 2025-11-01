import time
import uuid
from dataclasses import dataclass

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from src.core.utils.context import locale_ctx, request_id_ctx


def parse_accept_language(accept_language: str) -> str:
    """
    Parse Accept-Language header and return normalized locale.
    
    Args:
        accept_language: The Accept-Language header value (e.g., 'zh-CN,zh;q=0.9,en;q=0.8')
    
    Returns:
        Normalized locale string ('zh_CN' or 'en_US')
    """
    if not accept_language:
        return "en_US"
    
    # Get the first language (highest priority)
    lang = accept_language.split(',')[0].split(';')[0].strip()
    
    # Normalize to application-supported format
    if lang.startswith('zh'):
        return "zh_CN"
    else:
        return "en_US"


@dataclass
class RequestMiddleware(BaseHTTPMiddleware):
    app: ASGIApp
    csv_mime: str = "text/csv"
    time_header = "x-request-time"
    id_header = "x-request-id"

    async def dispatch_func(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        start_time = time.time()
        request_id = str(uuid.uuid4())
        request_id_ctx.set(request_id)
        locale_ctx.set(parse_accept_language(request.headers.get(locale_ctx.name, "")))
        response = await call_next(request)
        response.headers[self.id_header] = request_id
        response.headers[self.time_header] = str(time.time() - start_time)

        return response
