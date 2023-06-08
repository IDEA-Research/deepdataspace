"""
deepdataspace.scripts.label_project_cmds

This file adds label project related  sub-command to ddsop command.
"""

import json
import os

import click

from deepdataspace.scripts import ddsop


@ddsop.command("lpexport", help="Export the labels of a label project.")
@click.argument("project_name")
def lp_export(project_name):
    from deepdataspace.model import TaskRole
    from deepdataspace.model import LabelTask
    from deepdataspace.model import LabelProject
    from deepdataspace.model import LabelTaskImage
    from deepdataspace.constants import LabelImageQAActions

    projects = LabelProject.find_many({"name": project_name})
    projects = list(projects)
    if len(projects) == 0:
        print(f"project [{project_name}] not found")
        return
    elif len(projects) > 1:
        msg = f"Multiple label projects are found by name [{project_name}], " \
              f"please select the one you want to export by index number.\n"
        for idx, project in enumerate(projects):
            owner_name = project.owner["name"]
            datasets = ", ".join([dataset["name"] for dataset in project.datasets[:3]])
            msg += f"{idx + 1}: owner={owner_name}, datasets={datasets} ...\n"
        index = int(input(msg))
        try:
            index = int(index)
            project = projects[index - 1]
        except Exception:
            print(f"Invalid choice, exit...")
            return
    else:
        project = projects[0]

    print(f"exporting project [{project.name}]...")
    output_dir = os.path.join("data", "lp_exports", f"{project.name}.{project.id}")
    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    for dataset in project.datasets:
        print(f"exporting dataset [{dataset['name']}]...")

        dataset_id = dataset["id"]
        dataset_name = dataset["name"]
        output_data = {
            "dataset_id"  : dataset_id,
            "dataset_name": dataset_name,
            "images"      : []
        }
        output_file = os.path.join(output_dir, f"{dataset_name}.{dataset_id}.json")

        tasks = LabelTask.find_many({"project_id": project.id, "dataset_id": dataset_id},
                                    sort=[("idx", 1)])

        for task in tasks:
            roles = TaskRole.find_many({"task_id": task.id, "is_active": True})
            roles = {r.user_id: r for r in roles}

            LTIModel = LabelTaskImage(task.dataset_id)
            for image in LTIModel.find_many({}, sort=[("idx", 1)]):
                image_data = {
                    "task_id" : task.id,
                    "image_id": image.image_id,
                    "labels"  : []
                }

                defaults = image.default_labels.annotations
                for anno in defaults:
                    anno["labeler"] = "_default"
                    anno["accepted_by"] = []
                    anno["rejected_by"] = []
                    image_data["labels"].append(anno)

                review_status = {}
                reviews = image.reviews
                for reviewer_id, review_data_list in reviews.items():
                    reviewer_name = roles[reviewer_id].user_name
                    for review_data in review_data_list:
                        label_id = review_data.label_id
                        if review_data.action == LabelImageQAActions.Accept:
                            review_status.setdefault(label_id, {}).setdefault("accepted_by", []).append(reviewer_name)
                        else:
                            review_status.setdefault(label_id, {}).setdefault("rejected_by", []).append(reviewer_name)

                labels = image.labels
                for labeler_id, label_data in labels.items():
                    label_data = label_data[0]

                    for anno in label_data.annotations:
                        anno["labeler"] = label_data.user_name
                        anno["accepted_by"] = review_status.get(label_data.id, {}).get("accepted_by", [])
                        anno["rejected_by"] = review_status.get(label_data.id, {}).get("rejected_by", [])
                        image_data["labels"].append(anno)

                output_data["images"].append(image_data)

        with open(output_file, "w", encoding="utf8") as fp:
            json.dump(output_data, fp)
        print(f"exported dataset [{dataset_name}] to [{output_file}]")
