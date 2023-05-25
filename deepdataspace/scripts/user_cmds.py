"""
deepdataspace.scripts.user_cmds

This file adds user related sub-commands to ddsop command.
"""

import click

from deepdataspace.scripts import ddsop


@ddsop.command("useradd", help="Add a user by username.")
@click.option("--staff", is_flag=True, default=False,
              help="Creat this user as an internal staff.")
@click.argument("NAME")
def useradd(name, staff):
    from deepdataspace.model import User
    from deepdataspace.model.user import IntegrationError

    try:
        user = User.create_user(name, is_staff=staff)
    except IntegrationError:
        print(f"Failed to create user, username[{name}] already exists")
    else:
        print(f"Created user, username: {user.name}, password: {user.get_password()}")


@ddsop.command("userdel", help="Delete a user by username.")
@click.argument("NAME")
def userdel(name):
    from deepdataspace.model import User

    User.delete_user(name)
    print(f"Deleted user, username: {name}")


@ddsop.command("userban", help="Ban a user by username.")
@click.argument("NAME")
def userban(name):
    from deepdataspace.model import User

    user = User.get_user(name)
    if user is None:
        print(f"Failed to ban user, username[{name}] not exist")
        return

    user.ban_user()
    print(f"Baned user, username: {name}")


@ddsop.command("userunban", help="Unban a user by username.")
@click.argument("NAME")
def userunban(name):
    from deepdataspace.model import User
    from deepdataspace.utils.string import get_str_md5

    user_id = get_str_md5(name)
    user = User.find_one({"id": user_id})
    if user is None:
        print(f"Failed to unban user, username[{name}] not exist")
        return

    user.unban_user()
    print(f"Unban user, username: {name}")


@ddsop.command("userreset", help="Reset password for a user by username.")
@click.argument("NAME")
def userreset(name):
    from deepdataspace.model import User

    user = User.get_user(name)
    if user is None:
        print(f"Failed to reset password for user, username[{name}] not exist")
        return

    user.reset_password()
    print(f"Reset password for user, username: {user.name}, password: {user.get_password()}")


@ddsop.command("useredit", help="Edit user attributes for a user by username.")
@click.argument("NAME")
@click.option("--staff", type=click.Choice(["y", "n"], case_sensitive=False),
              default=None, help="Set/Unset the user as an internal staff.")
def useredit(name, staff):
    from deepdataspace.model import User

    user = User.get_user(name)
    if user is None:
        print(f"Failed to reset password for user, username[{name}] not exist")
        return

    msg = f"Successfully edited user attributes:\n" \
          f"    username: {user.name}\n"

    if staff is not None:
        user.is_staff = staff.lower() == "y"
        msg += f"    is_staff: {user.is_staff}\n"

    user.save()
    print(msg)
