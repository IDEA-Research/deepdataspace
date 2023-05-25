"""
This script generates seed data for manual testing.
"""

import os
import sys

from deepdataspace.model.label_task import *
from deepdataspace.model.label import Label
from deepdataspace.constants import LabelName
from deepdataspace.model.dataset import DataSet
from deepdataspace.model.category import Category


def create_users():
    print(f"creating users")
    all_user_ids = []
    users_: Dict[str, List[User]] = {
        "staff"        : [],
        "owner"        : [],
        "manager"      : [],
        "label_leader" : [],
        "review_leader": [],
        "reviewer"     : [],
        "labeler"      : [],
        "others"       : []
    }

    for user_type, user_list in users_.items():
        for i in range(2):
            user_name = f"seed_{user_type}_{i:02d}"
            user = User.create_user(user_name, user_type == "staff")
            user.set_password("12345678")
            user_list.append(user)
            all_user_ids.append(user.id)
            print(f"created user: {user}")


def create_datasets():
    print(f"creating datasets")

    datasets: List[DataSet] = []
    cur_dir = os.path.dirname(os.path.abspath(__file__))
    res_dir = os.path.join(cur_dir, "resource")
    image_path = os.path.join(res_dir, "image", "1.jpg")

    sizes = [100, 5, 6, 7]

    for dataset_size in sizes:
        for i in range(2):
            dataset = DataSet.create_dataset(f"seed_dataset_{dataset_size:03d}_{i:02d}")

            for j in range(dataset_size):
                image = dataset.add_image(f"file://{image_path}", width=640, height=426)
                image.add_annotation("cat", LabelName.GroundTruth, LabelType.GroundTruth,
                                     bbox=(10, 10, 100, 100))

            datasets.append(dataset)
            print(f"created dataset: {dataset}")


def create_projects():
    user = User.find_one({"name": "seed_staff_00"})
    datasets = DataSet.find_many({"name": {"$regex": f"^seed_dataset"}})
    for idx, dataset in enumerate(datasets):
        project = LabelProject.create_project(f"seed_project_{idx:02}", user,
                                              datasets, managers=[user],
                                              categories=["cat", "dog"])
        project.init_project(batch_size=0, label_times=1, review_times=1)

        # for task in LabelTask.find_many({"project_id": project.id}):
        #     task.set_leader(user, LabelProjectRoles.LabelLeader)
        #     task.set_leader(user, LabelProjectRoles.ReviewLeader)
        #     task.init_workers([user], LabelProjectRoles.Labeler)
        #     task.init_workers([user], LabelProjectRoles.Reviewer)


def create():
    create_users()
    create_datasets()
    create_projects()


def delete_users():
    print(f"deleting all seed users")
    filters = {"name": {"$regex": f"^seed_"}}
    User.delete_many(filters)
    print("deleted all seed users")


def delete_datasets():
    print(f"deleting all seed datasets")

    filters = {"name": {"$regex": f"^seed_"}}
    datasets = DataSet.find_many(filters)

    dataset_ids = [d.id for d in datasets]
    Label.delete_many({"dataset_id": {"$in": dataset_ids}})
    Category.delete_many({"dataset_id": {"$in": dataset_ids}})
    for did in dataset_ids:
        Image(did).get_collection().drop()

    DataSet.delete_many({"id": {"$in": dataset_ids}})
    print("deleted all seed datasets with related labels and categories")


def delete_projects():
    print(f"deleting all seed label projects")

    projects = LabelProject.find_many({"name": {"$regex": f"^seed_"}})
    project_ids = [p.id for p in projects]

    LabelTask.delete_many({"project_id": {"$in": project_ids}})
    ProjectRole.delete_many({"project_id": {"$in": project_ids}})
    TaskRole.delete_many({"project_id": {"$in": project_ids}})

    for project in projects:
        for dataset in project.datasets:
            LabelTaskImage(dataset["id"]).get_collection().drop()

    LabelProject.delete_many({"id": {"$in": project_ids}})
    print(f"deleted all seed label projects with related label tasks, roles and task images")


def delete():
    delete_users()
    delete_datasets()
    delete_projects()


if __name__ == "__main__":
    action = sys.argv[1]
    if action.lower() == "c":
        create()
    elif action.lower() == "d":
        delete()
    elif action.lower() == "r":
        delete()
        create()
