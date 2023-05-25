"""
deepdataspace.utils.string

Convenient functions about string operation.
"""

import base64
import hashlib
import random
import string

from cryptography.fernet import Fernet


def get_str_md5(string_: str) -> str:
    """
    Get the md5 hex of target string.
    """

    return hashlib.md5(string_.encode("utf-8")).hexdigest()


_RandomStrTable = string.ascii_uppercase + string.digits
_RandomPasswordTable = ".~!@#$%&*-+="


def gen_random_str(length: int) -> str:
    """
    Generate a random string of target length.
    Characters are chosen from ascii_uppercase and digits.
    """

    letters = random.Random().choices(_RandomStrTable, k=length)
    return "".join(letters)


def gen_password(length: int) -> str:
    """
    Generate a random string for password.
    Characters are chosen from ascii_uppercase, digits and punctuations.
    """
    if length > 2:
        k = length - 2
        l = 2
    else:
        k = length
        l = 0

    password = random.Random().choices(_RandomStrTable, k=k)
    password = "".join(password)

    suffix = random.Random().choices(_RandomPasswordTable, k=l)
    suffix = "".join(suffix)

    return password + suffix


def encrypt(message: str, key: str) -> str:
    """
    Encrypt message with key, return an encrypted string token.
    """

    message = message.encode("utf8")
    key = base64.urlsafe_b64encode(key[:32].encode("utf8"))
    return Fernet(key).encrypt(message).decode("utf8")


def decrypt(token: str, key: str) -> str:
    """
    Decrypt an encrypted string token with key, return a plain text.
    """

    token = token.encode("utf8")
    key = base64.urlsafe_b64encode(key[:32].encode("utf8"))
    return Fernet(key).decrypt(token).decode("utf8")
