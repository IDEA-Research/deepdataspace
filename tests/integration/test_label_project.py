"""
This module tests kinds of actions to label projects.
"""

import os

import pytest

from deepdataspace.globals import MongoDB
from deepdataspace.model.label_task import *
from deepdataspace.model.image import Image
from deepdataspace.model.label import Label
from deepdataspace.model.dataset import DataSet
from deepdataspace.model.category import Category


class BaseMixin:
    """
    Provide common functions for all test cases.
    """

    @staticmethod
    def clean_datasets(datasets: List[DataSet]):
        dataset_ids = [d.id for d in datasets]
        Label.delete_many({"dataset_id": {"$in": dataset_ids}})
        Category.delete_many({"dataset_id": {"$in": dataset_ids}})
        for did in dataset_ids:
            Image(did).get_collection().drop()
        DataSet.delete_many({"id": {"$in": dataset_ids}})

    @staticmethod
    def clean_projects(project_list: List[LabelProject]):
        project_ids = [p.id for p in project_list]

        LabelTask.delete_many({"project_id": {"$in": project_ids}})
        ProjectRole.delete_many({"project_id": {"$in": project_ids}})
        TaskRole.delete_many({"project_id": {"$in": project_ids}})

        dataset_ids = []
        for project in project_list:
            ids = [d["id"] for d in project.datasets]
            dataset_ids.extend(ids)

        for did in dataset_ids:
            LabelTaskImage(did).get_collection().drop()

        LabelProject.delete_many({"id": {"$in": project_ids}})


class TestCreateProject(BaseMixin):
    """
    Test creating a label project in all situations.
    - 1. Create a project the normal way.
    - 2. Create a project with dataset already in another project.
    - 3. Create a project without managers.
    - 4. Create a project without datasets.
    - 5. Create a project without categories.
    - 6. Create a project with owner without staff permission.
    """

    @pytest.fixture(scope="class")
    def users(self):
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
                user_name = f"{self.__class__.__name__}_{user_type}_{i:02d}"
                User.delete_many({"name": user_name})
                user = User.create_user(user_name, user_type == "staff")
                user.set_password("12345678")
                user_list.append(user)
                all_user_ids.append(user.id)

        yield users_

        User.delete_many({"id": {"$in": all_user_ids}})

    @pytest.fixture(scope="class")
    def datasets(self):
        datasets: List[DataSet] = []
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        res_dir = os.path.join(os.path.dirname(cur_dir), "resource")
        image_path = os.path.join(res_dir, "image", "1.jpg")

        for i in range(10):
            dataset = DataSet.create_dataset(f"dataset_{i:02d}")

            for j in range(100):
                dataset.add_image(f"file://{image_path}")

            datasets.append(dataset)

        yield datasets

        self.clean_datasets(datasets)

    def test_create_normal(self, users, datasets):
        """
        Test creating a label project the normal way.
        - 1. Create a project with 2 datasets and 2 managers.
        - 2. Check the project properties and progress numbers.
        - 3. Check the project roles.
        """

        # 1. Create a project with 2 datasets and 2 managers.
        owner = users["staff"][0]
        target_datasets = datasets[0:2]
        target_managers = users["manager"][0:2]
        project_name = f"project_00"
        categories = ["dog", "mouse", "cat", "mouse", "DOG", "Mouse"]  # contains duplicated items
        project = LabelProject.create_project(project_name,
                                              owner,
                                              target_datasets,
                                              target_managers,
                                              categories,
                                              project_name,
                                              )

        # 2. Check the project properties and progress numbers.
        fresh_proj = LabelProject.find_one({"id": project.id})
        assert fresh_proj.name == project_name
        assert fresh_proj.status == LabelProjectStatus.Waiting
        assert set([d["id"] for d in fresh_proj.datasets]) == set([d.id for d in target_datasets])
        assert set([m["id"] for m in fresh_proj.managers]) == set([u.id for u in target_managers])
        assert fresh_proj.task_num_total == 0
        assert fresh_proj.task_num_waiting == 0
        assert fresh_proj.task_num_working == 0
        assert fresh_proj.task_num_reviewing == 0
        assert fresh_proj.task_num_accepted == 0
        assert fresh_proj.task_num_rejected == 0
        assert fresh_proj.categories == "cat,dog,mouse"  # categories are sorted and duplicated items are removed

        # 3. Check the project roles.
        filters = {"project_id": project.id, "role": LabelProjectRoles.Owner}
        assert ProjectRole.count_num(filters) == 1
        owner_role = ProjectRole.find_one(filters)
        assert owner.id == owner_role.user_id

        filters = {"project_id": project.id, "role": LabelProjectRoles.Manager}
        assert ProjectRole.count_num(filters) == len(target_managers)
        fresh_managers = set(m.user_id for m in ProjectRole.find_many(filters))
        assert fresh_managers == set([u.id for u in target_managers])

    def test_create_with_occupied_datasets(self, users, datasets):
        """
        Test creating a label project with datasets already in another project.
        """
        with pytest.raises(LabelProjectError):
            LabelProject.create_project("conflict_project",
                                        users["staff"][-1],
                                        datasets[:2],
                                        users["manager"][:2],
                                        ["cat", "dog", "mouse"],
                                        "conflict_project")

    def test_create_without_managers(self, users, datasets):
        with pytest.raises(LabelProjectError):
            LabelProject.create_project("no_manager",
                                        users["staff"][-1],
                                        datasets[-2:],
                                        [],
                                        ["cat", "dog", "mouse"],
                                        "no_manager"
                                        )

    def test_create_without_datasets(self, users, datasets):
        with pytest.raises(LabelProjectError):
            LabelProject.create_project("no_dataset",
                                        users["staff"][-1],
                                        [],
                                        users["manager"][:2],
                                        ["cat", "dog", "mouse"],
                                        "no_dataset"
                                        )

    def test_create_without_categories(self, users, datasets):
        with pytest.raises(LabelProjectError):
            LabelProject.create_project("no_dataset",
                                        users["staff"][-1],
                                        datasets[-2:],
                                        users["manager"][:2],
                                        [],
                                        "no_dataset"
                                        )

    def test_create_without_staff_permission(self, users, datasets):
        with pytest.raises(LabelProjectError):
            LabelProject.create_project("normal_user",
                                        users["others"][-1],
                                        datasets[-2:],
                                        users["manager"][-2:],
                                        ["cat", "dog", "mouse"],
                                        "normal_user"
                                        )


class ProjectsMixin(BaseMixin):
    @pytest.fixture(scope="class")
    def users(self):
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
            for i in range(10):
                user_name = f"{self.__class__.__name__}_{user_type}_{i:02d}"
                user = User.create_user(user_name, user_type == "staff")
                user.set_password("12345678")
                user_list.append(user)
                all_user_ids.append(user.id)

        yield users_

        User.delete_many({"id": {"$in": all_user_ids}})

    @pytest.fixture(scope="class")
    def datasets(self):
        datasets: List[DataSet] = []
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        res_dir = os.path.join(os.path.dirname(cur_dir), "resource")
        image_path = os.path.join(res_dir, "image", "1.jpg")

        for i in range(10):
            dataset = DataSet.create_dataset(f"dataset_{i:02d}")

            for j in range(100):
                dataset.add_image(f"file://{image_path}")

            datasets.append(dataset)

        yield datasets

        self.clean_datasets(datasets)

    @pytest.fixture(scope="class")
    def projects(self, users, datasets):
        projects = []
        for idx in range(4):
            owner = users["staff"][idx]
            target_datasets = datasets[2 * idx:2 * idx + 2]
            target_managers = users["manager"][2 * idx:2 * idx + 2]
            project_name = f"project_{idx:02d}"
            project = LabelProject.create_project(project_name,
                                                  owner,
                                                  target_datasets,
                                                  target_managers,
                                                  ["cat", "dog", "mouse"],
                                                  project_name,
                                                  )
            projects.append(project)
        yield projects

        self.clean_projects(projects)


class TestEditProject(ProjectsMixin):
    """
    Test edit project.
    1. Edit description and managers.
    2. Edit managers but provide an empty list of new managers.
    """

    def test_edit_desc_and_managers(self, users, projects):
        for idx, project in enumerate(projects):
            old_data = project.to_dict()
            desc = f"project_edited_{idx:02d}"
            new_managers = users["manager"][idx * 2 + 1:idx * 2 + 3]
            project.edit_project(
                    desc=desc,
                    managers=new_managers,
            )

            # check new description is set properly
            fresh_proj = LabelProject.find_one({"id": project.id})
            assert fresh_proj.description == desc
            assert project.description == desc

            # check new managers are set properly
            filters = {"project_id": project.id, "role": LabelProjectRoles.Manager}
            manager_roles = ProjectRole.find_many(filters)
            manager_ids = set([m.user_id for m in manager_roles])
            assert manager_ids == set([u.id for u in new_managers])

            # check other data are not changed
            for key, value in old_data.items():
                if key in ["description", "managers"]:
                    continue
                assert getattr(project, key) == value

    def test_edit_with_empty_managers(self, projects):
        for project in projects:
            with pytest.raises(LabelProjectError):
                project.edit_project(managers=[])


class TestInitProject(ProjectsMixin):
    """
    Test init project:
    1. Init with empty config;
    2. Init with batch_size=0;
    3. Init with batch_size=30;
    4. Init with batch_size=40;
    5. Init with batch_size=50;
    6. Init project twice.
    """

    def test_init_with_empty_config(self, projects):
        project = projects[0]
        with pytest.raises(LabelProjectError):
            project.init_project()

    def test_init_with_bs0(self, projects):
        project = projects[0]
        project.init_project(batch_size=0, label_times=2, review_times=2)
        assert len(project.datasets) == 2
        assert project.status == LabelProjectStatus.Working
        assert project.task_num_total == 2
        assert project.task_num_waiting == 2
        assert project.task_num_working == 0
        assert project.task_num_reviewing == 0
        assert project.task_num_rejected == 0
        assert project.task_num_accepted == 0

        assert LabelTask.count_num({"project_id": project.id}) == 2
        for idx, task in enumerate(LabelTask.find_many({"project_id": project.id}, sort=[("idx", 1)])):
            assert task.idx == idx
            assert task.status == LabelTaskStatus.Waiting
            assert task.num_total == 100
            assert LabelTaskImage(task.dataset_id).count_num({"task_id": task.id}) == task.num_total
            assert task.dataset_id in [d["id"] for d in project.datasets]

    def test_init_with_bs30(self, projects):
        project = projects[1]
        project.init_project(batch_size=30, label_times=2, review_times=2)
        assert len(project.datasets) == 2
        assert project.status == LabelProjectStatus.Working
        assert project.task_num_total == 8
        assert project.task_num_waiting == 8
        assert project.task_num_working == 0
        assert project.task_num_reviewing == 0
        assert project.task_num_rejected == 0
        assert project.task_num_accepted == 0

        assert LabelTask.count_num({"project_id": project.id}) == 8
        for idx, task in enumerate(LabelTask.find_many({"project_id": project.id}, sort=[("idx", 1)])):
            assert task.idx == idx
            assert task.status == LabelTaskStatus.Waiting
            assert task.num_total == 30 if idx <= 2 else 10
            assert LabelTaskImage(task.dataset_id).count_num({"task_id": task.id}) == task.num_total
            assert task.dataset_id in [d["id"] for d in project.datasets]

    def test_init_with_bs40(self, projects):
        project = projects[2]
        project.init_project(batch_size=40, label_times=2, review_times=2)
        assert len(project.datasets) == 2
        assert project.status == LabelProjectStatus.Working
        assert project.task_num_total == 6
        assert project.task_num_waiting == 6
        assert project.task_num_working == 0
        assert project.task_num_reviewing == 0
        assert project.task_num_rejected == 0
        assert project.task_num_accepted == 0

        assert LabelTask.count_num({"project_id": project.id}) == 6
        for idx, task in enumerate(LabelTask.find_many({"project_id": project.id}, sort=[("idx", 1)])):
            assert task.idx == idx
            assert task.status == LabelTaskStatus.Waiting
            assert task.num_total == 40 if idx <= 1 else 20
            assert LabelTaskImage(task.dataset_id).count_num({"task_id": task.id}) == task.num_total
            assert task.dataset_id in [d["id"] for d in project.datasets]

    def test_init_with_bs50(self, projects):
        project = projects[3]
        project.init_project(batch_size=50, label_times=2, review_times=2)
        assert len(project.datasets) == 2
        assert project.status == LabelProjectStatus.Working
        assert project.task_num_total == 4
        assert project.task_num_waiting == 4
        assert project.task_num_working == 0
        assert project.task_num_reviewing == 0
        assert project.task_num_rejected == 0
        assert project.task_num_accepted == 0

        assert LabelTask.count_num({"project_id": project.id}) == 4
        for task in LabelTask.find_many({"project_id": project.id}, sort=[("idx", 1)]):
            assert task.status == LabelTaskStatus.Waiting
            assert task.num_total == 50
            assert LabelTaskImage(task.dataset_id).count_num({"task_id": task.id}) == task.num_total
            assert task.dataset_id in [d["id"] for d in project.datasets]

    def test_init_project_twice(self, projects):
        project = projects[0]
        with pytest.raises(LabelProjectError):
            project.init_project(batch_size=30, label_times=2, review_times=2)


class InitedProjectMixin(BaseMixin):
    """
    Almost the same as ProjectsMixin, but create only two projects and init them instantly.
    Init configs are as follows:
    project 1,
        batch_size = 0,
        label_times = 2,
        review_times = 2,
        num_datasets = 2,
        num_tasks = 2,
    project 2, which does not require reviewing:
        batch_size = 0,
        label_times = 2,
        review_times = 0,
        num_datasets = 2,
        num_tasks = 2,
    """

    @pytest.fixture(scope="class")
    def users(self):
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
            for i in range(4):
                user_name = f"{self.__class__.__name__}_{user_type}_{i:02d}"
                user = User.create_user(user_name, user_type == "staff")
                user.set_password("12345678")
                user_list.append(user)
                all_user_ids.append(user.id)

        yield users_

        User.delete_many({"id": {"$in": all_user_ids}})

    @pytest.fixture(scope="class")
    def datasets(self):
        datasets: List[DataSet] = []
        cur_dir = os.path.dirname(os.path.abspath(__file__))
        res_dir = os.path.join(os.path.dirname(cur_dir), "resource")
        image_path = os.path.join(res_dir, "image", "1.jpg")

        for i in range(4):
            dataset = DataSet.create_dataset(f"dataset_{i:02d}")

            for j in range(100):
                dataset.add_image(f"file://{image_path}")

            datasets.append(dataset)

        yield datasets

        self.clean_datasets(datasets)

    @pytest.fixture(scope="class")
    def projects(self, users, datasets):
        projects = []
        for idx in range(2):
            owner = users["staff"][idx]
            target_datasets = datasets[idx * 2:idx * 2 + 2]
            target_managers = users["manager"][idx * 2:idx * 2 + 2]
            project_name = f"project_{idx:02d}"
            project = LabelProject.create_project(project_name,
                                                  owner,
                                                  target_datasets,
                                                  target_managers,
                                                  ["cat", "dog", "bird"],
                                                  project_name)
            if idx == 0:
                project.init_project(batch_size=0, label_times=2, review_times=2)
            else:
                project.init_project(batch_size=0, label_times=2, review_times=0)
            projects.append(project)

        yield projects
        self.clean_projects(projects)

    @pytest.fixture(scope="class")
    def project1(self, projects):
        yield projects[0]

    @pytest.fixture(scope="class")
    def project2(self, projects):
        yield projects[1]

    def get_project_tasks(self, project):
        task_list = LabelTask.find_many({"project_id": project.id}, sort=[("idx", 1)])
        task_list = list(task_list)
        return task_list

    @staticmethod
    def _check_new_role_data(task: LabelTask, role: TaskRole):
        assert role.is_active
        assert role.label_num_waiting == task.num_total
        assert role.review_num_waiting == 0
        assert role.review_num_accepted == 0
        assert role.review_num_rejected == 0
        assert role.label_completed is False
        assert role.review_completed is False

        LTIModel = LabelTaskImage(task.dataset_id)
        if role.role in LabelProjectRoles.Leaders_:
            key = f"role_status.{role.role}"
        else:
            key = f"role_status.{role.role}_{role.user_id}"
        assert LTIModel.count_num({key: LabelTaskImageStatus.Labeling}) == task.num_total


class TestAssignLeader(InitedProjectMixin):
    """
    Test assign leader for task.
    1. Test assign label leader and review leader for project 1.
    2. Test assign label leader for project 2,
        and then assign review leader for project 2, which should raise error.
    """

    def _test_assign_leader(self, task, leader, role):
        assert TaskRole.count_num({"task_id": task.id, "role": role}) == 0

        _, leader_role = task.set_leader(leader, role)
        assert TaskRole.count_num({"task_id": task.id, "role": role}) == 1
        assert leader_role.user_id == leader.id
        self._check_new_role_data(task, leader_role)

        filters = {"task_id": task.id, "role": role, "user_id": leader.id}
        assert TaskRole.find_one(filters).to_dict() == leader_role.to_dict()

        filters = {"project_id": task.project_id, "role": role, "user_id": leader.id}
        assert ProjectRole.find_one(filters) is not None

    def test_assign_leaders_for_project1(self, project1, users):
        tasks = self.get_project_tasks(project1)
        for idx, task in enumerate(tasks):
            task = tasks[idx]
            leader = users["label_leader"][idx]
            self._test_assign_leader(task, leader, LabelProjectRoles.LabelLeader)

            assert task.status == LabelTaskStatus.Waiting
            assert task.project.task_num_working == 0

        for idx, task in enumerate(tasks):
            task = tasks[idx]
            leader = users["review_leader"][idx]
            self._test_assign_leader(task, leader, LabelProjectRoles.ReviewLeader)

            assert task.status == LabelTaskStatus.Working
            assert task.project.task_num_working == idx + 1

        project1 = LabelProject.find_one({"id": project1.id})
        assert project1.task_num_working == project1.task_num_total

    def test_assign_leaders_for_project2(self, project2, users):
        tasks = self.get_project_tasks(project2)
        for idx, task in enumerate(tasks):
            task = tasks[idx]
            leader = users["label_leader"][idx]
            self._test_assign_leader(task, leader, LabelProjectRoles.LabelLeader)

            assert task.status == LabelTaskStatus.Working
            assert task.project.task_num_working == idx + 1

        for idx, task in enumerate(tasks):
            task = tasks[idx]
            task._project = None  # clear the cache

            leader = users["review_leader"][idx]
            with pytest.raises(LabelTaskError):
                self._test_assign_leader(task, leader, LabelProjectRoles.ReviewLeader)

            assert task.status == LabelTaskStatus.Working
            assert task.project.task_num_working == task.project.task_num_total


class TestAssignWorker(InitedProjectMixin):
    """
    Test assign workers for task.
    1. Test assign labelers and reviewers for project 1.
    2. Test assign labelers and reviewers for project 2,
        which accepts only two labelers and zero reviewer, with wrong numbers.
    """

    # @staticmethod
    # def _check_new_role_data(task: LabelTask, role: TaskRole):
    #     assert role.is_active
    #     if role.role in LabelProjectRoles.ReviewKinds_:
    #         assert role.label_num_waiting == 0
    #     else:
    #         assert role.label_num_waiting == task.num_total
    #     assert role.review_num_waiting == 0
    #     assert role.review_num_accepted == 0
    #     assert role.review_num_rejected == 0
    #     assert role.label_completed is False
    #     assert role.review_completed is False
    #     assert role.label_image_num == 0
    #     assert role.review_image_num == 0
    #     assert role.label_action_num == 0
    #     assert role.review_action_num == 0

    def _test_assign_worker(self, task, workers, role):
        worker_roles = task.init_workers(workers, role)
        assert TaskRole.count_num({"task_id": task.id, "role": role}) == len(workers)

        for idx, worker_role in enumerate(worker_roles):
            worker = workers[idx]
            assert worker_role.user_id == worker.id
            self._check_new_role_data(task, worker_role)
            filters = {"task_id": task.id, "role": role, "user_id": worker.id}
            assert TaskRole.find_one(filters).to_dict() == worker_role.to_dict()

    def _setup_leaders(self, project, tasks, users):
        label_leader = users["label_leader"][0]
        review_leader = users["review_leader"][0]
        for idx, task in enumerate(tasks):
            task.set_leader(label_leader, LabelProjectRoles.LabelLeader)
            if project.review_times > 0:
                task.set_leader(review_leader, LabelProjectRoles.ReviewLeader)

    def test_assign_workers_for_project1(self, project1, users):
        tasks = self.get_project_tasks(project1)
        self._setup_leaders(project1, tasks, users)

        for idx, task in enumerate(tasks):
            task = tasks[idx]
            labelers = users["labeler"][idx * 2:idx * 2 + 2]
            reviewers = users["reviewer"][idx * 2:idx * 2 + 2]
            self._test_assign_worker(task, labelers, LabelProjectRoles.Labeler)
            self._test_assign_worker(task, reviewers, LabelProjectRoles.Reviewer)

    def test_assign_workers_for_project2(self, project2, users):
        tasks = self.get_project_tasks(project2)
        self._setup_leaders(project2, tasks, users)

        for idx, task in enumerate(tasks):
            task = tasks[idx]
            labelers = users["labeler"]

            with pytest.raises(LabelTaskError):
                self._test_assign_worker(task, labelers, LabelProjectRoles.Labeler)

            with pytest.raises(LabelTaskError):
                self._test_assign_worker(task, labelers[:1], LabelProjectRoles.Labeler)

            reviewers = users["reviewer"]
            with pytest.raises(LabelTaskError):
                self._test_assign_worker(task, reviewers, LabelProjectRoles.Reviewer)
            self._test_assign_worker(task, [], LabelProjectRoles.Reviewer)


class LabelingProjectMixin(InitedProjectMixin):
    """
    Almost the same as InitedProjectMixin, with leaders and workers setup.
    Init configs are as follows:
    project 1,
        batch_size = 0,
        label_times = 2,
        review_times = 2,
        num_datasets = 2,
        num_tasks = 2,
        label_leader = users["label_leader"][0],
        review_leader = users["review_leader"][0],
        labelers = users["labeler"][:2],
        reviewers = users["reviewer"][:2],
    project 2, which does not require reviewing:
        batch_size = 0,
        label_times = 2,
        review_times = 0,
        num_datasets = 2,
        num_tasks = 2,
        label_leader = users["label_leader"][1],
        review_leader = None,
        labelers = users["labeler"][2:4],
        reviewers = None,
    """

    @pytest.fixture(scope="class")
    def label_leader1(self, users):
        yield users["label_leader"][0]

    @pytest.fixture(scope="class")
    def review_leader1(self, users):
        yield users["review_leader"][0]

    @pytest.fixture(scope="class")
    def labeler1_1(self, users):
        yield users["labeler"][0]

    @pytest.fixture(scope="class")
    def labeler1_2(self, users):
        yield users["labeler"][1]

    @pytest.fixture(scope="class")
    def reviewer1_1(self, users):
        yield users["reviewer"][0]

    @pytest.fixture(scope="class")
    def reviewer1_2(self, users):
        yield users["reviewer"][1]

    @pytest.fixture(scope="class")
    def label_leader2(self, users):
        yield users["label_leader"][1]

    @pytest.fixture(scope="class")
    def labeler2_1(self, users):
        yield users["labeler"][2]

    @pytest.fixture(scope="class")
    def labeler2_2(self, users):
        yield users["labeler"][3]

    @pytest.fixture(scope="class")
    def project1(self, projects, label_leader1, review_leader1, labeler1_1, labeler1_2, reviewer1_1, reviewer1_2):
        project = projects[0]
        tasks = self.get_project_tasks(project)
        for idx, task in enumerate(tasks):
            task.set_leader(label_leader1, LabelProjectRoles.LabelLeader)
            task.set_leader(review_leader1, LabelProjectRoles.ReviewLeader)
            task.init_workers([labeler1_1, labeler1_2], LabelProjectRoles.Labeler)
            task.init_workers([reviewer1_1, reviewer1_2], LabelProjectRoles.Reviewer)

        project = LabelProject.find_one({"id": project.id})
        projects[0] = project
        yield project

    @pytest.fixture(scope="class")
    def project2(self, projects, label_leader2, labeler2_1, labeler2_2):
        project = projects[1]
        tasks = self.get_project_tasks(project)
        for task in tasks:
            task.set_leader(label_leader2, LabelProjectRoles.LabelLeader)
            task.init_workers([labeler2_1, labeler2_2], LabelProjectRoles.Labeler)

        project = LabelProject.find_one({"id": project.id})
        projects[1] = project
        yield project

    @staticmethod
    def in_range(number, ranges):
        for start, end in ranges:
            if start <= number < end:
                return True
        return False

    @staticmethod
    def check_status(statuses):
        for expected, actual_list in statuses.items():
            if actual_list and set(actual_list) != {expected}:
                return False
        return True


class TestLabelImageWithReview(LabelingProjectMixin):
    """
    Test label image for task.
    1. Test label image for project 1, with review actions.
    2. Test label image for project 2, without review actions.
    """

    def _test_step1(self, project):
        """
        1. Check project progress and task progress.
        """

        project = LabelProject.find_one({"id": project.id})
        tasks = self.get_project_tasks(project)

        assert project.task_num_total == 2
        assert project.task_num_waiting == 0
        assert project.task_num_working == 2
        assert project.task_num_reviewing == 0
        assert project.task_num_accepted == 0
        assert project.task_num_rejected == 0
        for task in tasks:
            assert task.num_total == 100
            assert task.status == LabelTaskStatus.Working

    def _test_step2(self, project, labeler1, labeler2, reviewer1, reviewer2):
        """
        2. Take task1, label all images and accept all images, Check project progress and task1 progress for every role.
        """

        project = LabelProject.find_one({"id": project.id})
        tasks = self.get_project_tasks(project)
        task1 = tasks[0]
        LTIModel = LabelTaskImage(task1.dataset_id)
        annotations = [
            {"category"    : "test",
             "category_id" : "test",
             "bounding_box": {
                 "xmin": 0.1,
                 "ymin": 0.1,
                 "xmax": 0.5,
                 "ymax": 0.5}
             }
        ]
        for image in LTIModel.find_many({}):
            label1 = image.set_label(task1, labeler1, annotations)
            label2 = image.set_label(task1, labeler2, annotations)

            image.set_review(task1, reviewer1, label1["id"], LabelImageQAActions.Accept)
            image.set_review(task1, reviewer1, label2["id"], LabelImageQAActions.Accept)
            image.set_review(task1, reviewer2, label1["id"], LabelImageQAActions.Accept)
            image.set_review(task1, reviewer2, label2["id"], LabelImageQAActions.Accept)

        project1 = LabelProject.find_one({"id": project.id})
        assert project1.task_num_total == 2
        assert project1.task_num_waiting == 0
        assert project1.task_num_working == 1
        assert project1.task_num_reviewing == 1
        assert project1.task_num_accepted == 0
        assert project1.task_num_rejected == 0

        for image in LTIModel.find_many({}):
            role_status = image.role_status
            lleader1_status = role_status["label_leader"]
            rleader1_status = role_status["review_leader"]
            labeler1_status = role_status[f"labeler_{labeler1.id}"]
            labeler2_status = role_status[f"labeler_{labeler2.id}"]
            reviewer1_status = role_status[f"reviewer_{reviewer1.id}"]
            reviewer2_status = role_status[f"reviewer_{reviewer2.id}"]

            statuses = {LabelTaskImageStatus.Accepted: [lleader1_status, rleader1_status,
                                                        labeler1_status, labeler2_status,
                                                        reviewer1_status, reviewer2_status]}
            assert self.check_status(statuses) is True

    def _test_step3(self, project, labeler1, labeler2, reviewer1, reviewer2):
        """
        3. Take task2,
            labeler1_1 label images[:95], labeler1_2 label images[5:];
            for any reviewer, accept any image in images[:5], should raise error
            for any reviewer, accept any image in images[95:100], should raise error
        """

        project = LabelProject.find_one({"id": project.id})
        tasks = self.get_project_tasks(project)
        task2 = tasks[1]
        LTIModel = LabelTaskImage(task2.dataset_id)
        annotations = [
            {"category"    : "test",
             "category_id" : "test",
             "bounding_box": {
                 "xmin": 0.1,
                 "ymin": 0.1,
                 "xmax": 0.5,
                 "ymax": 0.5}
             }
        ]
        for idx, image in enumerate(LTIModel.find_many({})):
            if idx < 95:
                image.set_label(task2, labeler1, annotations)
            if idx >= 5:
                image.set_label(task2, labeler2, annotations)

        for idx, image in enumerate(LTIModel.find_many({})):
            label1 = image.labels.get(labeler1.id, [])
            label1_id = label1[0].id if label1 else ""
            label2 = image.labels.get(labeler2.id, [])
            label2_id = label2[0].id if label2 else ""

            if idx < 5 or idx >= 95:
                assert image.can_set_review(task2, reviewer1, label1_id) is False
                assert image.can_set_review(task2, reviewer2, label1_id) is False
                assert image.can_set_review(task2, reviewer1, label2_id) is False
                assert image.can_set_review(task2, reviewer2, label2_id) is False
            else:
                assert image.can_set_review(task2, reviewer1, label1_id) is True
                assert image.can_set_review(task2, reviewer2, label1_id) is True
                assert image.can_set_review(task2, reviewer1, label2_id) is True
                assert image.can_set_review(task2, reviewer2, label2_id) is True

        project = LabelProject.find_one({"id": project.id})
        assert project.task_num_total == 2
        assert project.task_num_waiting == 0
        assert project.task_num_working == 1
        assert project.task_num_reviewing == 1
        assert project.task_num_accepted == 0
        assert project.task_num_rejected == 0

    def _test_step4(self, project, labeler1, labeler2, reviewer1, reviewer2):
        """
        4. Take task2, for images [5:95], do these actions, A for accept, R for reject:
                            [5:15]    [15:25]    [25:35]    [35:45]    [45:55]    [55:65]    [65:75]    [75:85]    [85:95]
    labeler1_1  reviewer1_1   A          A          A          A          A          A          R          R          R
    labeler1_1  reviewer1_2   A          A          A          R          R          R          R          R          R
    labeler1_2  reviewer1_1   A          A          R          A          A          R          A          A          R
    labeler1_2  reviewer1_2   A          R          R          A          R          R          A          R          R
        """
        project = LabelProject.find_one({"id": project.id})
        tasks = self.get_project_tasks(project)
        task2 = tasks[1]
        LTIModel = LabelTaskImage(task2.dataset_id)
        accept = LabelImageQAActions.Accept
        reject = LabelImageQAActions.Reject

        for idx, image in enumerate(LTIModel.find_many({})):
            if idx < 5 or idx >= 95:
                continue

            label1 = image.labels.get(labeler1.id)[0]
            label2 = image.labels.get(labeler2.id)[0]

            # reviewer1 for labeler1
            action = reject if self.in_range(idx, [[65, 95]]) else accept
            image.set_review(task2, reviewer1, label1.id, action)

            # reviewer2 for labeler1
            action = reject if self.in_range(idx, [[35, 95]]) else action
            image.set_review(task2, reviewer2, label1.id, action)

            # reviewer1 for labeler2
            action = reject if self.in_range(idx, [[25, 35], [55, 65], [85, 95]]) else accept
            image.set_review(task2, reviewer1, label2.id, action)

            # reviewer2 for labeler2
            action = reject if self.in_range(idx, [[15, 35], [45, 65], [75, 95]]) else accept
            image.set_review(task2, reviewer2, label2.id, action)

    def _test_step5(self, project,
                    label_leader1, review_leader1,
                    labeler1, labeler2,
                    reviewer1, reviewer2):
        """
        5. Check task2 progress for every role.
        """

        project = LabelProject.find_one({"id": project.id})
        assert project.task_num_total == 2
        assert project.task_num_waiting == 0
        assert project.task_num_working == 1
        assert project.task_num_reviewing == 1
        assert project.task_num_rejected == 0
        assert project.task_num_accepted == 0

        tasks = self.get_project_tasks(project)
        task2 = tasks[1]
        LTIModel = LabelTaskImage(task2.dataset_id)

        for idx, image in enumerate(LTIModel.find_many({})):
            role_status = image.role_status
            lleader1_status = role_status["label_leader"]
            rleader1_status = role_status["review_leader"]
            labeler1_status = role_status[f"labeler_{labeler1.id}"]
            labeler2_status = role_status[f"labeler_{labeler2.id}"]
            reviewer1_status = role_status[f"reviewer_{reviewer1.id}"]
            reviewer2_status = role_status[f"reviewer_{reviewer2.id}"]

            statuses = {}
            if self.in_range(idx, [[0, 5]]):
                statuses[LabelTaskImageStatus.Reviewing] = [labeler1_status]
                statuses[LabelTaskImageStatus.Labeling] = [lleader1_status, rleader1_status,
                                                           labeler2_status, reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[5, 15]]):
                statuses[LabelTaskImageStatus.Accepted] = [lleader1_status, rleader1_status,
                                                           labeler1_status, labeler2_status,
                                                           reviewer1_status, reviewer2_status]
                self.check_status(statuses)
            elif self.in_range(idx, [[15, 25]]):
                statuses[LabelTaskImageStatus.Accepted] = [labeler1_status, reviewer1_status]
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler2_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[25, 35]]):
                statuses[LabelTaskImageStatus.Accepted] = [labeler1_status]
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler2_status, reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[35, 45]]):
                statuses[LabelTaskImageStatus.Accepted] = [labeler2_status, reviewer1_status]
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[45, 55]]):
                statuses[LabelTaskImageStatus.Accepted] = [reviewer1_status]
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, labeler2_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[55, 65]]):
                statuses[LabelTaskImageStatus.Accepted] = []
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, labeler2_status,
                                                           reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[65, 75]]):
                statuses[LabelTaskImageStatus.Accepted] = [labeler2_status]
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[75, 85]]):
                statuses[LabelTaskImageStatus.Accepted] = []
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, labeler2_status,
                                                           reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[85, 95]]):
                statuses[LabelTaskImageStatus.Accepted] = []
                statuses[LabelTaskImageStatus.Rejected] = [lleader1_status, rleader1_status,
                                                           labeler1_status, labeler2_status,
                                                           reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True
            elif self.in_range(idx, [[95, 100]]):
                statuses[LabelTaskImageStatus.Reviewing] = [labeler2_status]
                statuses[LabelTaskImageStatus.Labeling] = [lleader1_status, rleader1_status,
                                                           labeler1_status, reviewer1_status, reviewer2_status]
                assert self.check_status(statuses) is True

    def test_label_project_with_review(self, project1,
                                       label_leader1, review_leader1,
                                       labeler1_1, labeler1_2,
                                       reviewer1_1, reviewer1_2):
        """
        Test label image for project 1, with review actions.

        1. Check project progress and task progress.
        2. Take task1, label all images and accept all images, Check project progress and task1 progress for every role.
        3. Take task2,
            labeler1_1 label images[:95], labeler1_2 label images[5:];
            for any reviewer, for labeler1_1, accept any image in images[:5], should raise error
            for any reviewer, for labeler1_2, accept any image in images[95:100], should raise error
        4. Take task2, for images [5:95], do these actions, A for accept, R for reject:
                                    [5:15]    [15:25]    [25:35]    [35:45]    [45:55]    [55:65]    [65:75]    [75:85]    [85:95]
            labeler1_1  reviewer1_1   A          A          A          A          A          A          R          R          R
            labeler1_1  reviewer1_2   A          A          A          R          R          R          R          R          R
            labeler1_2  reviewer1_1   A          A          R          A          A          R          A          A          R
            labeler1_2  reviewer1_2   A          R          R          A          R          R          A          R          R
        5. Check project progress and task2 progress for every role.
        6. Check project progress.
        """
        self._test_step1(project1)
        self._test_step2(project1, labeler1_1, labeler1_2, reviewer1_1, reviewer1_2)
        self._test_step3(project1, labeler1_1, labeler1_2, reviewer1_1, reviewer1_2)
        self._test_step4(project1, labeler1_1, labeler1_2, reviewer1_1, reviewer1_2)
        self._test_step5(project1,
                         label_leader1, review_leader1,
                         labeler1_1, labeler1_2,
                         reviewer1_1, reviewer1_2)

# class TestReplaceLeader:
#     @staticmethod
#     def _change_role_data(task_role):
#         task_role.label_num_waiting -= 10
#         task_role.review_num_waiting += 5
#         task_role.review_num_accepted += 3
#         task_role.review_num_rejected += 2
#         task_role.label_image_num += 10
#         task_role.review_image_num += 7
#         task_role.label_action_num += 20
#         task_role.review_action_num += 20
#         task_role.save()
#
#     @staticmethod
#     def _check_role_data_inherit(old_role: TaskRole, new_role: TaskRole):
#         assert old_role.role == new_role.role
#         assert old_role.is_active is False
#         assert new_role.is_active is True
#
#         # task bonded data are inherited
#         assert old_role.label_num_waiting == new_role.label_num_waiting
#         assert old_role.review_num_waiting == new_role.review_num_waiting
#         assert old_role.review_num_accepted == new_role.review_num_accepted
#         assert old_role.review_num_rejected == new_role.review_num_rejected
#         assert old_role.label_completed == new_role.label_completed
#         assert old_role.review_completed == new_role.review_completed
#
#         # user bonded data are not inherited
#         assert old_role.label_image_num != new_role.label_image_num
#         assert old_role.review_image_num != new_role.review_image_num
#         assert old_role.label_action_num != new_role.label_action_num
#         assert old_role.review_action_num != new_role.review_action_num
#
#     def _test_replace_leader(self, task, old_leader, new_leader, role):
#         assert TaskRole.count_num({"task_id": task.id, "role": role}) == 1
#
#         old_user = old_leader
#         new_user = new_leader
#
#         filters = {"task_id": task.id, "role": role, "user_id": old_user.id, "is_active": True}
#         old_role = TaskRole.find_one(filters)
#         assert old_role is not None
#
#         # make some change to task data, check if these changes are inherited
#         self._change_role_data(old_role)
#
#         old_role, new_role = task.set_leader(new_user, role)
#         assert new_role.user_id == new_user.id
#         assert task.status == LabelTaskStatus.Working
#         self._check_role_data_inherit(old_role, new_role)
#
#         filters = {"task_id": task.id, "role": role}
#         assert TaskRole.count_num(filters) == 2
#
#         for role_obj in TaskRole.find_many(filters):
#             filters = {"project_id": task.project_id, "role": role, "user_id": role_obj.user_id}
#             if role_obj.user_id == old_user.id:
#                 assert ProjectRole.count_num(filters) == 0
#             elif role_obj.user_id == new_user.id:
#                 assert ProjectRole.count_num(filters) == 1
#
#     def test_replace_label_leader(self, tasks_pbs0, old_lleader_pbs0, new_lleader_pbs0):
#         task = tasks_pbs0[0]
#         old_leader = old_lleader_pbs0
#         new_leader = new_lleader_pbs0
#         self._test_replace_leader(task, old_leader, new_leader, LabelProjectRoles.LabelLeader)
#
#     def test_replace_review_leader(self, tasks_pbs0, old_rleader_pbs0, new_rleader_pbs0):
#         task = tasks_pbs0[0]
#         old_leader = old_rleader_pbs0
#         new_leader = new_rleader_pbs0
#         self._test_replace_leader(task, old_leader, new_leader, LabelProjectRoles.ReviewLeader)
#
#
# class TestReplaceWorker:
#     @staticmethod
#     def _change_role_data(task_role):
#         task_role.label_num_waiting = max(0, task_role.label_num_waiting - 10)
#         task_role.review_num_waiting += 5
#         task_role.review_num_accepted += 3
#         task_role.review_num_rejected += 2
#         task_role.label_image_num += 10
#         task_role.review_image_num += 7
#         task_role.label_action_num += 20
#         task_role.review_action_num += 20
#         task_role.save()
#
#     @staticmethod
#     def _check_role_data_inherit(old_role: TaskRole, new_role: TaskRole):
#         assert old_role.role == new_role.role
#         assert old_role.is_active is False
#         assert new_role.is_active is True
#
#         # task bonded data are inherited
#         assert old_role.label_num_waiting == new_role.label_num_waiting
#         assert old_role.review_num_waiting == new_role.review_num_waiting
#         assert old_role.review_num_accepted == new_role.review_num_accepted
#         assert old_role.review_num_rejected == new_role.review_num_rejected
#         assert old_role.label_completed == new_role.label_completed
#         assert old_role.review_completed == new_role.review_completed
#
#         # user bonded data are not inherited
#         assert old_role.label_image_num != new_role.label_image_num
#         assert old_role.review_image_num != new_role.review_image_num
#         assert old_role.label_action_num != new_role.label_action_num
#         assert old_role.review_action_num != new_role.review_action_num
#
#     def _test_replace_worker(self, task, replaced_worker, kept_worker, new_worker, role):
#         # test replace with the same user
#         with pytest.raises(LabelTaskError):
#             task.replace_worker(replaced_worker, replaced_worker, role)
#
#         # test replace with user of the same role already in task
#         with pytest.raises(LabelTaskError):
#             task.replace_worker(replaced_worker, kept_worker, role)
#
#         # test replace a user who are not in task
#         with pytest.raises(LabelTaskError):
#             task.replace_worker(new_worker, replaced_worker, role)
#
#         # test replace worker
#         filters = {"task_id": task.id, "role": role, "user_id": replaced_worker.id, "is_active": True}
#         old_role = TaskRole.find_one(filters)
#         self._change_role_data(old_role)
#         old_role, new_role = task.replace_worker(replaced_worker, new_worker, role)
#         self._check_role_data_inherit(old_role, new_role)
#
#         filters = {"task_id": task.id, "role": role}
#         assert TaskRole.count_num(filters) == 3
#
#         for role_obj in TaskRole.find_many(filters):
#             filters = {"project_id": task.project_id, "role": role, "user_id": role_obj.user_id}
#             if role_obj.user_id == replaced_worker.id:
#                 assert ProjectRole.count_num(filters) == 0
#             elif role_obj.user_id == new_worker.id:
#                 assert ProjectRole.count_num(filters) == 1
#
#     def test_replace_labeler(self, tasks_pbs0, old_labelers_pbs0, new_labelers_pbs0):
#         task = tasks_pbs0[0]
#         replaced_worker = old_labelers_pbs0[0]
#         kept_worker = old_labelers_pbs0[1]
#         new_worker = new_labelers_pbs0[-1]
#         self._test_replace_worker(task, replaced_worker, kept_worker, new_worker, LabelProjectRoles.Labeler)
#
#     def test_replace_reviewer(self, tasks_pbs0, old_reviewers_pbs0, new_reviewers_pbs0):
#         task = tasks_pbs0[0]
#         replaced_worker = old_reviewers_pbs0[0]
#         kept_worker = old_reviewers_pbs0[1]
#         new_worker = new_reviewers_pbs0[-1]
#         self._test_replace_worker(task, replaced_worker, kept_worker, new_worker, LabelProjectRoles.Reviewer)
#
#
# class TestCommitReviewTask:
#     def test_commit_review_task(self, task_to_review_pbs0, old_reviewers_pbs0, new_reviewers_pbs0):
#         task = task_to_review_pbs0
#         replaced_reviewer = old_reviewers_pbs0[0]
#         reviewers = new_reviewers_pbs0
#         role = LabelProjectRoles.Reviewer
#
#         # commit by user who are not a reviewer
#         with pytest.raises(LabelTaskError):
#             task.commit_review(replaced_reviewer)
#
#         num_completed = 0
#         for reviewer in reviewers:
#             # commit before review_percent is reached
#             with pytest.raises(LabelTaskError):
#                 task.commit_review(reviewer)
#
#             filters = {"task_id": task.id, "role": LabelProjectRoles.Labeler, "is_active": True}
#             TaskRole.update_many(filters, {"label_completed": True})
#
#             filters = {"task_id": task.id, "user_id": reviewer.id, "role": role, "is_active": True}
#             TaskRole.update_many(filters, {"review_num_accepted": task.num_total})
#             task_role = task.commit_review(reviewer)
#
#             assert task_role.review_completed is True
#
#             num_completed += 1
#             if num_completed == len(reviewers):
#                 assert task.status == LabelTaskStatus.Reviewing
#                 assert task.project.task_num_reviewing == 1
#             else:
#                 assert task.project.task_num_reviewing == 0
#                 assert task.status == LabelTaskStatus.Working
#
#
# class TestQATask:
#     def test_accept_task(self, task_to_accept, task_to_reject):
#         # accept a task which is not in reviewing status
#         with pytest.raises(LabelTaskError):
#             task_to_reject.accept_task()
#
#         # accept a task in reviewing status
#         task_to_accept.accept_task()
#         assert task_to_accept.status == LabelTaskStatus.Accepted
#         assert task_to_accept.project.task_num_accepted == 1
#
#     @staticmethod
#     def _setup_task_roles(task, lleader, rleader, labelers, reviewers):
#         task.set_leader(lleader, LabelProjectRoles.LabelLeader)
#         task.set_leader(rleader, LabelProjectRoles.ReviewLeader)
#         task.init_workers(labelers, LabelProjectRoles.Labeler)
#         task.init_workers(reviewers, LabelProjectRoles.Reviewer)
#         TaskRole.update_many({"task_id": task.id, "role": LabelProjectRoles.Labeler, "is_active": True},
#                              {"label_completed": True})
#         TaskRole.update_many({"task_id": task.id, "role": LabelProjectRoles.Reviewer, "is_active": True},
#                              {"review_num_accepted": task.num_total})
#         for reviewer_role in TaskRole.find_many({"task_id"  : task.id,
#                                                  "role"     : LabelProjectRoles.Reviewer,
#                                                  "is_active": True}):
#             reviewer = User.find_one({"id": reviewer_role.user_id})
#             task.commit_review(reviewer)
#
#     def test_reject_task(self, task_to_reject, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0):
#         # reject a task which is not in reviewing status
#         with pytest.raises(LabelTaskError):
#             task_to_reject.reject_task()
#
#         # prepare the task so that it can be rejected
#         self._setup_task_roles(task_to_reject, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0)
#         assert task_to_reject.status == LabelTaskStatus.Reviewing
#
#         # reject the task
#         task_to_reject.reject_task()
#         assert task_to_reject.status == LabelTaskStatus.Rejected
#         assert task_to_reject.project.task_num_rejected == 1
#
#     def test_restart_task(self, task_to_accept, task_to_reject):
#         # restart a task which is not in rejected status
#         with pytest.raises(LabelTaskError):
#             task_to_accept.restart_task()
#
#         # restart a task in rejected status
#         filters = {"project_id": task_to_reject.project_id, "status": LabelTaskStatus.Rejected}
#         assert LabelTask.count_num(filters) == 1
#
#         assert task_to_reject.status == LabelTaskStatus.Rejected
#         task_to_reject.restart_task()
#         filters = {"project_id": task_to_reject.project_id, "status": LabelTaskStatus.Working}
#         assert LabelTask.count_num(filters) == 1
#         filters = {"project_id": task_to_reject.project_id, "status": LabelTaskStatus.Rejected}
#         assert LabelTask.count_num(filters) == 0
#
#         assert task_to_reject.status == LabelTaskStatus.Working
#         assert task_to_reject.project.task_num_rejected == 0
#         assert task_to_reject.project.task_num_working == 1
#
#         for role in TaskRole.find_many({"task_id": task_to_reject.id, "is_active": True}):
#             assert role.is_active is True
#             if role.role in LabelProjectRoles.ReviewKinds_:
#                 assert role.label_num_waiting == 0
#             else:
#                 assert role.label_num_waiting == task_to_reject.num_total
#             assert role.review_num_waiting == 0
#             assert role.review_num_rejected == 0
#             assert role.review_num_accepted == 0
#             assert role.label_completed is False
#             assert role.review_completed is False
#
#     def test_enforce_accept_task(self, task_to_re_accept, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0):
#         # enforce accept a task which is not in rejected status
#         with pytest.raises(LabelTaskError):
#             task_to_re_accept.accept_rejected_task()
#
#         # prepare the task so that it can be re-accepted
#         self._setup_task_roles(task_to_re_accept, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0)
#         assert task_to_re_accept.status == LabelTaskStatus.Reviewing
#         task_to_re_accept.reject_task()
#         assert task_to_re_accept.status == LabelTaskStatus.Rejected
#         assert task_to_re_accept.project.task_num_rejected == 1
#
#         # enforce accept the task
#         task_to_re_accept.accept_rejected_task()
#         assert task_to_re_accept.status == LabelTaskStatus.Accepted
#         assert task_to_re_accept.project.task_num_rejected == 0
#
#
# class TestQAProject:
#     @staticmethod
#     def _accept_task(task, lleader, rleader, labelers, reviewers):
#         task.set_leader(lleader, LabelProjectRoles.LabelLeader)
#         task.set_leader(rleader, LabelProjectRoles.ReviewLeader)
#         task.init_workers(labelers, LabelProjectRoles.Labeler)
#         task.init_workers(reviewers, LabelProjectRoles.Reviewer)
#         TaskRole.update_many({"task_id": task.id, "role": LabelProjectRoles.Labeler, "is_active": True},
#                              {"label_completed": True})
#         TaskRole.update_many({"task_id": task.id, "role": LabelProjectRoles.Reviewer, "is_active": True},
#                              {"review_num_accepted": task.num_total})
#         for reviewer_role in TaskRole.find_many({"task_id"  : task.id,
#                                                  "role"     : LabelProjectRoles.Reviewer,
#                                                  "is_active": True}):
#             reviewer = User.find_one({"id": reviewer_role.user_id})
#             task.commit_review(reviewer)
#
#         task.accept_task()
#         assert task.status == LabelTaskStatus.Accepted
#
#     def _prepare_project_to_reviewing(self, project, lleader, rleader, labelers, reviewers):
#         tasks = list(LabelTask.find_many({"project_id": project.id}))
#         for task in tasks:
#             self._accept_task(task, lleader, rleader, labelers, reviewers)
#         return LabelProject.find_one({"id": project.id})
#
#     def test_accept_project(self, project_to_accept, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0):
#         with pytest.raises(LabelProjectError):
#             project_to_accept.accept_project()
#
#         project = self._prepare_project_to_reviewing(project_to_accept,
#                                                      lleader_pbs0,
#                                                      rleader_pbs0,
#                                                      labelers_pbs0,
#                                                      reviewers_pbs0)
#         assert project.task_num_accepted == project_to_accept.task_num_total
#
#         project.accept_project()
#         assert project.status == LabelProjectStatus.Accepted
#
#     def test_reject_project(self, project_to_reject, lleader_pbs0, rleader_pbs0, labelers_pbs0, reviewers_pbs0):
#         with pytest.raises(LabelProjectError):
#             project_to_reject.reject_project()
#
#         project = self._prepare_project_to_reviewing(project_to_reject,
#                                                      lleader_pbs0,
#                                                      rleader_pbs0,
#                                                      labelers_pbs0,
#                                                      reviewers_pbs0)
#
#         assert project.task_num_accepted == project_to_reject.task_num_total
#
#         project.reject_project()
#         assert project.status == LabelProjectStatus.Rejected
