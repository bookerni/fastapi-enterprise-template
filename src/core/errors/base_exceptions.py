from typing import Any, NamedTuple


class ErrorCode(NamedTuple):
    error: int
    message: str
    details: list[Any] | None = None

    def dict(self):  # noqa: ANN201
        return self._asdict()


ERR_404 = ErrorCode(404, "app.not_found")
ERR_409 = ErrorCode(409, "app.already_exist")
ERR_500 = ErrorCode(500, "app.internal_server_error")
ERR_10001 = ErrorCode(10001, "auth.password_cannot_be_null")
ERR_10002 = ErrorCode(10002, "auth.invalid_bearer_token")
ERR_10003 = ErrorCode(10003, "auth.token_expired")
ERR_10004 = ErrorCode(10004, "auth.invalid_refresh_token")
ERR_10005 = ErrorCode(10005, "auth.permission_denied")
ERR_10006 = ErrorCode(10006, "auth.update_password_cannot_be_null")
