"""
deepdataspace.model.label_task

The label project related models.
"""

import copy
import time
import uuid
from typing import ClassVar
from typing import Dict
from typing import List
from typing import Type
from typing import Union

from pydantic import BaseModel as _Base
from pydantic import Field
from pymongo.collection import Collection
from pymongo.typings import _DocumentType

from deepdataspace.constants import LabelImageQAActions
from deepdataspace.constants import LabelProjectQAActions
from deepdataspace.constants import LabelProjectRoles
from deepdataspace.constants import LabelProjectStatus
from deepdataspace.constants import LabelTaskImageStatus
from deepdataspace.constants import LabelTaskQAActions
from deepdataspace.constants import LabelTaskStatus
from deepdataspace.model._base import BaseModel
from deepdataspace.model.dataset import DataSet
from deepdataspace.model.image import Image
from deepdataspace.model.user import User

Num = Union[float, int]


def current_ts():
    return int(time.time() * 1000)


def gen_uuid():
    return uuid.uuid4().hex


LabelProjectError = type("LabelTaskError", (Exception,), {})
LabelTaskError = type("LabelTaskError", (Exception,), {})


class LabelProject(BaseModel):
    """
    The label project model.
    Each label project is associated with one or more datasets, and one project owner and several managers.
    The project will distribute the datasets to label tasks, which are labeled by labelers and reviewed by reviewers,
    which are lead by label leaders and review leaders.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        return cls.db["label_projects"]

    # the mandatory fields
    id: str
    name: str
    datasets: List[dict]  # [{id:"id", "name":"name"}]
    created_ts: int
    owner: dict  # {id:"id", "name":"name"}
    managers: List[Dict]  # [{id:"id", "name":"name"}]

    # the optional fields
    description: str = ""
    status: str = LabelProjectStatus.Waiting  # waiting for a manager
    batch_size: int = None  # 0 means don't divide dataset to multiple tasks
    label_times: int = None  # each image needs to be labeled by label_times people
    review_times: int = None  # each image needs to be reviewed by review_times people
    task_num_total: int = 0
    task_num_waiting: int = 0
    task_num_working: int = 0
    task_num_reviewing: int = 0
    task_num_rejected: int = 0
    task_num_accepted: int = 0
    categories: str = ""
    pre_label: str = None  # objects blong to pre_label will be imported as default labels

    @classmethod
    def create_project(cls,
                       name: str,
                       owner: User,
                       datasets: List[DataSet],
                       managers: List[User],
                       categories: List[str],
                       description: str = "",
                       pre_label: str = None,
                       ) -> "LabelProject":
        """
        Create a label project.

        :param name: the project name.
        :param owner: the project owner.
        :param datasets: the project datasets, which cannot be empty list.
        :param managers: the project managers, which cannot be empty list.
        :param categories: the categories for classification and annotation task, which cannot be empty list.
        :param description: the project description
        :param pre_label: the pre label set to be imported as default labels
        """

        # check data requirements
        if not managers:
            raise LabelProjectError("Managers can't be empty")

        if not datasets:
            raise LabelProjectError("Datasets can't be empty")

        if not categories:
            raise LabelProjectError("Categories can't be empty")

        if not owner.is_staff:
            raise LabelProjectError("Only staff can create a project")

        # create the project
        project_id = uuid.uuid4().hex
        created_ts = int(time.time() * 1000)
        owner = {"id": owner.id, "name": owner.name}
        datasets = [{"id": d.id, "name": d.name} for d in datasets]
        managers = [{"id": u.id, "name": u.name} for u in managers]

        dataset_ids = list(d["id"] for d in datasets)
        exist_project = LabelProject.find_one({"datasets.id": {"$in": dataset_ids}})
        if exist_project is not None:
            raise LabelProjectError(f"Project {exist_project.name} already exists for dataset {dataset_ids}")

        status = LabelProjectStatus.Waiting
        project = LabelProject(id=project_id,
                               name=name,
                               datasets=datasets,
                               created_ts=created_ts,
                               owner=owner,
                               managers=managers,
                               description=description,
                               pre_label=pre_label,
                               status=status)
        project._set_categories(categories)
        project.save()

        # set initial roles
        ProjectRole.add_role(project, owner["id"], LabelProjectRoles.Owner)
        ProjectRole.add_roles(project, [m["id"] for m in managers], LabelProjectRoles.Manager)

        return project

    def _set_categories(self, categories):
        """
        strip, convert to lower case, deduplicate, sort, join to a string
        """

        categories = sorted(set([c.strip().lower() for c in categories if c.strip()]))
        self.categories = ",".join(categories)

    def edit_project(self,
                     desc: str = None,
                     managers: List[User] = None,
                     ):
        """
        Edit project description and/or managers.
        :param desc: the project description, if None, then it won't be updated.
        :param managers: the project managers, if None, then it won't be updated. Otherwise, it cannot be an empty list.
        """

        if desc is not None:
            self.description = desc

        if managers is not None:
            if not managers:  # empty list
                raise LabelProjectError("Managers can't be empty")

            old_managers = self.managers
            old_ids = [m["id"] for m in old_managers]
            new_ids = [m.id for m in managers]
            self.managers = [{"id": m.id, "name": m.name} for m in managers]

            del_manager_ids = list(set(old_ids) - set(new_ids))
            new_manager_ids = list(set(new_ids) - set(old_ids))

            ProjectRole.del_roles(self, del_manager_ids, LabelProjectRoles.Manager)
            ProjectRole.add_roles(self, new_manager_ids, LabelProjectRoles.Manager)

        self.save()

    def _init_tasks(self):
        """
        Generate label tasks for all datasets of this project.
        Each task contains a batch of images of a dataset.
        Images of a task are of the same dataset.
        """

        task_idx = 0
        task_num_total = 0

        # for every dataset, distribute images to tasks
        category_names = set()
        for dataset in self.datasets:
            dataset_id = dataset["id"]
            IModel = Image(dataset_id)
            LTIModel = LabelTaskImage(dataset_id)

            num_images = IModel.count_num({})

            includes = ["id", "url", "url_full_res", "objects"]
            includes = {i: 1 for i in includes}
            images = IModel.find_many({}, includes=includes, sort=[("idx", 1), ("id", 1)], to_dict=True)

            # distribute all images to one task if bach_size is 0
            if self.batch_size == 0:
                num_tasks = 1
                batch_size = num_images
            else:  # distribute images to tasks by batch_size
                num_tasks, left = divmod(num_images, self.batch_size)
                num_tasks += 1 if left > 0 else 0
                batch_size = self.batch_size
            task_num_total += num_tasks

            tasks = []
            for idx in range(num_tasks):
                task = LabelTask(id=gen_uuid(),
                                 idx=task_idx,
                                 project_id=self.id,
                                 dataset_id=dataset_id,
                                 num_total=0,
                                 created_ts=current_ts())
                task.save()
                task_idx += 1
                tasks.append(task)

            for idx, image in enumerate(images):
                task = tasks[idx // batch_size]
                task.num_total += 1

                # add import pre label set
                annotations = []
                for obj in image["objects"]:
                    if self.pre_label is None or obj["label_name"] != self.pre_label:
                        continue

                    anno = {
                        "category_id"  : obj["category_name"],
                        "category_name": obj["category_name"],
                        "bounding_box" : obj["bounding_box"]
                    }
                    annotations.append(anno)
                    category_names.add(obj["category_name"])

                default_labels = UserLabelData(
                        user_id="_pre",
                        user_name="_pre",
                        annotations=annotations
                )

                lti = LTIModel(
                        id=f"{task.id}_{idx}",
                        idx=idx,
                        image_id=image["id"],
                        default_labels=default_labels,
                        task_id=task.id,
                        url=image["url"],
                        url_full_res=image["url_full_res"])
                lti.batch_save()
            LTIModel.finish_batch_save()

            [task.batch_save() for task in tasks]
            LabelTask.finish_batch_save()

        self.task_num_total = task_num_total
        self.task_num_waiting = task_num_total

        # expand categories from pre-label data
        categories = self.categories.split(",")
        categories.extend(category_names)
        categories = sorted(set(categories))
        self.categories = ",".join(categories)

    def init_project(self,
                     batch_size: int = None,
                     label_times: int = None,
                     review_times: int = None,
                     ):
        """
        Init project with configurations.
        Each project can be inited only once.

        :param batch_size: the number of images in a task, if 0, then all images of a dataset are in a task.
        :param label_times: the number of labelers to label every image in a task.
        :param review_times: the number of reviewers to review every label of every labeler of a task.
        """

        if self.status != LabelProjectStatus.Waiting:
            msg = f"Project can only be initialized in status of 'waiting', current status is {self.status}."
            raise LabelProjectError(msg)

        if batch_size is None or \
                label_times is None or \
                review_times is None:
            msg = "batch_size, label_times, review_times must be set at the same time."
            raise LabelProjectError(msg)

        self.status = LabelProjectStatus.Initializing
        self.batch_size = batch_size
        self.label_times = label_times
        self.review_times = review_times

        self.save()

        self._init_tasks()
        self.status = LabelProjectStatus.Working
        self.save()

    def update_subtask_counter(self):
        """
        Update the number of tasks in different status.
        This is done by mongodb aggregation.
        """

        facet, project = {}, {}
        for status in LabelTaskStatus.ALL_:
            facet[status] = [{"$match": {"status": status, "project_id": self.id}}, {"$count": status}]
            project[status] = {"$arrayElemAt": [f"${status}.{status}", 0]}

        pipeline = [{"$facet": facet}, {"$project": project}]
        counters = list(LabelTask.aggregate(pipeline))[0]

        for status in LabelTaskStatus.ALL_:
            if status == LabelTaskStatus.Waiting:
                self.task_num_waiting = counters.get(status, 0)
            elif status == LabelTaskStatus.Working:
                self.task_num_working = counters.get(status, 0)
            elif status == LabelTaskStatus.Reviewing:
                self.task_num_reviewing = counters.get(status, 0)
            elif status == LabelTaskStatus.Rejected:
                self.task_num_rejected = counters.get(status, 0)
            elif status == LabelTaskStatus.Accepted:
                self.task_num_accepted = counters.get(status, 0)

        if self.task_num_accepted == self.task_num_total:
            self.status = LabelProjectStatus.Reviewing

        self.save()

    def accept_project(self):
        """
        Accept the project, change the status from 'reviewing' to 'accepted'.
        """

        if self.status != LabelProjectStatus.Reviewing:
            msg = f"Project can only be accepted in status of 'reviewing', current status is {self.status}."
            raise LabelProjectError(msg)

        self.status = LabelProjectStatus.Accepted
        self.save()

    def reject_project(self):
        """
        Reject the project, change the status from 'reviewing' to 'rejected'.
        """

        if self.status != LabelProjectStatus.Reviewing:
            msg = f"Project can only be rejected in status of 'reviewing', current status is {self.status}."
            raise LabelProjectError(msg)

        self.status = LabelProjectStatus.Rejected
        self.save()

    def qa_project(self, action):
        """
        QA the project, change the status from 'reviewing' to 'accepted' or 'rejected'.
        """

        if action == LabelProjectQAActions.Accept:
            return self.accept_project()
        elif action == LabelProjectQAActions.Reject:
            return self.reject_project()
        else:
            raise LabelProjectError(f"Invalid project qa action: {action}.")


class ProjectRole(BaseModel):
    """
    Every user has one or more roles in a project.
    This model defines common interfaces for project roles.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        return cls.db["label_project_roles"]

    id: str
    project_id: str
    user_id: str
    role: str

    @classmethod
    def add_role(cls, project: LabelProject, user_id: str, role: str):
        """
        Assign a role to a user in a project.
        """

        new_role = cls(id=gen_uuid(), project_id=project.id, user_id=user_id, role=role)
        new_role.save()
        return new_role

    @classmethod
    def add_roles(cls, project: LabelProject, user_ids: List[str], role: str):
        """
        Assign a role to a list of users in a project.
        """

        if not user_ids:
            return

        roles = []
        for user_id in user_ids:
            role_id = gen_uuid()
            proj_role = cls(id=role_id, project_id=project.id, user_id=user_id, role=role)
            proj_role.batch_save()
            roles.append(proj_role)
        cls.finish_batch_save()
        return roles

    @classmethod
    def del_role(cls, project: LabelProject, user_id: str, role: str):
        """
        Delete a role of a user in a project.
        """

        filters = {"project_id": project.id, "user_id": user_id, "role": role}
        if role == LabelProjectRoles.Owner:
            num_del_owner = cls.count_num(filters)
            num_cur_owner = cls.count_num({"project_id": project.id, "role": LabelProjectRoles.Owner})
            if num_del_owner == num_cur_owner:
                raise LabelTaskError("Cannot delete all owners of a project.")
        cls.delete_many(filters)

    @classmethod
    def del_roles(cls, project: LabelProject, user_ids: List[str], role: str):
        """
        Delete a role of a list of users in a project.
        """

        if not user_ids:
            return

        filters = {"project_id": project.id}
        or_filters = []

        del_owner = set()
        num_cur_owner = cls.count_num({"project_id": project.id, "role": LabelProjectRoles.Owner})
        for user_id in user_ids:
            or_filter = {"user_id": user_id, "role": role}
            or_filters.append(or_filter)
            if role == LabelProjectRoles.Owner:
                del_owner.add(user_id)

        if del_owner == num_cur_owner:
            raise LabelTaskError("Cannot delete all owners of a project.")

        filters["$or"] = or_filters
        cls.delete_many(filters)

    @staticmethod
    def is_member(user: User, project_id: str):
        """
        Check if target user has any role in the project.
        """

        filters = {"project_id": project_id, "user_id": user.id}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_owner(user: User, project_id: str):
        """
        Check if target user is the owner of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.Owner}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_manager(user: User, project_id: str):
        """
        Check if target user is the manager of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.Manager}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_leader(user: User, project_id: str):
        """
        Check if target user is the leader of the project.
        """

        filters = {"project_id": project_id,
                   "user_id"   : user.id,
                   "role"      : {"$in": list(LabelProjectRoles.Leaders_)}}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_gte_leader(user: User, project_id: str):
        """
        Check if target user bears any role above or equal to leader in the project.
        """

        filters = {"project_id": project_id,
                   "user_id"   : user.id,
                   "role"      : {"$in": list(LabelProjectRoles.GTELeaders_)}}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_gt_leader(user: User, project_id: str):
        """
        Check if target user bears any role above leader in the project.
        """

        filters = {"project_id": project_id,
                   "user_id"   : user.id,
                   "role"      : {"$in": list(LabelProjectRoles.GTLeaders_)}}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_label_leader(user: User, project_id: str):
        """
        Check if target user is the label leader of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.LabelLeader}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_review_leader(user: User, project_id: str):
        """
        Check if target user is the review leader of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.ReviewLeader}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_worker(user: User, project_id: str):
        """
        Check if target user is a worker of the project.
        """

        filters = {"project_id": project_id,
                   "user_id"   : user.id,
                   "role"      : {"$in": list(LabelProjectRoles.Workers_)}}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_label_worker(user: User, project_id: str):
        """
        Check if target user is a label worker of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.Labeler}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def is_review_worker(user: User, project_id: str):
        """
        Check if target user is a review worker of the project.
        """

        filters = {"project_id": project_id, "user_id": user.id, "role": LabelProjectRoles.Reviewer}
        return ProjectRole.find_one(filters) is not None

    @staticmethod
    def can_create_project(user: User):
        """
        Check if target user can create a project.
        """

        return user.is_staff

    @staticmethod
    def can_edit_project(user: User, project_id: str):
        """
        Check if target user can edit the project.
        """

        return ProjectRole.is_owner(user, project_id)

    @staticmethod
    def can_init_project(user: User, project_id):
        """
        Check if target user can init the project.
        """

        return ProjectRole.is_manager(user, project_id)

    @staticmethod
    def can_view_project(user: User, project_id):
        """
        Check if target user can view the project.
        """

        return ProjectRole.is_member(user, project_id)

    @staticmethod
    def can_view_project_progress(user: User, project_id):
        """
        Check if target user can view the project progress.
        """

        return ProjectRole.is_gte_leader(user, project_id)

    @staticmethod
    def can_assign_leader(user: User, project_id):
        """
        Check if target user can assign a leader to the project.
        """

        return ProjectRole.is_manager(user, project_id)

    @staticmethod
    def can_view_all_tasks(user: User, project_id):
        """
        Check if target user can view all tasks of the project.
        """

        return ProjectRole.is_gt_leader(user, project_id)

    @staticmethod
    def can_qa_project(user: User, project_id):
        """
        Check if target user can QA the project.
        """

        return ProjectRole.is_owner(user, project_id)


class TaskRole(BaseModel):
    """
    The role of a user in a task.
    Each project can contain multiple tasks, and users can be assigned to different roles in different tasks.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        return cls.db["label_task_roles"]

    id: str
    project_id: str
    task_id: str
    user_id: str
    user_name: str
    role: str
    is_active: bool = True  # if the user is active in this task

    # Below are kinds of numbers of this user.
    # Roughly speaking, they are divided into two parts:
    # - The task progress bonded numbers.
    #   These numbers presents the task progress of this user.
    #   If the team leader decide to replace an old user, these numbers will be inherited by the new user.
    # - The user bonded numbers
    #   These numbers presents the user's contribution to the task.
    #   If the team leader decide to replace an old user, the old user's number will be kept and the new user will start from 0.
    label_num_waiting: int = 0  # the num of images wait for label
    review_num_waiting: int = 0  # the num of images wait for review
    review_num_rejected: int = 0  # the num of images rejected in review
    review_num_accepted: int = 0  # the num of accepted in review
    label_completed: bool = False  # this is true when all images are labeled
    review_completed: bool = False  # this is true when all images are passed review

    @classmethod
    def _check_init_role(cls, project: LabelProject, task: "LabelTask", users: List[User], role: str):
        """
        Check the pre-conditions of init the role.

        - The role must be task bonded.
        - If the role is of leader type, there can be only one user.
        - If the role is of review type, the review must be enabled.
        - If the role is of labeler, the number of users must be equal to label_times.
        - If the role is of reviewer, the number of users must be equal to review_times.
        - If the role can be assigned to any number of users before.
        """

        if role not in LabelProjectRoles.TaskBondedRoles_:
            raise LabelTaskError(f"Cannot add role {role} to task.")

        if role in LabelProjectRoles.Leaders_ and len(users) > 1:
            raise LabelTaskError(f"Cannot add more than one {role} to task.")

        if role in LabelProjectRoles.ReviewKinds_ and len(users) >= 1 and project.review_times == 0:
            raise LabelTaskError(f"Cannot add {role} because review is not enabled.")

        if role == LabelProjectRoles.Labeler and len(users) != project.label_times:
            raise LabelTaskError(f"Must set exactly {project.label_times} labeler(s) to task one time.")

        if role == LabelProjectRoles.Reviewer and len(users) != project.review_times:
            raise LabelTaskError(f"Must set exactly {project.review_times} reviewer(s) to task one time.")

        filters = {"task_id": task.id, "role": role, "is_active": True}
        num_active = TaskRole.count_num(filters)
        if num_active > 0:
            msg = f"Cannot set {role}, task already has {num_active} roles, you can only replace one of them."
            raise LabelTaskError(msg)
        return True

    @classmethod
    def _init_roles(cls,
                    task: "LabelTask",
                    users: List[User],
                    role: str
                    ) -> List["TaskRole"]:
        """
        Create the task role object and corresponding project role for each user.
        """

        roles = []
        label_num_waiting = task.num_total
        for user in users:
            role_id = gen_uuid()
            task_role = cls(id=role_id,
                            label_num_waiting=label_num_waiting,
                            project_id=task.project_id,
                            task_id=task.id,
                            user_id=user.id,
                            user_name=user.name,
                            role=role)
            task_role.batch_save()
            roles.append(task_role)

        cls.finish_batch_save()
        ProjectRole.add_roles(task.project, [u.id for u in users], role)
        return roles

    @classmethod
    def _init_image_role_data(cls, task: "LabelTask", roles: List["TaskRole"]):
        """
        Init the role data on every image of the task.
        """

        update_data = {}
        filters = {"task_id": task.id}
        LTIModel = LabelTaskImage(task.dataset_id)
        for role in roles:
            if role.role in LabelProjectRoles.Leaders_:
                update_data[f"role_status.{role.role}"] = LabelTaskImageStatus.Labeling
            else:
                update_data[f"role_status.{role.role}_{role.user_id}"] = LabelTaskImageStatus.Labeling

        LTIModel.update_many(filters, update_data)

    @classmethod
    def init_roles(cls,
                   task: "LabelTask",
                   users: List[User],
                   role: str
                   ) -> List["TaskRole"]:
        """
        Initialize the role of a task, assign the role to users.
        - check pre-conditions
        - create task role and project role for every user
        - init role data on every image of the task

        Task roles can only be set in two ways:
        - init_roles: grant one role to all target users in the same time
        - replace_role: replace one user with another user for a role
        """

        cls._check_init_role(task.project, task, users, role)
        roles = cls._init_roles(task, users, role)
        cls._init_image_role_data(task, roles)
        return roles

    @classmethod
    def _check_replace_role(cls, task: "LabelTask", old_user: User, new_user: User, role: str):
        """
        Check the pre-conditions of replace the role.
        - The role must be task bonded.
        - The old user and new user must be different.
        - The old user must already bear the role in the task.
        - The new user must not bear the role in the task.
        """

        if role not in LabelProjectRoles.TaskBondedRoles_:
            raise LabelTaskError(f"Cannot set role {role} to task.")

        if old_user.id == new_user.id:
            raise LabelTaskError(f"Cannot replace {role} with the same user.")

        filters = {"task_id": task.id, "user_id": old_user.id, "role": role, "is_active": True}
        old_role = TaskRole.find_one(filters)
        if old_role is None:
            raise LabelTaskError(f"Cannot find old user of {role} role in this task.")

        filters["user_id"] = new_user.id
        new_role = TaskRole.find_one(filters)
        if new_role is not None:
            raise LabelTaskError(f"Cannot replace user with new user, because he/she is already in this task.")

        return old_role

    @staticmethod
    def _transfer_roles(task: "LabelTask", old_role: "TaskRole", new_role: "TaskRole"):
        """
        Transfer the role data of task from old role to new role.
        If the user of old role does not bear any role in the project, delete project role for the user.
        """

        if old_role.task_id != new_role.task_id:
            raise LabelTaskError(f"Cannot transfer role to another task, {old_role.task_id} != {new_role.task_id}.")
        if old_role.role != new_role.role:
            raise LabelTaskError(f"Cannot transfer role to another role, {old_role.role} != {new_role.role}.")

        # transfer task progress
        new_role.label_num_waiting = old_role.label_num_waiting
        new_role.review_num_waiting = old_role.review_num_waiting
        new_role.review_num_rejected = old_role.review_num_rejected
        new_role.review_num_accepted = old_role.review_num_accepted
        new_role.label_completed = old_role.label_completed
        new_role.review_completed = old_role.review_completed

        # save status
        old_role.is_active = False
        old_role.batch_save()
        new_role.batch_save()
        TaskRole.finish_batch_save()

        # delete old role from project
        filters = {"project_id": task.project_id, "is_active": True,
                   "user_id"   : old_role.user_id, "role": old_role.role,
                   }
        has_active_role = TaskRole.count_num(filters) > 0
        if not has_active_role:
            ProjectRole.del_role(task.project, old_role.user_id, old_role.role)

    @staticmethod
    def _transfer_image_role_data(task: "LabelTask", old_role: "TaskRole", new_role: "TaskRole"):
        """
        Transfer role data of every image in task from old role to new role.
        """

        if old_role.role not in LabelProjectRoles.Workers_:  # we only transfer image role data for workers
            return

        # transfer image status
        LTIModel = LabelTaskImage(task.dataset_id)
        old_field = f"role_status.{old_role.role}_{old_role.user_id}"
        new_field = f"role_status.{new_role.role}_{new_role.user_id}"
        pipelines = [
            {"$set": {new_field: f"${old_field}"}},
            {"$unset": old_field}
        ]
        LTIModel.get_collection().update_many({"task_id": task.id}, pipelines)

        # transfer label data:
        ts = str(int(time.time()))
        new_user_id = new_role.user_id
        new_user_name = new_role.user_name
        if old_role.role == LabelProjectRoles.Labeler:
            copy_data = {f"labels.{new_role.user_id}": f"$labels.{old_role.user_id}"}
            modify_cond = {"task_id": task.id, f"labels.{new_user_id}": {"$exists": True}}
            modify_data = {
                f"labels.{new_user_id}": {
                    "$map": {
                        "input": f"$labels.{new_user_id}",
                        "as"   : "label",
                        "in"   : {
                            "$mergeObjects": [
                                "$$label",
                                {
                                    "id"       : {"$concat": ["$$label.id", f"_{ts}", ts]},
                                    "user_id"  : new_user_id,
                                    "user_name": new_user_name
                                }
                            ]
                        }
                    }
                }
            }
        elif old_role.role == LabelProjectRoles.Reviewer:
            copy_data = {f"reviews.{new_role.user_id}": f"$reviews.{old_role.user_id}"}
            modify_cond = {"task_id": task.id, f"reviews.{new_user_id}": {"$exists": True}}
            modify_data = {
                f"reviews.{new_user_id}": {
                    "$map": {
                        "input": f"$reviews.{new_user_id}",
                        "as"   : "review",
                        "in"   : {
                            "$mergeObjects": [
                                "$$review",
                                {
                                    "id"       : {"$concat": ["$$review.id", f"_{ts}"]},
                                    "user_id"  : new_user_id,
                                    "user_name": new_user_name
                                }
                            ]
                        }
                    }
                }
            }
        else:
            return

        # copy old role data to new role, and modified copied data according to new user
        LTIModel.get_collection().update_many({"task_id": task.id}, [{"$set": copy_data}])  # copy
        LTIModel.get_collection().update_many(modify_cond, [{"$set": modify_data}])  # modify

    @classmethod
    def replace_role(cls,
                     task: "LabelTask",
                     old_user: User,
                     new_user: User,
                     role: str):
        """
        Reassign the role of task from old user to new user, transfer role data of task and task images accordingly.
        """

        old_role = cls._check_replace_role(task, old_user, new_user, role)
        new_role = TaskRole._init_roles(task, [new_user], role)[0]
        cls._transfer_roles(task, old_role, new_role)
        cls._transfer_image_role_data(task, old_role, new_role)
        return old_role, new_role

    @staticmethod
    def is_task_label_leader(user: User, task_id: str):
        """
        Check if target user is label leader of task.
        """

        filters = {"task_id": task_id, "user_id": user.id, "is_active": True, "role": LabelProjectRoles.LabelLeader}
        return TaskRole.find_one(filters) is not None

    @staticmethod
    def is_task_review_leader(user: User, task_id: str):
        """
        Check if target user is review leader of task.
        """

        filters = {"task_id": task_id, "user_id": user.id, "is_active": True, "role": LabelProjectRoles.ReviewLeader}
        return TaskRole.find_one(filters) is not None

    @staticmethod
    def is_task_labeler(user: User, task_id):
        """
        Check if target user is labeler of task.
        """

        filters = {"task_id": task_id, "user_id": user.id, "is_active": True, "role": LabelProjectRoles.Labeler}
        return TaskRole.find_one(filters) is not None

    @staticmethod
    def is_task_reviewer(user: User, task_id):
        """
        Check if target user is reviewer of task.
        """

        filters = {"task_id": task_id, "user_id": user.id, "is_active": True, "role": LabelProjectRoles.Reviewer}
        return TaskRole.find_one(filters) is not None

    @staticmethod
    def can_init_label_worker(user: User, task_id):
        """
        Check if target user can init label worker for task.
        """

        if not TaskRole.is_task_label_leader(user, task_id):
            return False

        # task has no labeler
        filters = {"task_id": task_id, "is_active": True, "role": LabelProjectRoles.Labeler}
        return TaskRole.find_one(filters) is None

    @staticmethod
    def can_init_review_worker(user: User, task_id):
        """
        Check if target user can init review worker for task.
        """

        if not TaskRole.is_task_review_leader(user, task_id):
            return False

        # task has no reviewer
        filters = {"task_id": task_id, "is_active": True, "role": LabelProjectRoles.Reviewer}
        return TaskRole.find_one(filters) is None

    @staticmethod
    def can_replace_label_worker(user: User, task_id):
        """
        Check if target user can replace label worker for task.
        """

        return TaskRole.is_task_label_leader(user, task_id)

    @staticmethod
    def can_replace_review_worker(user: User, task_id):
        """
        Check if target user can replace review worker for task.
        """

        return TaskRole.is_task_review_leader(user, task_id)

    @staticmethod
    def can_commit_review(user: User, task_id):
        """
        Check if target user can commit review for task.
        """

        return TaskRole.is_task_reviewer(user, task_id)

    @staticmethod
    def can_restart_task(user: User, task_id):
        """
        Check if target user can restart task.
        """

        return TaskRole.is_task_label_leader(user, task_id)

    @staticmethod
    def can_qa_task(user: User, project_id):
        """
        Check if target user can qa task.
        """

        return ProjectRole.is_manager(user, project_id)

    @staticmethod
    def can_view_all_roles(user: User, project_id):
        """
        Check if target user can view all roles' data.
        """

        return ProjectRole.is_gte_leader(user, project_id)

    @staticmethod
    def can_label_image(user: User, task_id):
        """
        Check if target user can label image.
        """

        return TaskRole.is_task_labeler(user, task_id)

    @staticmethod
    def can_review_image(user: User, task_id):
        """
        Check if target user can review image.
        """

        return TaskRole.is_task_reviewer(user, task_id)

    @staticmethod
    def update_progress_for_all_roles(task_id):
        """
        Update progress for all roles of task.
        This ensures the progress for every role is up-to-date, without concerning the data integrity and consistency.

        - 1. count image status for every role, update their count number
        - 2. for every role, label_completed = False, review_completed = False
        - 3. for every role, label_completed = True if label_num_waiting == 0 and review_num_rejected == 0
        - 4. for every role, review_completed = True if project.review_times == 0 review_num_accepted == task.num_total
        - 5. task status = LabelTaskStatus.Reviewing if all(role.label_completed is True and role.review_completed is True for role in roles)
        - 6. project update subtask progress

        """

        task = LabelTask.find_one({"id": task_id})
        dataset_id = task.dataset_id

        # 1. count image status for every role, update their count number
        facet, project = {}, {}
        roles = list(TaskRole.find_many({"task_id": task_id, "is_active": True}))
        for role in roles:
            if role.role == LabelProjectRoles.Labeler:
                for status in LabelTaskImageStatus.ALL_:
                    output = f"{role.user_id}_{status}"
                    target = f"role_status.labeler_{role.user_id}"
                    match = {target: status, "task_id": task_id}
                    facet[output] = [{"$match": match}, {"$count": status}]
                    project[f"labeler_{role.user_id}.{status}"] = {"$arrayElemAt": [f"${output}.{status}", 0]}
            elif role.role == LabelProjectRoles.Reviewer:
                for status in LabelTaskImageStatus.ALL_:
                    output = f"{role.user_id}_{status}"
                    target = f"role_status.reviewer_{role.user_id}"
                    match = {target: status, "task_id": task_id}
                    facet[output] = [{"$match": match}, {"$count": status}]
                    project[f"reviewer_{role.user_id}.{status}"] = {"$arrayElemAt": [f"${output}.{status}", 0]}
            elif role.role in LabelProjectRoles.Leaders_:
                for status in LabelTaskImageStatus.ALL_:
                    output = f"{role.role}_{status}"
                    target = f"role_status.{role.role}"
                    match = {target: status, "task_id": task_id}
                    facet[output] = [{"$match": match}, {"$count": status}]
                    project[f"{role.role}.{status}"] = {"$arrayElemAt": [f"${output}.{status}", 0]}

        LTIModel = LabelTaskImage(dataset_id)
        pipeline = [{"$facet": facet}, {"$project": project}]
        counter = list(LTIModel.aggregate(pipeline))[0]

        for role in roles:
            if role.role == LabelProjectRoles.Labeler:
                key = f"labeler_{role.user_id}"
            elif role.role == LabelProjectRoles.Reviewer:
                key = f"reviewer_{role.user_id}"
            elif role.role in LabelProjectRoles.Leaders_:
                key = role.role
            else:
                continue

            role_count = counter.get(key, {})
            role.label_num_waiting = role_count.get(LabelTaskImageStatus.Labeling, 0)
            role.review_num_waiting = role_count.get(LabelTaskImageStatus.Reviewing, 0)
            role.review_num_rejected = role_count.get(LabelTaskImageStatus.Rejected, 0)
            role.review_num_accepted = role_count.get(LabelTaskImageStatus.Accepted, 0)

        # 2. for every role, label_completed = False, review_completed = False
        for role in roles:
            role.label_completed = False
            role.review_completed = False

        # 3. for every role, label_completed = True
        #   if label_num_waiting == 0 and review_num_rejected == 0
        for role in roles:
            label_completed = role.label_num_waiting == 0 and role.review_num_rejected == 0
            role.label_completed = label_completed

        # 4. for every role, review_completed = True
        #   if project.review_times == 0 review_num_accepted == task.num_total
        project = LabelProject.find_one({"id": task.project_id})
        for role in roles:
            review_completed = project.review_times == 0 or role.review_num_accepted == task.num_total
            role.review_completed = review_completed

        for role in roles:
            role.batch_save()
        TaskRole.finish_batch_save()

        # 5. task status = LabelTaskStatus.Reviewing
        #   if all(role.label_completed == True and role.all review_completed == True for role in roles)
        # 6. project update subtask counter
        if all(role.label_completed is True and role.review_completed is True for role in roles):
            task.status = LabelTaskStatus.Reviewing
            task.save()
            project.update_subtask_counter()


class LabelTask(BaseModel):
    """
    The label task model.
    """

    @classmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        return cls.db["label_tasks"]

    # the mandatory fields
    id: str
    idx: int
    project_id: str
    dataset_id: str
    created_ts: int

    # the optional fields
    num_total: int = 0
    status: str = LabelTaskStatus.Waiting

    _project = None

    @property
    def project(self):
        if self._project is None:
            self._project = LabelProject.find_one({"id": self.project_id})
        return self._project

    def set_leader(self, leader: User, role: str):
        """
        Set leader for the task.
        Leader role can be either label leader or review leader.
        """

        if role not in LabelProjectRoles.Leaders_:
            raise LabelTaskError(f"Cannot set leader by role {role}.")

        old_leader_role = TaskRole.find_one({"task_id": self.id, "role": role, "is_active": True})
        if old_leader_role is not None:
            old_leader = User.find_one({"id": old_leader_role.user_id})
            old_role, new_role = TaskRole.replace_role(self, old_leader, leader, role)
        else:
            new_role = TaskRole.init_roles(self, [leader], role)[0]
            old_role = new_role
            if self.status == LabelTaskStatus.Waiting:
                if role == LabelProjectRoles.LabelLeader and self.project.review_times == 0:
                    self.status = LabelTaskStatus.Working
                    self.save()
                    self.project.update_subtask_counter()
                elif role == LabelProjectRoles.ReviewLeader:
                    self.status = LabelTaskStatus.Working
                    self.save()
                    self.project.update_subtask_counter()
        return old_role, new_role

    def init_workers(self, workers: List[User], role: str):
        """
        Init workers for the task, set all workers of role type at the same time.
        Worker role can be either labeler or reviewer.
        """

        worker_roles = TaskRole.init_roles(self, workers, role)
        if role == LabelProjectRoles.Reviewer:
            filters = {"task_id": self.id, "role": LabelProjectRoles.Labeler, "is_active": True}
            labelers = list(TaskRole.find_many(filters))
            if labelers:
                filters = {
                    f"role_status.labeler_{l.user_id}": LabelTaskImageStatus.Reviewing
                    for l in labelers
                }

                LTIModel = LabelTaskImage(self.dataset_id)
                for image in LTIModel.find_many(filters):
                    set_data = {f"role_status.reviewer_{role.user_id}": LabelTaskImageStatus.Reviewing
                                for role in worker_roles}
                    LTIModel.batch_update({"id": image.id}, set_data)
                LTIModel.finish_batch_update()
                TaskRole.update_progress_for_all_roles(self.id)

        return worker_roles

    def replace_worker(self, old_user: User, new_user: User, role: str):
        """
        Designate the old user from role, assign the new user to role.
        """

        return TaskRole.replace_role(self, old_user, new_user, role)

    def restart_task(self):
        """
        Restart a rejected task by leader.
        When team leader restart a task:
        - 1. task status should be 'working'
        - 2. all images' status of all roles should be 'rejected'
        - 3. update progress for all roles
        """

        # 1. task status should be 'working'
        if self.status != LabelTaskStatus.Rejected:
            raise LabelTaskError(f"Cannot restart task, task status {self.status} != {LabelTaskStatus.Rejected}")
        self.status = LabelTaskStatus.Working
        self.save()

        # 2. all images' status of all roles should be 'rejected'
        role_status = {}
        filters = {"task_id": self.id, "is_active": True}
        roles = TaskRole.find_many(filters)
        for role in roles:
            if role.role in LabelProjectRoles.Leaders_:
                role_status[role.role] = LabelTaskImageStatus.Rejected
            elif role.role in LabelProjectRoles.Workers_:
                role_status[f"{role.role}_{role.user_id}"] = LabelTaskImageStatus.Rejected

        LTIModel = LabelTaskImage(self.dataset_id)
        LTIModel.get_collection().update_many({"task_id": self.id}, {"$set": {"role_status": role_status}})

        # 3. update progress for all roles
        TaskRole.update_progress_for_all_roles(self.id)

    def reject_task(self):
        """
        Reject a task by manager.
        """

        if self.status != LabelTaskStatus.Reviewing:
            msg = f"Cannot reject task, task status {self.status} != {LabelTaskStatus.Reviewing}"
            raise LabelTaskError(msg)
        self.status = LabelTaskStatus.Rejected
        self.save()

        self.project.update_subtask_counter()

    def accept_task(self):
        """
        Accept a task by manager.
        """

        if self.status != LabelTaskStatus.Reviewing:
            raise LabelTaskError(f"Cannot accept task, task status {self.status} != {LabelTaskStatus.Reviewing}")

        self.status = LabelTaskStatus.Accepted
        self.save()
        self.project.update_subtask_counter()

    def accept_rejected_task(self):
        """
        Accepted a rejected task by manager.
        """

        if self.status != LabelTaskStatus.Rejected:
            raise LabelTaskError(f"Cannot enforce accept task, task status {self.status} != {LabelTaskStatus.Rejected}")

        self.status = LabelTaskStatus.Accepted
        self.save()
        self.project.update_subtask_counter()

    def qa_task(self, action: str):
        """
        QA a task by manager.
        """

        if action == LabelTaskQAActions.Accept:
            return self.accept_task()
        elif action == LabelTaskQAActions.Reject:
            return self.reject_task()
        elif action == LabelTaskQAActions.ForceAccept:
            return self.accept_rejected_task()
        else:
            raise LabelTaskError(f"Invalid task qa action: {action}")

    def get_max_role(self, user: User):
        """
        Get the role of max permission of current task for the user.
        """

        if ProjectRole.is_gte_leader(user, self.project_id):
            filters = {"task_id": self.id, "is_active": True}
        elif ProjectRole.is_label_worker(user, self.project_id) or ProjectRole.is_review_worker(user, self.project_id):
            filters = {"task_id": self.id, "user_id": user.id, "is_active": True}
        else:
            return None

        roles = list(TaskRole.find_many(filters))
        if not roles:
            return None

        roles = sorted(roles, key=lambda x: LabelProjectRoles.Levels_[x.role])
        return roles[0]


class UserLabelData(_Base):
    """
    The user label data model.
    This does not refer to a mongodb collection directly, but is used as a data serializer.
    """

    user_id: str
    user_name: str
    # [{"category_id": "str", "category_name": "str", "bounding_box": {"xmin": 0.5,...}}...]
    annotations: List[Dict] = []
    id: str = Field(default_factory=gen_uuid)
    created_ts: int = Field(default_factory=current_ts)


class UserReviewData(_Base):
    """
    The user review data model.
    This does not refer to a mongodb collection directly, but is used as a data serializer.
    """

    user_id: str
    user_name: str
    action: str
    label_id: str
    id: str = Field(default_factory=gen_uuid)
    created_ts: int = Field(default_factory=current_ts)


class LabelTaskImageModel(BaseModel):
    """
    The label task image model.
    This model behaves like ImageModel, but is used for label task.
    So to use this model, you should create a LabelTaskImageModel class dynamically with the LabelTaskImage shortcut.
    """

    belong_dataset: ClassVar[str] = None

    id: str
    idx: int
    image_id: int
    task_id: str  # the task id this image belongs to
    url: str  # the same as image url
    url_full_res: str  # the same as image url_full_res
    default_labels: UserLabelData = []  # the default labels come from model pre-process for this image
    labels: Dict[str, List[UserLabelData]] = {}  # the label data for every labeler
    reviews: Dict[str, List[UserReviewData]] = {}  # the review data for every reviewer
    role_status: Dict = {}  # the image status for different roles: label_leader, review_leader, labeler_x, reviewer_a

    @classmethod
    def get_collection(cls, *args, **kwargs) -> Collection[_DocumentType]:
        """
        Instead of returning a collection for all dataset, return a collection for each dataset.
        """

        return cls.db[f"label_task_images@dataset_{cls.belong_dataset}"]

    @classmethod
    def get_cls_id(cls):
        """
        Instead of returning the class name directly, return the class name with dataset id.
        """

        return f"{cls.__name__}.{cls.belong_dataset}"

    def can_set_label(self, task: LabelTask, labeler: User):
        """
        Check if target labeler can set label for target task.

        Labeler cannot set label in any of these conditions:
        * the task is not in working status.
        * his label is accepted by all reviewer.
        """

        if task.status != LabelTaskStatus.Working:
            return False

        labels = self.labels.get(labeler.id, [])
        if not labels:
            return True
        label_id = labels[-1].id

        accepted_by_all = False
        for reviewer_id, review_data_list in self.reviews.items():
            for review in review_data_list:
                if review.label_id == label_id and review.action == LabelImageQAActions.Reject:
                    accepted_by_all = False

        return not accepted_by_all

    def _update_label(self, labeler, label_annotations: List[Dict]):
        """
        Update label for target labeler.
        - Add the new label
        - Delete reviews for old label
        """

        new_label = UserLabelData(user_id=labeler.id, user_name=labeler.name, annotations=label_annotations)
        new_labels = [new_label]
        old_labels = self.labels.get(labeler.id, [])
        self.labels[labeler.id] = new_labels
        self.save()

        # delete reviews for old label
        if old_labels:
            old_label = old_labels[0]
            reviews = copy.deepcopy(self.reviews)
            for reviewer_id, review_data_list in reviews.items():
                reviews[reviewer_id] = []
                for review_data in review_data_list:
                    if review_data.label_id != old_label.id:
                        reviews[reviewer_id].append(review_data)
            self.reviews = reviews

        return new_label

    def _update_label_progress(self, task: LabelTask, labeler: User):
        """
        When a labeler labels an image, these status may be changed:
        - 1. his status to this image should be reviewing,
        - 2. all (reviewers', leaders') status to this image should be reviewing,
            if all labeler finished labeling this image
        - 3. update progress for all roles
        """

        # 1. his status to this image should be reviewing
        self.role_status[f"labeler_{labeler.id}"] = LabelTaskImageStatus.Reviewing

        # 2. all (reviewers', leaders') status to this image should be reviewing,
        #   if all labeler finished labeling this image
        all_labeler_status = [s for k, s in self.role_status.items() if k.startswith("labeler_")]
        all_labeler_reviewing = all(s == LabelTaskImageStatus.Reviewing for s in all_labeler_status)
        if all_labeler_reviewing:
            update = {k: LabelTaskImageStatus.Reviewing for k, s in self.role_status.items()}
            self.role_status.update(update)

        self.save()

        # 3. update progress for all roles
        TaskRole.update_progress_for_all_roles(task.id)

    def set_label(self, task: LabelTask, labeler: User, label_annotations: List[Dict]):
        """
        Update the label annotations for a labeler.

        :param task: the task this image belongs to.
        :param labeler: the labeler who are updating this image labels.
        :param label_annotations: the label annotations.
        :return: the label data dict.

        A sample label_annotations::

            label_annotations = [
                {
                    "category_name": "str",
                    "category_id"  : "str",
                    "bounding_box" : {
                        "xmin": float,
                        "ymin": float,
                        "xmax": float,
                        "ymax": float,
                        }
                }
            ]

        """
        new_label = self._update_label(labeler, label_annotations)
        self._update_label_progress(task, labeler)
        return new_label.dict()

    def can_set_review(self, task: LabelTask, reviewer: User, label_id: str):
        """
        Reviewer cannot set review in any of these conditions:
         - the task is not in working status.
         - image is not labeled by all labelers.
         - the target label does not exist
         - reviewer has reviewed target label before.
        """

        if not label_id:
            return False

        if task.status != LabelTaskStatus.Working:
            return False

        labeler_status = [s for k, s in self.role_status.items() if k.startswith("labeler_")]
        if any(s in LabelTaskImageStatus.WaitForLabeling_ for s in labeler_status):
            return False

        found_label = False
        for labeler_id, label_data_list in self.labels.items():
            for label_data in label_data_list:
                if label_data.id == label_id:
                    found_label = True
                    break
        if not found_label:
            return False

        for review_data in self.reviews.get(reviewer.id, []):
            if review_data.label_id == label_id:
                return False

        return True

    def _update_review(self, reviewer, label_id, action):
        """
        Update the review to label for target reviewer.
        - Add the new review
        - Remove the old review to target label
        """

        new_review = UserReviewData(user_id=reviewer.id, user_name=reviewer.name, label_id=label_id, action=action)
        old_reviews = self.reviews.get(reviewer.id, [])
        new_reviews = [new_review]
        for review in old_reviews:
            if review.label_id != label_id:
                new_reviews.append(review)
        self.reviews[reviewer.id] = new_reviews

        self.save()
        return new_review

    def _get_labeler_id_for_label(self, label_id):
        labeler_id = None
        for labeler_id, label_data_list in self.labels.items():
            for label_data in label_data_list:
                if label_data.id == label_id:
                    return labeler_id
        return labeler_id

    def _update_review_progress_for_accept(self, task: LabelTask, reviewer: User, label_id: str):
        """
        When a reviewer accepts a label:
        - 1. his status of this image should be accepted,
            if he accepted all labels of this image
        - 2. target labeler's status of this image should be accepted,
            if his label is accepted by all reviewer
        - 3. all leaders status of this image should be accepted,
            if all labelers' statuses of this image are accepted
        - 4. update progress for all roles
        """

        labeler_id = self._get_labeler_id_for_label(label_id)

        # 1. his status of this image should be accepted,
        #   if he accepted all labels of this image
        all_labels = {}
        for _, label_data_list in self.labels.items():
            for label_data in label_data_list:
                all_labels[label_data.id] = False
        for review_data in self.reviews.get(reviewer.id, []):
            all_labels[review_data.label_id] = review_data.action == LabelImageQAActions.Accept
        if all(all_labels.values()):
            self.role_status[f"reviewer_{reviewer.id}"] = LabelTaskImageStatus.Accepted

        # 2. target labeler's status of this image should be accepted,
        #   if his label is accepted by all reviewer
        all_reviewers = [k for k in self.role_status if k.startswith("reviewer_")]
        all_reviewer_accepted = {k.split("_")[-1]: False for k in all_reviewers}
        for review_id, review_data_list in self.reviews.items():
            for review_data in review_data_list:
                if review_data.label_id == label_id:
                    all_reviewer_accepted[review_id] = review_data.action == LabelImageQAActions.Accept
        if all(all_reviewer_accepted.values()):
            self.role_status[f"labeler_{labeler_id}"] = LabelTaskImageStatus.Accepted

        # 3. all leaders status of this image should be accepted,
        #   if all labelers' statuses of this image are accepted
        all_labeler_status = [s for k, s in self.role_status.items() if k.startswith("labeler_")]
        all_labeler_accepted = all(s == LabelTaskImageStatus.Accepted for s in all_labeler_status)
        if all_labeler_accepted:
            self.role_status["label_leader"] = LabelTaskImageStatus.Accepted
            self.role_status["review_leader"] = LabelTaskImageStatus.Accepted

        self.save()

        # 4. update progress for all roles
        TaskRole.update_progress_for_all_roles(task.id)

    def _update_review_progress_for_reject(self, task: LabelTask, reviewer: User, label_id: str):
        """
        When a reviewer rejects a label:
        - 1. his status of this image should be rejected,
        - 2. the target labeler's status of this image should be rejected,
        - 3. all leaders status of this image should be rejected,
        - 4. update progress for all roles
        """
        labeler_id = self._get_labeler_id_for_label(label_id)

        # 1. his review status of this image should be rejected,
        self.role_status[f"reviewer_{reviewer.id}"] = LabelTaskImageStatus.Rejected

        # 2. the target labeler's status of this image should be rejected,
        self.role_status[f"labeler_{labeler_id}"] = LabelTaskImageStatus.Rejected

        # 3. all leaders status of this image should be rejected,
        self.role_status["label_leader"] = LabelTaskImageStatus.Rejected
        self.role_status["review_leader"] = LabelTaskImageStatus.Rejected

        self.save()

        # 4. update progress for all roles by mongodb aggregation and batch updating
        TaskRole.update_progress_for_all_roles(task.id)

    def set_review(self, task: LabelTask, reviewer: User, label_id: str, action: str):
        """
        Update the review for a label.

        :param task: the task this image belongs to.
        :param reviewer: the reviewer who are reviewing target label.
        :param label_id: the target label id that reviewer is reviewing.
        :param action: the review action.
        """

        new_review = self._update_review(reviewer, label_id, action)
        if action == LabelImageQAActions.Accept:
            self._update_review_progress_for_accept(task, reviewer, label_id)
        else:
            self._update_review_progress_for_reject(task, reviewer, label_id)
        return new_review.dict()


_image_task_models = {}


def LabelTaskImage(dataset_id: str) -> Type[LabelTaskImageModel]:
    """
    A shortcut to create the LabelTaskImageModel for target dataset.
    """

    model = _image_task_models.setdefault(dataset_id, copy.deepcopy(LabelTaskImageModel))
    model.belong_dataset = dataset_id
    return model
