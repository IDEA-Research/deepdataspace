"""
deepdataspace.model.user

The user related models.
"""

import secrets
import time
from typing import Union

from deepdataspace.constants import UserStatus
from deepdataspace.model._base import BaseModel
from deepdataspace.server.settings import SECRET_KEY
from deepdataspace.server.settings import TOKEN_AGE
from deepdataspace.utils.string import decrypt
from deepdataspace.utils.string import encrypt
from deepdataspace.utils.string import gen_password
from deepdataspace.utils.string import get_str_md5

IntegrationError = type("IntegrationError", (Exception,), {})


class UserToken(BaseModel):
    """
    The session token for a logged-in user.

    Attributes:
    -----------
    id: str
        The token id.
    user_id: str
        The user id this token bond to.
    expire: int
        The token expire timestamp, in second.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs):
        """
        User tokens are stored in the "user_tokens" collection.
        """
        return cls.db["user_tokens"]

    id: str  # the token id
    user_id: str  # the user id
    expire: int  # the token expire timestamp, in second


class User(BaseModel):
    """
    The user model.

    Attributes:
    -----------
    id: str
        The user id.
    name: str
        The username.
    password: str
        The password, encrypted.
    status: str
        The user status, active or inactive, see :class:`deepdataspace.constants.UserStatus`.
    is_staff: bool
        Is this user a staff?
    """

    @classmethod
    def get_collection(cls, *args, **kwargs):
        """
        Users are stored in the "users" collection.
        """
        return cls.db["users"]

    id: str  # the user id
    name: str  # the username
    password: str  # the password, encrypted.
    status: str  # the user status
    is_staff: bool = False

    @property
    def is_active(self):
        return self.status == UserStatus.Active

    @classmethod
    def get_user(cls, username: str) -> Union[None, "User"]:
        """
        Get a user by username.
        """

        user_id = get_str_md5(username)
        user = User.find_one({"id": user_id})
        if user is not None and user.status != UserStatus.Active:
            user = None
        return user

    @classmethod
    def create_user(cls, username: str, is_staff: bool = False) -> "User":
        """
        Create a user by username, set a random password for the user.
        """

        username = username.lower()
        user_id = get_str_md5(username)
        user = User.find_one({"id": user_id})
        if user is not None:
            raise IntegrationError(f"user already exists with username: {username}")

        password = gen_password(10)
        password = encrypt(password, SECRET_KEY)
        user = User(id=user_id, name=username, password=password, status=UserStatus.Active, is_staff=is_staff)
        user.save()
        return user

    @classmethod
    def delete_user(cls, username: str):
        """
        Delete users by username.
        """

        user_id = get_str_md5(username)
        User.delete_many({"id": user_id})

    def reset_password(self):
        """
        Reset user password to a random one.
        """

        password = gen_password(10)
        self.set_password(password)
        self.delete_all_token()

    def ban_user(self):
        """
        Ban a user, set user status to inactive.
        """

        self.status = UserStatus.InActive
        self.delete_all_token()
        self.save()

    def unban_user(self):
        """
        Unban a user, set user status to active.
        """

        self.status = UserStatus.Active
        self.save()

    @classmethod
    def authenticate(cls, username: str, password: str) -> Union[None, "User"]:
        """
        Authenticate a user by username and password.
        """

        user = cls.get_user(username)
        if user is None:
            return None
        decrypted_pass = decrypt(user.password, SECRET_KEY)
        if password == decrypted_pass:
            return user
        return None

    def get_password(self):
        """
        Get the decrypted password.
        """

        return decrypt(self.password, SECRET_KEY)

    def set_password(self, password: str):
        """
        Set the password for a user. store it in encrypted format.
        """

        password = encrypt(password, SECRET_KEY)
        self.password = password
        self.save()

    def login_user(self):
        """
        Login a user, create a token for the user.
        """

        cur_time = int(time.time())
        expire = cur_time + TOKEN_AGE

        token_value = secrets.token_hex(16)
        token = UserToken(id=token_value, user_id=self.id, expire=expire)
        token.save()
        return token

    def logout_user(self, token_value: str):
        """
        Logout a user, delete the token of current session.
        """

        UserToken.delete_many({"id": token_value, "user_id": self.id})

    def refresh_token(self, token_value: str):
        """
        Extend the expiry time for current session.
        """

        cur_time = int(time.time())
        expire = cur_time + TOKEN_AGE

        UserToken.update_one({"id": token_value, "user_id": self.id}, {"expire": expire})

    def delete_all_token(self):
        """
        Delete all session for current user.
        This method must be called after banning the user.
        """

        UserToken.delete_many({"user_id": self.id})
