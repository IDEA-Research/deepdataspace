"""
deepdataspace.constants

The predefined global constants.
"""


class RunningEnv:
    """
    | The running environment of dds.
    | This is used to identify the deployment environment of dds.
    | It will be removed in the future as we are planning to decouple dds tool and dds app.
    """

    Local = "local"  #: DDS is running locally as a tool, started by ``dds`` CLI tools.
    Dev = "dev"  #: DDS is running as a service in development environment.
    Test = "test"  #: DDS is running as a service in test environment.
    Prod = "prod"  #: DDS is running as a service in production environment.

    NonProdServers = {Local, Dev, Test}  #: All non-production environments


class DatasetType:
    """
    | The dataset file format types dds can handle.
    | DDS can import two kinds of dataset file formats with two built-in importer:

        #. :class:`deepdataspace.plugins.tsv.importer.TSVImporter` for idea's tsv format.
        #. :class:`deepdataspace.plugins.coco2017.importer.COCO2017Importer` for coco2017 format.

    | Datasets imported with Python API without knowing the format are identified as :attr:`Simple`.
    """
    TSV = "tsv"  #: Identifies datasets imported by :class:`deepdataspace.plugins.tsv.importer.TSVImporter`.
    COCO2017 = "coco2017"  #: Identifies datasets imported by :class:`deepdataspace.plugins.coco2017.importer.COCO2017Importer`.
    Simple = "simple"  #: Identifies datasets imported by Python API without knowing the format.


class DatasetStatus:
    """
    The dataset status.
    """

    Waiting = "waiting"  #: Just found this dataset, waiting for importing.
    Importing = "importing"  #: Importing dataset.
    Processing = "processing"  #: Processing dataset by any instance of :class:`deepdataspace.process.processor.BaseProcessor`.
    Ready = "ready"  #: Ready for use.
    Failed = "failed"  #: Failed to import or process.

    NotImported_ = {Waiting, Importing}  #: Datasets in these statuses are not imported.
    BatchProcessing_ = {Waiting, Importing, Processing}  #: Datasets in these statuses are in batch processing state.
    DontRead_ = {Waiting, Importing, Processing, Failed}  #: Datasets in these statuses are not ready for reading.


class LabelType:
    """
    | The types of label set.
    | Objects in a dataset belongs to one of these label set types, which identifies their origin.
    """

    GroundTruth = "GT"  #: Objects are labeled by dataset owners as ground truth.
    Prediction = "Pred"  #: Objects are labeled by some algorithm as prediction.
    User = "User"  #: Objects are labeled by third-party users.


class LabelName:
    """
    | The names of label set.
    | Label set can be named any way if they are of :attr:`LabelType.Prediction` type.
    | Otherwise, they must be named as one of these:
    """

    GroundTruth = "GroundTruth"  #: Name for label set of :attr:`LabelType.GroundTruth` type.
    UserAnnotation = "UserAnnotation"  #: Name for label set of :attr:`LabelType.User` type.


class LabelCompareResult:
    """
    The result of comparing predicted objects with groundtruth objects.
    """

    OK = "OK"  #: The prediction matches a groundtruth.
    FalsePositive = "FP"  #: The prediction matches no groundtruth, False-Positive.
    FalseNegative = "FN"  #: The groundtruth is not matched by any prediction, False-Negative.


class AnnotationType:
    """
    The type of annotation/object.
    """

    Classification = "Classification"  #: The annotation classifies the object.
    Detection = "Detection"  #: The annotation detects the object position.
    Segmentation = "Segmentation"  #: The annotation segments the object.
    Matting = "Matting"  #: The annotation matting the object.
    KeyPoints = "KeyPoints"  #: The annotation marks the keypoints of the object.


class TaskStatus:
    """
    The status of tasks send to celery for execution.
    """

    Waiting = "waiting"  #: Celery is waiting for this task.
    Running = "running"  #: Celery is running this task.
    Success = "success"  #: Celery has finished this task successfully.
    Fail = "fail"  #: Celery has finished this task with failure.


class TaskName:
    """
    All tasks exposed in HTTP API.
    """

    ReRankByFlags = "rerank_by_flags"
    """
    | Rerank the dataset by flags.
    | Exposed by API :class:`deepdataspace.plugins.tsv.server.ReRankImagesByFlagsTasksView`.
    """


class KeyPointsType:
    """
    The type of keypoints.
    """

    COCO = "COCO"  #: The format of coco keypoints, which only contains 17 keypoints and for person only.


class KeyPointName:
    """
    The name of every keypoint.
    """

    COCO = [
        "nose",
        "left_eye",
        "right_eye",
        "left_ear",
        "right_ear",
        "left_shoulder",
        "right_shoulder",
        "left_elbow",
        "right_elbow",
        "left_wrist",
        "right_wrist",
        "left_hip",
        "right_hip",
        "left_knee",
        "right_knee",
        "left_ankle",
        "right_ankle",
    ]  #: The name of every keypoint in coco format.


class KeyPointColor:
    """
    The color of every keypoint.
    """

    COCO = [
        128, 0, 0,
        255, 178, 102,
        230, 230, 0,
        255, 51, 255,
        153, 204, 255,
        255, 128, 0,
        0, 255, 255,
        128, 0, 255,
        51, 153, 255,
        169, 165, 139,
        255, 0, 0,
        102, 255, 102,
        184, 97, 134,
        128, 128, 0,
        255, 190, 255,
        0, 128, 0,
        0, 0, 255,
    ]  #: The color of every keypoint in coco format.


class KeyPointSkeleton:
    """
    | The skeleton of every keypoint.
    | This is a list of pairs of keypoint indices.
    """

    COCO = [
        15, 13,
        13, 11,
        16, 14,
        14, 12,
        11, 12,
        5, 11,
        6, 12,
        5, 6,
        5, 7,
        6, 8,
        7, 9,
        8, 10,
        1, 2,
        0, 1,
        0, 2,
        1, 3,
        2, 4,
        3, 5,
        4, 6
    ]  #: The lines of skeleton of coco format.


class UserStatus:
    """
    The status of user.
    """

    InActive = "inactive"  #: The user is inactive, which means the user is logged out and cannot login.
    Active = "active"  #: The user is active


class FileReadMode:
    """
    The mode of reading file, text or binary.
    """

    Text = "t"
    Binary = "b"

    ALL_ = {Text, Binary}


class ContentEncoding:
    """
    | The encoding of file content.
    | Only used when the file is read as text.
    """

    Plain = "1"  #: plain, treat the content as what it is
    Base64 = "2"  #: base64,  treat the content as a base64 encoded string

    ALL_ = {Plain, Base64}


class TSVFileType:
    """
    | TSV dataset related file types.
    | TSV dataset format may contain multiple files, each of these types:
    """

    Embedding = "Embedding"  #: .embd file, used by :class:`deepdataspace.plugins.tsv.process.RankByFlags`.
    Prediction = "Pred"  #: .pred file, used by :class:`deepdataspace.plugins.tsv.importer.TSVImporter`.
    GroundTruth = LabelName.GroundTruth  #: .tsv file, used by :class:`deepdataspace.plugins.tsv.importer.TSVImporter`.


class LabelProjectStatus:
    """
    The status of label project.
    """

    Waiting = "waiting"  #: New project waiting for initializing.
    Initializing = "initializing"  #: Manager is initializing the project.
    Working = "working"  #: A manager is working on the label project.
    Reviewing = "reviewing"  #: Manager has finished the label project, waiting for owner to review.
    Rejected = "rejected"  #: Owner rejected the project.
    Accepted = "accepted"  #: Owner accepted the project.


class LabelProjectRoles:
    """
    | The roles of label project.
    | Roles are NOT designed in hierarchy structure, each role is independent and is responsible for a specific job.
    | Every user can have multiple roles in a project.
    """

    Owner = "owner"  #: Owner is the one created the project and want for the label result.
    Manager = "manager"  #: Manager is the one who is responsible for the operation of label project.
    LabelLeader = "label_leader"  #: Label leader is the one who leads the labelers to label the dataset.
    ReviewLeader = "review_leader"  #: Review leader is the one who leads the reviewers to review the label result.
    Labeler = "labeler"  #: Labeler is the one who labels the dataset.
    Reviewer = "reviewer"  #: Reviewer is the one who reviews the label result.

    GTLeaders_ = {Owner, Manager}  #: Roles above leaders.
    GTELeaders_ = {Owner, Manager, LabelLeader, ReviewLeader}  #: Roles above or equal to leaders.
    TaskBondedRoles_ = {LabelLeader, Labeler, ReviewLeader, Reviewer}  #: Roles that are task level.
    Leaders_ = {LabelLeader, ReviewLeader}  #: Roles that are leaders.
    Workers_ = {Labeler, Reviewer}  #: Roles that are workers.
    ReviewKinds_ = {Reviewer, ReviewLeader}  #: Roles that take part in the reviewing process.

    Levels_ = {
        Owner       : 0,
        Manager     : 1,
        LabelLeader : 2,
        ReviewLeader: 3,
        Labeler     : 4,
        Reviewer    : 5
    }  #: The level of every role, smaller number means higher level.


class LabelTaskStatus:
    Waiting = "waiting"  # the task is waiting for manager to assign leaders
    Working = "working"  # leaders are working on the task
    Reviewing = "reviewing"  # the task is completed, waiting for qa
    Rejected = "rejected"  # the task is rejected by manager in qa
    Accepted = "accepted"  # the task is accepted by manager in qa

    ALL_ = {Waiting, Working, Reviewing, Rejected, Accepted}


class LabelTaskImageStatus:
    Labeling = "labeling"  # waiting for labeler to label, or rejected and wait for labeler to re-label
    Reviewing = "reviewing"  # labeled by labeler, waiting for reviewer to review
    Rejected = "rejected"  # rejected by reviewer
    Accepted = "accepted"  # accepted by reviewer

    ALL_ = {Labeling, Reviewing, Rejected, Accepted}
    WaitForLabeling_ = {Labeling, Rejected}


class LabelTaskLabelStatus:
    Reviewing = "reviewing"  # labeled by labeler, waiting for reviewer to review
    Rejected = "rejected"  # rejected by reviewer
    Accepted = "accepted"  # accepted by reviewer

    ALL_ = {Reviewing, Rejected, Accepted}


class LabelTaskQAActions:
    Accept = "accept"
    Reject = "reject"
    ForceAccept = "force_accept"

    ALL_ = {Accept, Reject, ForceAccept}


class LabelProjectQAActions:
    Accept = "accept"
    Reject = "reject"

    ALL_ = {Accept, Reject}


class LabelImageQAActions:
    Accept = "accept"
    Reject = "reject"

    ALL_ = {Accept, Reject}


class RedisKey:
    DatasetImageDirs = "DatasetImageDirs"  #: A redis set storing the directories of all imported dataset images.
