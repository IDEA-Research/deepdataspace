"""
deepdataspace.server.resources.api_v1

All APIs of version 1.
"""

from django.urls import path

from deepdataspace.server.resources.api_v1 import label_tasks
from deepdataspace.server.resources.api_v1 import lints
from deepdataspace.server.resources.api_v1 import login
from deepdataspace.server.resources.api_v1 import ping
from deepdataspace.server.resources.api_v1.annotations import AnnotationsView
from deepdataspace.server.resources.api_v1.comparisons import ComparisonsView
from deepdataspace.server.resources.api_v1.datasets import DatasetView
from deepdataspace.server.resources.api_v1.datasets import DatasetsView
from deepdataspace.server.resources.api_v1.image_flags import ImageFlagsView
from deepdataspace.server.resources.api_v1.images import ImagesView
from deepdataspace.server.resources.api_v1.label_clone import LabelCloneView
from deepdataspace.server.resources.api_v1.object_confirm import ObjectConfirmView

urls = [
    path("ping", ping.PingView.as_view()),
    path("login", login.LoginView.as_view()),
    path("logout", login.LogoutView.as_view()),
    path("user_info", login.UserInfoView.as_view()),
    path("images", ImagesView.as_view()),
    path("datasets", DatasetsView.as_view()),
    path("datasets/<dataset_id>", DatasetView.as_view()),
    path("image_flags", ImageFlagsView.as_view()),
    path("label_clone", LabelCloneView.as_view()),
    path("object_confirm", ObjectConfirmView.as_view()),
    path("annotations", AnnotationsView.as_view()),
    path("comparisons", ComparisonsView.as_view()),
    path("label_projects", label_tasks.ProjectsView.as_view()),
    path("label_projects/<project_id>", label_tasks.ProjectView.as_view()),
    path("label_project_configs/<project_id>", label_tasks.ProjectConfigView.as_view()),
    path("label_project_qa/<project_id>", label_tasks.ProjectQAView.as_view()),
    path("label_project_export/<project_id>", label_tasks.ProjectExportView.as_view()),
    path("label_tasks", label_tasks.TasksView.as_view()),
    path("label_task_configs/<task_id>", label_tasks.TaskConfigView.as_view()),
    path("label_task_roles/<task_id>", label_tasks.TaskRolesView.as_view()),
    path("label_task_images/<task_id>", label_tasks.TaskImagesView.as_view()),
    path("label_task_image_labels/<task_image_id>", label_tasks.TaskImageLabelView.as_view()),
    path("label_task_image_reviews/<task_image_id>", label_tasks.TaskImageReviewView.as_view()),
    path("label_task_leaders", label_tasks.TaskLeadersView.as_view()),
    path("label_task_workers/<task_id>", label_tasks.TaskWorkerView.as_view()),
    path("label_task_reassign/<task_id>", label_tasks.TaskReassignView.as_view()),
    path("label_task_restart/<task_id>", label_tasks.TaskReStartView.as_view()),
    path("label_task_qa/<task_id>", label_tasks.TaskQAView.as_view()),
    path("user_name_lints", lints.UserNameLintsView.as_view()),
    path("dataset_name_lints", lints.DatasetNameLintsView.as_view()),
]
