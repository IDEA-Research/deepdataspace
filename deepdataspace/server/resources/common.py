"""
deepdataspace.server.resources.common

Convenient functions and classes for RESTful resources.
"""
import logging
import time
from typing import List
from typing import Union

from rest_framework.authentication import BaseAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.views import exception_handler

from deepdataspace.constants import UserStatus
from deepdataspace.model.user import User
from deepdataspace.model.user import UserToken

logger = logging.getLogger("django")


def format_response(data: dict, status: int = 200, code: int = 0, msg: str = "success",
                    enable_cache: bool = False) -> Response:
    """
    Generate a formatted json response with given data.
    :param data: the data to be returned.
    :param status: http status code for this response, usually 200 for this function.
    :param code: err code, usually 0 for success.
    :param msg: err message, usually "success" for success.
    :param enable_cache: can this response be cached by browser.
    :return: A formatted JsonResponse object
    """

    formatted_data = {
        "code"   : code,
        "message": msg,
        "data"   : data
    }

    headers = {
        "Cache-Control": "no-store"
    }
    if enable_cache is True:
        headers.pop("Cache-Control")

    rsp = Response(data=formatted_data, status=status, content_type="application/json", headers=headers)
    return rsp


class APIException(Exception):
    def __init__(self, code: int, msg: str, http_status: int = 200):
        """
        A custom exception class, which can be raised anywhere in the code, and will be handled by django drf.
        This avoids try-catch layer by layer in deep function calls.
        Before this works, you need to set drf to use resource.common.handle_api_exception as exception handler.

        :param code: the error code in json response.
        :param msg: the error message in json response.
        :param http_status: the http status_code
        """
        self._code = code
        self._msg = msg
        self._http_status = http_status

    def to_json_rsp(self) -> Response:
        """
        Generate a Json Response.

        :return: Response
        """
        return format_response(data={}, status=self._http_status, code=self._code, msg=self._msg)


def raise_exception(code: int, msg: str, status: int = None):
    """
    Use this function to raise APIException anywhere in the code and return a json response to client directly.

    :param code: the err code in json response
    :param msg: the error message in json response
    :param status: the http status_code for json response, default to err code.

    :return: None
    """
    logger.error(msg)

    # if status is None, then set status by code
    if status is None and 200 <= code <= 599:
        status = code
    raise APIException(code, msg, status)


def handle_api_exception(exc: Exception, context) -> Response:
    """
    Catch APIException and return a json response.

    :param exc: The exception raised.
    :param context: The exception context.
    :return: A formatted json response.
    """
    if isinstance(exc, APIException):
        return exc.to_json_rsp()
    else:
        return exception_handler(exc, context)


class Argument:
    """
    An argument for a request.
    This helps parse incoming request data.
    If parse fails, this will raise an APIException directly.
    """

    JSON = "json" # argument should be parsed in json body
    QUERY = "query" # argument should be parsed in query string
    _LOCATION_ALL = [JSON, QUERY]

    class _PositiveInt:
        """
        This represents a positive integer argument.
        """

        def __call__(self, val):
            val = int(val)
            if val <= 0:
                raise ValueError(f"{val} is not a positive integer")
            return val

        def __str__(self):
            return "PositiveInt"

    class _NonNegativeInt:
        """
        This represents a non-negative integer argument.
        """

        def __call__(self, val):
            val = int(val)
            if val < 0:
                raise ValueError(f"{val} is not a non-negative integer")
            return val

        def __str__(self):
            return "NonNegativeInt"

    class Choice:
        """
        This represents a choice argument.
        The value of this argument must be one of the specified choices.
        """

        def __init__(self, choices: Union[list, set], converter=None):
            self.choices = set(choices)
            self.converter = converter

        def __call__(self, val):
            try:
                val = self.converter(val) if self.converter is not None else val
            except Exception:
                raise ValueError(f"{val} is not a valid value")

            if val not in self.choices:
                raise ValueError(f"{val} must be a choice of {self.choices}")
            return val

        def __str__(self):
            return f"choice of {self.choices}"

    PositiveInt = _PositiveInt()
    NonNegativeInt = _NonNegativeInt()

    def __init__(self, name: str, type_: callable, location: str, required: bool = False, default=None):
        """
        Define an argument for a request, tell the parser how to parse this argument.

        :param name: The name of this argument, used to get value from request data.
        :param type_: The type of argument, must be a callable.
                      This will be used to format incoming data, like int(val).
                      If the callable raise error, a 400 response will be sent to client directly.
        :param location: Where this argument should be parsed from, the post json or query string.
        :param required: Is this argument optional? If so, the default value will be used if the argument is not found.
        :param default: The default value for this argument.
        """

        if location not in Argument._LOCATION_ALL:
            raise ValueError(f"argument location error: {location} is not one of {Argument._LOCATION_ALL}")
        if default is not None:
            try:
                default = type_(default)
            except Exception as err:
                raise TypeError(f"failed to parse default value[{default}] by type[{type_}], err={str(err)}")

        self.name = name
        self.type = type_
        self.location = location
        self.required = required
        self.default = default


def parse_arguments(request, arguments: List[Argument]):
    """
    A help function to parse arguments from request data.
    """

    args = []
    for arg in arguments:
        if arg.location == Argument.JSON:
            val = request.data.get(arg.name, None)
        elif arg.location == Argument.QUERY:
            val = request.query_params.get(arg.name, None)
        else:
            raise ValueError(f"argument location error: {arg.location} is not one of {Argument._LOCATION_ALL}")

        if val is None:  # the argument is not found
            if arg.default is not None:  # use the default value if it is not None
                args.append(arg.default)
            elif arg.required is True:  # raise an 400 exception if the argument is required
                raise_exception(400, f"field[{arg.name}] is required")
            else:  # no default value, not required, just use None as argument value
                args.append(None)
        else:  # the argument is found, try to parse it
            try:
                val = arg.type(val)
            except Exception as err:
                logger.info(err)
                raise_exception(400, f"field[{arg.name}] is not of expected type, it must be a/an {arg.type}")
            else:
                args.append(val)

    return args


class TokenAuthentication(BaseAuthentication):
    """
    An authentication class for drf based on UserToken.
    """

    def authenticate(self, request):
        token = request.META.get("HTTP_TOKEN", None)
        if token is None:
            raise_exception(401, "unauthorized", 401)

        token = UserToken.find_one({"id": token})
        if token is None:
            raise_exception(401, "unauthorized", 401)

        ts = int(time.time())
        if ts >= token.expire:
            raise_exception(401, "unauthorized", 401)

        user = User.find_one({"id": token.user_id})
        if user is None or user.status != UserStatus.Active:
            raise_exception(401, "unauthorized", 401)

        user.refresh_token(token.id)
        return user, token


class BaseAPIView(APIView):
    """
    Base class for all api views.
    """
    pass


class AuthenticatedAPIView(BaseAPIView):
    """
    Base class for all authenticated api views.
    """
    authentication_classes = [TokenAuthentication]
