"""
deepdataspace.server.resources.api_v1.login

The login and logout RESTful APIs.
"""

import logging

from deepdataspace.model.user import User
from deepdataspace.server.resources.common import Argument
from deepdataspace.server.resources.common import AuthenticatedAPIView
from deepdataspace.server.resources.common import BaseAPIView
from deepdataspace.server.resources.common import format_response
from deepdataspace.server.resources.common import parse_arguments
from deepdataspace.server.resources.common import raise_exception

logger = logging.getLogger("django")


class LoginView(BaseAPIView):
    """
    - POST /api/v1/login
    """

    post_args = [
        Argument("username", str, Argument.JSON, required=True),
        Argument("password", str, Argument.JSON, required=True),
    ]

    def post(self, request):
        """
        Login user.
        - POST /api/v1/login
        """

        username, password = parse_arguments(request, self.post_args)
        user = User.authenticate(username=username, password=password)

        if user is None:
            logger.warning(f"user[{username}] failed to login with password[{password}]")
            raise_exception(403, "invalid username or password", 403)
        else:
            logger.info(f"user[{username}] login successfully")
        token = user.login_user()
        user_data = {"username": username, "user_id": token.user_id, "token": token.id, "is_staff": user.is_staff}
        return format_response(user_data)


class LogoutView(AuthenticatedAPIView):
    """
    - DELETE /api/v1/logout
    """

    def post(self, request):
        """
        Logout user.
        - DELETE /api/v1/logout
        """

        user = request.user
        token = request.auth
        user.logout_user(token.id)
        return format_response({})


class UserInfoView(AuthenticatedAPIView):
    """
    - GET /api/v1/user_info
    """

    def get(self, request):
        """
        Get user info.
        - GET /api/v1/user_info
        """
        user = request.user
        return format_response({"id": user.id, "name": user.name, "status": user.status, "is_staff": user.is_staff})
