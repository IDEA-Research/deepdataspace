"""
deepdataspace.server.resources.api_v1.label_tasks

RESTful APIs of label tasks.
"""

import copy
from typing import List

from pydantic import BaseModel

from deepdataspace.constants import ErrCode
from deepdataspace.constants import LabelImageQAActions
from deepdataspace.constants import LabelProjectQAActions
from deepdataspace.constants import LabelProjectRoles
from deepdataspace.constants import LabelTaskImageStatus
from deepdataspace.constants import LabelTaskQAActions
from deepdataspace.constants import UserStatus
from deepdataspace.model.dataset import DataSet
from deepdataspace.model.label_task import LabelProject
from deepdataspace.model.label_task import LabelTask
from deepdataspace.model.label_task import LabelTaskError
from deepdataspace.model.label_task import LabelTaskImage
from deepdataspace.model.label_task import LabelTaskImageModel
from deepdataspace.model.label_task import ProjectRole
from deepdataspace.model.label_task import TaskRole
from deepdataspace.model.user import User
from deepdataspace.utils.http import Argument
from deepdataspace.utils.http import AuthenticatedAPIView
from deepdataspace.utils.http import format_response
from deepdataspace.utils.http import parse_arguments
from deepdataspace.utils.http import raise_exception


def _validate_users(user_ids):
    if not user_ids:
        return []

    validated_users = []
    users = User.find_many({"id": {"$in": list(set(user_ids))}})
    user_map = {m.id: m for m in users}
    for user_id in user_ids:
        if user_id not in user_map:
            raise_exception(ErrCode.UserNotFoundForLabelProject, f"user[id={user_id}] is not found")

        user = user_map[user_id]
        if user.status != UserStatus.Active:
            raise_exception(ErrCode.UserNotActiveForLabelProject, f"user[{user.name}@{user_id}] is not active")
        validated_users.append(user)
    return validated_users


def _validate_dataset_ids(dataset_ids):
    if not dataset_ids:
        return []

    validated_datasets = []
    dataset_ids = list(set(dataset_ids))
    datasets = DataSet.find_many({"id": {"$in": dataset_ids}})
    dataset_map = {d.id: d for d in datasets}
    for dataset_id in dataset_ids:
        if dataset_id not in dataset_map:
            raise_exception(ErrCode.DatasetNotFoundForLabelProject, f"dataset[id={dataset_id}] is not found")
        validated_datasets.append(dataset_map[dataset_id])
    return validated_datasets


def _validate_task_ids(task_ids):
    if not task_ids:
        return []

    validated_tasks = []
    task_ids = list(set(task_ids))
    tasks = LabelTask.find_many({"id": {"$in": task_ids}})
    task_map = {t.id: t for t in tasks}
    for task_id in task_ids:
        if task_id not in task_map:
            raise_exception(ErrCode.LabelTaskNotFoundForLabelProject, f"task[id={task_id}] is not found")
        validated_tasks.append(task_map[task_id])
    return validated_tasks


def _hide_progress(project_data):
    hide_mask = {
        "task_num_total"    : None,
        "task_num_waiting"  : None,
        "task_num_working"  : None,
        "task_num_reviewing": None,
        "task_num_rejected" : None,
        "task_num_accepted" : None,
    }
    project_data.update(hide_mask)


def _get_view_role(user: User, task, role_id: str = None):
    max_view_role = task.get_max_role(user)

    if role_id is not None:
        view_role = TaskRole.find_one({"id": role_id, "is_active": True})
        if view_role is None:
            raise_exception(ErrCode.LabelProjectRoleNotFound, f"role[id={role_id}] is not found")
    else:
        view_role = max_view_role
        if view_role is None:
            raise_exception(ErrCode.UserCantViewLabelProjectTask,
                            f"user[id={user.id}] is not permitted to view data of task[id={task.id}]")

    user_role_level = LabelProjectRoles.Levels_[max_view_role.role]
    target_role_level = LabelProjectRoles.Levels_[view_role.role]
    if user_role_level > target_role_level:
        raise_exception(ErrCode.UserCantViewLabelProjectRole,
                        f"user[id={user.id}] is not permitted to view data of role[name={view_role.role}]")

    return view_role


class ProjectsView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_projects
    - POST /api/v1/label_projects
    """

    get_args = [
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    post_data = [
        Argument("name", str, Argument.JSON, required=True),
        Argument("description", str, Argument.JSON, required=False, default=""),
        Argument("dataset_ids", list, Argument.JSON, required=True),
        Argument("manager_ids", list, Argument.JSON, required=True),
        Argument("categories", str, Argument.JSON, required=True),
        Argument("pre_label", str, Argument.JSON, required=False),
    ]

    def get(self, request):
        """
        Query all visible label projects for current user.

        - GET /api/v1/label_projects
        """

        page_num, page_size = parse_arguments(request, self.get_args)

        user_id = request.user.id
        project_roles = ProjectRole.find_many({"user_id": user_id}, includes={"project_id": 1, "role": 1}, to_dict=True)
        project_roles = list(project_roles)
        project_ids = list((r["project_id"] for r in project_roles))

        filters = {"id": {"$in": project_ids}}
        total = LabelProject.count_num(filters)
        skip = max(0, page_size * (page_num - 1))
        projects = LabelProject.find_many(filters, sort=[("created_ts", 1)], skip=skip, size=page_size, to_dict=True)

        can_view_progress = {}
        for role in project_roles:
            project_id = role["project_id"]
            if role["role"] in LabelProjectRoles.GTELeaders_:
                can_view_progress[project_id] = True

        project_list = []
        for project in projects:
            if not can_view_progress.get(project["id"], False):
                _hide_progress(project)
            project_list.append(project)

        data = {
            "total"       : total,
            "page_size"   : page_size,
            "page_num"    : page_num,
            "project_list": project_list
        }
        return format_response(data)

    def _parse_post_data(self, request):
        if not ProjectRole.can_create_project(request.user):
            raise_exception(ErrCode.UserCantCreateLabelProject,
                            f"user[{request.user.id}] is not allowed to create project")

        name, desc, dataset_ids, manager_ids, categories, pre_label = parse_arguments(request, self.post_data)
        managers = _validate_users(manager_ids)
        datasets = _validate_dataset_ids(dataset_ids)
        categories = categories.split(",")
        return name, desc, request.user, datasets, managers, categories, pre_label

    def post(self, request):
        """
        Create a label project.

        - POST /api/v1/label_projects
        """
        name, desc, owner, datasets, managers, categories, pre_label = self._parse_post_data(request)

        project = LabelProject.create_project(name, request.user, datasets, managers, categories,
                                              description=desc, pre_label=pre_label)

        data = project.to_dict()
        return format_response(data)


class ProjectView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_projects/<project_id>
    - POST /api/v1/label_projects/<project_id>
    """

    post_data = [
        Argument("description", str, Argument.JSON, required=False, default=None),
        Argument("manager_ids", list, Argument.JSON, required=False, default=None),
    ]

    def get(self, request, project_id):
        """
        Query project detail for given project id

        - GET /api/v1/label_projects/<project_id>
        """

        if not ProjectRole.can_view_project(request.user, project_id):
            raise_exception(ErrCode.UserCantViewLabelProject,
                            f"user[{request.user.id}] is not allowed to view project[{project_id}]")

        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound,
                            f"project[id={project_id}] is not found")

        data = project.to_dict()
        if not ProjectRole.can_view_project_progress(request.user, project_id):
            _hide_progress(data)
        return format_response(data)

    def post(self, request, project_id):
        """
        Update project info for given project id

        - POST /api/v1/label_projects/<project_id>
        """

        if not ProjectRole.can_edit_project(request.user, project_id):
            raise_exception(ErrCode.UserCantEditLabelProject,
                            f"user[{request.user.id}] is not allowed to edit project[{project_id}]")

        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound,
                            f"project[id={project_id}] is not found")

        desc, manager_ids = parse_arguments(request, self.post_data)
        managers = _validate_users(manager_ids)

        project.edit_project(desc, managers)
        data = project.to_dict()
        return format_response(data)


class ProjectConfigView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_project_configs/<project_id>
    """

    post_data = [
        Argument("batch_size", Argument.NonNegativeInt, Argument.JSON, required=True),
        Argument("label_times", Argument.PositiveInt, Argument.JSON, required=True),
        Argument("review_times", Argument.NonNegativeInt, Argument.JSON, required=True),
    ]

    def post(self, request, project_id):
        """
        Initialize a label project, creating all label tasks for it.

        - POST /api/v1/label_project_configs/<project_id>
        """

        if not ProjectRole.can_init_project(request.user, project_id):
            raise_exception(ErrCode.UserCantInitLabelProject,
                            f"user[{request.user.id}] is not allowed to init project[{project_id}]")

        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound, f"project[id={project_id}] is not found")

        batch_size, label_times, review_times = parse_arguments(request, self.post_data)
        project.init_project(batch_size, label_times, review_times)
        data = project.to_dict()
        return format_response(data)


class ProjectQAView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_project_qa/<project_id>
    """

    post_args = [
        Argument("action", Argument.Choice(LabelProjectQAActions.ALL_), Argument.JSON, required=True),
    ]

    def post(self, request, project_id):
        """
        QA a label project by project owner.

        - POST /api/v1/label_project_qa/<project_id>
        """

        user = request.user
        action, = parse_arguments(request, self.post_args)

        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound, f"project[id={project_id}] is not found")

        if not ProjectRole.can_qa_project(user, project_id):
            raise_exception(ErrCode.UserCantQALabelProject,
                            f"user[{user.id}] is not allowed to qa project[{project_id}]")

        project.qa_project(action)
        return format_response({})


class ProjectExportView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_project_export/<project_id>
    """

    post_args = [
        Argument("label_name", str, Argument.JSON, required=True),
    ]

    def post(self, request, project_id):
        """
        Export a label project back to datasets.

        - POST /api/v1/label_project_export/<project_id>
        """

        user = request.user
        label_name, = parse_arguments(request, self.post_args)

        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound, f"project[id={project_id}] is not found")

        if not ProjectRole.can_export_project(user, project_id):
            raise_exception(ErrCode.UserCantExportLabelProject,
                            f"user[{user.id}] is not allowed to export project[{project_id}]")

        project.export_project(label_name)
        return format_response({})


class TasksView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_tasks
    """

    get_args = [
        Argument("project_id", str, Argument.QUERY, required=True),
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    def _query_tasks(self, request, project_id, page_num, page_size):
        if ProjectRole.can_view_all_tasks(request.user, project_id):
            # owner and managers can see all tasks
            filters = {"project_id": project_id}
            tasks = LabelTask.find_many(filters,
                                        sort=[("idx", 1)],
                                        skip=page_size * (page_num - 1),
                                        size=page_size)
            tasks = list(tasks)
            total = LabelTask.count_num(filters)
        else:
            # others can only see tasks they are assigned to
            filters = {"project_id": project_id, "user_id": request.user.id, "is_active": True}
            task_roles = list(TaskRole.find_many(filters))

            task_ids = list(set(t.task_id for t in task_roles))
            filters = {"project_id": project_id, "id": {"$in": task_ids}}
            tasks = LabelTask.find_many(filters,
                                        sort=[("idx", 1)],
                                        skip=page_size * (page_num - 1),
                                        size=page_size)
            tasks = list(tasks)
            total = LabelTask.count_num(filters)

        return total, tasks

    def _query_roles(self, request, tasks, is_supper):
        task_ids = list(set(t.id for t in tasks))

        filters = {"task_id": {"$in": task_ids}, "is_active": True}
        task_roles = list(TaskRole.find_many(filters))

        task_roles_data = {}
        for task_id in task_ids:
            data_tpl = {
                "label_leader" : None,
                "review_leader": None,
                "labelers"     : [],
                "reviewers"    : []
            }
            task_roles_data.setdefault(task_id, copy.deepcopy(data_tpl))

        leaders = {}
        for tr in task_roles:
            if tr.role == LabelProjectRoles.LabelLeader:
                task_roles_data[tr.task_id]["label_leader"] = tr.to_dict()
                leaders.setdefault(tr.task_id, set()).add(tr.user_id)
            elif tr.role == LabelProjectRoles.ReviewLeader:
                task_roles_data[tr.task_id]["review_leader"] = tr.to_dict()
                leaders.setdefault(tr.task_id, set()).add(tr.user_id)

        for tr in task_roles:
            can_view = is_supper
            if request.user.id == tr.user_id:
                can_view = True
            elif request.user.id in leaders[tr.task_id]:
                can_view = True
            if not can_view:
                continue

            role = tr.role
            task_role_data = task_roles_data.setdefault(tr.task_id, {})
            if role in LabelProjectRoles.Leaders_:
                task_role_data[role] = tr.to_dict()
            elif role == LabelProjectRoles.Labeler:
                task_role_data.setdefault("labelers", []).append(tr.to_dict())
            elif role == LabelProjectRoles.Reviewer:
                task_role_data.setdefault("reviewers", []).append(tr.to_dict())

        return task_roles_data

    def get(self, request):
        """
        Query tasks of a label project.

        - GET /api/v1/label_tasks
        """

        project_id, page_num, page_size = parse_arguments(request, self.get_args)
        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound, f"project[id={project_id}] is not found")

        if not ProjectRole.can_view_project(request.user, project_id):
            raise_exception(ErrCode.UserCantViewLabelProject,
                            f"user[{request.user.id}] is not allowed to view project[{project_id}]")

        is_supper = ProjectRole.can_view_all_tasks(request.user, project_id)
        total, tasks = self._query_tasks(request, project_id, page_num, page_size)

        task_roles = self._query_roles(request, tasks, is_supper)

        task_list = []
        for task in tasks:
            task_data = task.to_dict()
            role_data = task_roles.get(task.id, {})
            task_data.update(role_data)
            task_list.append(task_data)

        data = {
            "task_list": task_list,
            "page_size": page_size,
            "page_num" : page_num,
            "total"    : total
        }
        return format_response(data)


class TaskConfigView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_task_configs/<task_id>
    """

    def get(self, request, task_id):
        """
        Query task config of a label task.

        - GET /api/v1/label_task_configs/<task_id>
        """

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        role = _get_view_role(request.user, task, )
        if role is None:
            raise_exception(ErrCode.UserCantViewLabelProjectTask,
                            f"user[{request.user.id}] is not allowed to view task[{task_id}]")

        project_id = task.project_id
        project = LabelProject.find_one({"id": project_id})
        if project is None:
            raise_exception(ErrCode.LabelProjectNotFound, f"project[id={project_id}] is not found")

        category_list = project.categories.split(",")
        category_list = [{"name": cat, "id": cat} for cat in category_list if cat]
        data = {"category_list": category_list}

        return format_response(data)


class TaskLeadersView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_leaders
    """

    post_args = [
        Argument("project_id", str, Argument.JSON, required=True),
        Argument("task_ids", list, Argument.JSON, required=True),
        Argument("label_leader_id", str, Argument.JSON, required=False),
        Argument("review_leader_id", str, Argument.JSON, required=False)
    ]

    def post(self, request):
        """
        Assign labeler leader or reviewer leader for multiple label tasks.

        - POST /api/v1/label_task_leaders
        """

        project_id, task_ids, label_leader_id, review_leader_id = parse_arguments(request, self.post_args)
        if not ProjectRole.can_assign_leader(request.user, project_id):
            raise_exception(ErrCode.UserCantAssignLabelTaskLeader,
                            f"user[{request.user.id}] is not allowed to assign leader for project[{project_id}]")

        if not label_leader_id and not review_leader_id:
            raise_exception(ErrCode.LeaderIDIsRequired, ErrCode.LeaderIDIsRequiredMsg)

        labeler_leader = None
        if label_leader_id:
            labeler_leader = User.find_one({"id": label_leader_id})
            if labeler_leader is None:
                raise_exception(ErrCode.UserNotFoundForLabelProject,
                                f"user[id={label_leader_id}] is not found")

        reviewer_leader = None
        if review_leader_id:
            reviewer_leader = User.find_one({"id": review_leader_id})
            if reviewer_leader is None:
                raise_exception(ErrCode.UserNotFoundForLabelProject,
                                f"user[id={review_leader_id}] is not found")

        failed = {}
        tasks = _validate_task_ids(task_ids)
        for task in tasks:
            if labeler_leader:
                try:
                    task.set_leader(labeler_leader, LabelProjectRoles.LabelLeader)
                except LabelTaskError as err:
                    err_data = {"task_id": task.id, "error": str(err)}
                    failed.setdefault("label_leader", []).append(err_data)

            if reviewer_leader:
                try:
                    task.set_leader(reviewer_leader, LabelProjectRoles.ReviewLeader)
                except LabelTaskError as err:
                    err_data = {"task_id": task.id, "error": str(err)}
                    failed.setdefault("review_leader", []).append(err_data)

        if failed:
            return format_response({"failed": failed},
                                   code=ErrCode.PartialSuccessBatchAssignLeaders,
                                   msg=ErrCode.PartialSuccessBatchAssignLeadersMsg)
        return format_response({})


class TaskWorkerView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_workers/<task_id>
    """

    post_args = [
        Argument("labeler_ids", list, Argument.JSON, required=False),
        Argument("reviewer_ids", list, Argument.JSON, required=False)
    ]

    def post(self, request, task_id):
        """
        Set labeler or reviewer for a label task.

        - POST /api/v1/label_task_workers/<task_id>
        """

        user = request.user
        labeler_ids, reviewer_ids = parse_arguments(request, self.post_args)

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        if not labeler_ids and not reviewer_ids:
            raise_exception(ErrCode.LabelerIDIsRequired,
                            ErrCode.LabelerIDIsRequiredMsg)

        labelers = _validate_users(labeler_ids)
        if labelers and not TaskRole.can_init_label_worker(request.user, task_id):
            raise_exception(ErrCode.UserCantAssignLabelTaskWorker,
                            f"user[{user.id}] is not allowed to assign label worker for task[{task_id}]")

        reviewers = _validate_users(reviewer_ids)
        if reviewers and not TaskRole.can_init_review_worker(request.user, task_id):
            raise_exception(ErrCode.UserCantAssignLabelTaskWorker,
                            f"user[{user.id}] is not allowed to assign review worker for task[{task_id}]")

        failed = {}
        if labelers:
            try:
                task.init_workers(labelers, LabelProjectRoles.Labeler)
            except LabelTaskError as err:
                failed["labelers"] = {
                    "error"     : str(err),
                    "labler_ids": labeler_ids
                }

        if reviewers:
            try:
                task.init_workers(reviewers, LabelProjectRoles.Reviewer)
            except LabelTaskError as err:
                failed["reviewers"] = {
                    "error"       : str(err),
                    "reviewer_ids": labeler_ids
                }

        if failed:
            return format_response({"failed": failed},
                                   code=ErrCode.PartialSuccessBatchAssignWorkers,
                                   msg=ErrCode.PartialSuccessBatchAssignWorkersMsg)

        return format_response({})


class TaskReassignView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_reassign/<task_id>
    """

    post_args = [
        Argument("old_worker_id", str, Argument.JSON, required=True),
        Argument("new_worker_id", str, Argument.JSON, required=True),
        Argument("role", Argument.Choice(LabelProjectRoles.Workers_), Argument.JSON, required=True),
    ]

    def post(self, request, task_id):
        """
        Reassign a labeler or a reviewer for a label task.

        - POST /api/v1/label_task_reassign/<task_id>
        """

        user = request.user
        old_worker_id, new_worker_id, role = parse_arguments(request, self.post_args)

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        user_ids = [old_worker_id, new_worker_id]
        old_user, new_user = _validate_users(user_ids)

        if role == LabelProjectRoles.Labeler and not TaskRole.can_replace_label_worker(user, task_id):
            raise_exception(ErrCode.UserCantAssignLabelTaskWorker,
                            f"user[{user.id}] is not allowed to replace label worker for task[{task_id}]")
        if role == LabelProjectRoles.Reviewer and not TaskRole.can_replace_review_worker(user, task_id):
            raise_exception(ErrCode.UserCantAssignLabelTaskWorker,
                            f"user[{user.id}] is not allowed to replace review worker for task[{task_id}]")

        old_role, new_role = task.replace_worker(old_user, new_user, role)
        data = task.to_dict()
        data["old_worker"] = old_role.to_dict()
        data["new_worker"] = new_role.to_dict()
        return format_response(data)


class TaskReStartView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_restart/<task_id>
    """

    def post(self, request, task_id):
        """
        Restart a rejected task by a leader.

        - POST /api/v1/label_task_restart/<task_id>
        """

        user = request.user
        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        if not TaskRole.can_restart_task(user, task_id):
            raise_exception(ErrCode.UserCantRestartLabelTask,
                            f"user[{user.id}] is not allowed to restart task[{task_id}]")

        task.restart_task()
        return format_response({})


class TaskQAView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_qa/<task_id>
    """

    post_args = [
        Argument("action", Argument.Choice(LabelTaskQAActions.ALL_), Argument.JSON, required=True),
    ]

    def post(self, request, task_id):
        """
        For a manager to QA a task.

        - POST /api/v1/label_task_qa/<task_id>
        """

        user = request.user
        action, = parse_arguments(request, self.post_args)

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        project_id = task.project_id
        if not TaskRole.can_qa_task(user, project_id):
            raise_exception(ErrCode.UserCantQALabelTask,
                            f"user[{user.id}] is not allowed to qa task[{project_id}]")

        task.qa_task(action)
        return format_response({})


class TaskRolesView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_task_roles/<task_id>
    """

    def get(self, request, task_id):
        """
        Get all visible task roles for current user of target task.

        - GET /api/v1/label_task_roles/<task_id>
        """

        user = request.user

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        if TaskRole.can_view_all_roles(user, task.project_id):
            filters = {"task_id": task_id, "is_active": True}
        else:
            filters = {"task_id": task_id, "user_id": user.id, "is_active": True}

        task_roles = TaskRole.find_many(filters, to_dict=True)
        return format_response({"role_list": list(task_roles)})


class TaskImagesView(AuthenticatedAPIView):
    """
    - GET /api/v1/label_task_images/<task_id>
    """

    status_choices = LabelTaskImageStatus.ALL_
    get_args = [
        Argument("status", Argument.Choice(status_choices), Argument.QUERY, default=LabelTaskImageStatus.Labeling),
        Argument("role_id", str, Argument.QUERY, default=None),
        Argument("page_num", Argument.PositiveInt, Argument.QUERY, default=1),
        Argument("page_size", Argument.PositiveInt, Argument.QUERY, default=100)
    ]

    @staticmethod
    def _format_data_for_labeler(images, role):
        # for labeler, return only his labels and only reviews for his labels
        image_list = []
        for image in images:
            labels = []
            reviews = []
            label_ids = set()  # id set of his labels

            # get his labels
            for user_id, user_labels in image["labels"].items():
                if user_id == role.user_id:
                    for label in user_labels:
                        labels.append(label)
                        label_ids.add(label["id"])

            # get reviews to his labels
            for user_id, user_reviews in image["reviews"].items():
                for review in user_reviews:
                    if review["label_id"] in label_ids:  # this review is for his label
                        reviews.append(review)

            image["labels"] = labels
            image["reviews"] = reviews
            image_list.append(image)
        return image_list

    @staticmethod
    def _format_data_for_reviewer(images, role):
        # for reviewer, return all labels and only his reviews
        image_list = []
        for image in images:
            labels = []
            reviews = []

            # get all labels
            for user_id, user_labels in image["labels"].items():
                labels.extend(user_labels)

            # get his reviews
            for user_id, user_reviews in image["reviews"].items():
                if user_id == role.user_id:
                    for review in user_reviews:
                        reviews.append(review)

            image["labels"] = labels
            image["reviews"] = reviews
            image_list.append(image)
        return image_list

    @staticmethod
    def _format_data_for_gte_leaders(images, role):
        # for roles GTE leader, return all labels and reviews
        image_list = []
        for image in images:
            labels = []
            reviews = []

            # get all labels
            for user_id, user_labels in image["labels"].items():
                labels.extend(user_labels)

            # get all reviews
            for user_id, user_reviews in image["reviews"].items():
                reviews.extend(user_reviews)

            image["labels"] = labels
            image["reviews"] = reviews
            image_list.append(image)
        return image_list

    def _get_task_images_for_role(self, task: LabelTask, role: TaskRole, status, page_size: int, page_num: int):
        LTIModel = LabelTaskImage(task.dataset_id)

        filters = {"task_id": task.id}
        if role.role in LabelProjectRoles.GTELeaders_:
            filters["role_status.label_leader"] = status
        elif role.role == LabelProjectRoles.Labeler:
            filters[f"role_status.labeler_{role.user_id}"] = status
        elif role.role == LabelProjectRoles.Reviewer:
            filters[f"role_status.reviewer_{role.user_id}"] = status
        else:
            return 0, []
        total = LTIModel.count_num(filters)

        offset = max(0, (page_num - 1) * page_size)
        includes = ["id", "idx", "task_id", "url", "url_full_res", "labels", "reviews", "default_labels"]
        includes = {k: 1 for k in includes}
        images = LTIModel.find_many(filters,
                                    includes=includes,
                                    sort=[("idx", 1)],
                                    skip=offset,
                                    size=page_size,
                                    to_dict=True)

        if role.role == LabelProjectRoles.Reviewer:
            image_list = self._format_data_for_reviewer(images, role)
        elif role.role == LabelProjectRoles.Labeler:
            image_list = self._format_data_for_labeler(images, role)
        else:
            image_list = self._format_data_for_gte_leaders(images, role)

        return total, image_list

    @staticmethod
    def concat_url(prefix, path):
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if path.startswith("/"):
            return f"{prefix}{path}"
        return f"{prefix}/{path}"

    def _add_url_prefix(self, request, image_list):
        req_scheme = request.scheme
        req_host = request.META["HTTP_HOST"]
        req_prefix = f"{req_scheme}://{req_host}"

        for image in image_list:
            image_url = image["url"]
            image["url"] = self.concat_url(req_prefix, image_url)

            image_url_full_res = image["url_full_res"] or image_url
            image["url_full_res"] = self.concat_url(req_prefix, image_url_full_res)

    def get(self, request, task_id):
        """
        Get images of a task from the perspective of a specified role.

        - GET /api/v1/label_task_images/<task_id>
        """

        user = request.user
        status, role_id, page_num, page_size = parse_arguments(request, self.get_args)

        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"task[id={task_id}] is not found")

        view_role = _get_view_role(user, task, role_id)
        total, image_list = self._get_task_images_for_role(task, view_role, status, page_size, page_num)
        self._add_url_prefix(request, image_list)

        data = {
            "page_num"  : page_num,
            "page_size" : page_size,
            "total"     : total,
            "image_list": image_list
        }
        return format_response(data)


class BoundingBox(BaseModel):
    xmin: float
    ymin: float
    xmax: float
    ymax: float


class Mask(BaseModel):
    counts: str
    size: List[int]


AnnoDataMissingFields = type("AnnoDataMissingFields", (ValueError,), {})


class AnnoData(BaseModel):
    category_name: str
    bounding_box: BoundingBox = {}
    segmentation: str = ""
    mask: Mask = ""
    points: List[float] = []
    lines: List[int] = []
    point_colors: List[int] = []
    point_names: List[str] = []

    def model_post_init(self, __context) -> None:
        empty_bbox = not self.bounding_box
        empty_polygon = not self.segmentation
        empty_mask = not self.mask
        empty_keypoints = (not self.lines or
                           not self.points or
                           not self.point_colors or
                           not self.point_names)
        if empty_bbox or empty_polygon or empty_mask or empty_keypoints:
            raise AnnoDataMissingFields(f"annotations missing field(s)")


class TaskImageLabelView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_image_labels/<task_image_id>
    """

    post_args = [
        Argument("annotations", list, Argument.JSON, required=True),
    ]

    def _parse_annotations(self, request):
        annotations, = parse_arguments(request, self.post_args)

        valid_anno_list = []
        for idx, anno in enumerate(annotations):
            try:
                valid_anno = AnnoData(**anno)
            except AnnoDataMissingFields as err:
                raise_exception(ErrCode.LabelAnnotationMissingFields,
                                f"annotations.[{idx}] {ErrCode.LabelAnnotationMissingFieldsMsg}")
            except Exception:
                raise_exception(ErrCode.LabelAnnotationFieldValueInvalid,
                                f"annotations.[{idx}] {ErrCode.LabelAnnotationFieldValueInvalid}")
            else:
                valid_anno = valid_anno.dict()
                valid_anno["category_id"] = valid_anno["category_name"]
                valid_anno_list.append(valid_anno)
        return valid_anno_list

    def post(self, request, task_image_id):
        """
        Label an image of a task by current user.

        - POST /api/v1/label_task_image_labels/<task_image_id>
        """

        task_id = task_image_id.split("_")[0]
        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound,
                            f"label_task[id={task_id}] is not found")

        LTIModel = LabelTaskImage(task.dataset_id)
        label_image: LabelTaskImageModel = LTIModel.find_one({"id": task_image_id})
        if label_image is None:
            raise_exception(ErrCode.LabelTaskImageNotFound,
                            f"label_image[id={task_image_id}] is not found")

        user = request.user
        if not TaskRole.can_label_image(user, label_image.task_id):
            raise_exception(ErrCode.UserCantLabelTaskImage,
                            f"user[id={user.id}] is not permitted to label image[id={task_image_id}]")

        assert label_image.ensure_status_for_labeling(task, user)

        annotations = self._parse_annotations(request)
        label_data = label_image.set_label(task, user, annotations)
        # label_data = label_image.labels[user.id][0].dict()
        return format_response(label_data)


class TaskImageReviewView(AuthenticatedAPIView):
    """
    - POST /api/v1/label_task_image_reviews/<task_image_id>
    """

    post_args = [
        Argument("label_id", str, Argument.JSON, required=True),
        Argument("action", Argument.Choice(LabelImageQAActions.ALL_), Argument.JSON, required=True),
    ]

    def post(self, request, task_image_id):
        """
        Review a label of target image by current user.

        - POST /api/v1/label_task_image_reviews/<task_image_id>
        """

        task_id = task_image_id.split("_")[0]
        task = LabelTask.find_one({"id": task_id})
        if task is None:
            raise_exception(ErrCode.LabelProjectTaskNotFound, f"label_task[id={task_id}] is not found")

        LTIModel = LabelTaskImage(task.dataset_id)
        label_image = LTIModel.find_one({"id": task_image_id})
        if label_image is None:
            raise_exception(ErrCode.LabelTaskImageNotFound,
                            f"label_image[id={task_image_id}] is not found")

        user = request.user
        if not TaskRole.can_review_image(user, label_image.task_id):
            raise_exception(ErrCode.UserCantReviewTaskImage,
                            f"user[id={user.id}] is not permitted to review image[id={task_image_id}]")

        label_id, action = parse_arguments(request, self.post_args)
        assert label_image.ensure_status_for_reviewing(task, user, label_id)

        review_data = label_image.set_review(task, user, label_id, action)
        return format_response(review_data)
