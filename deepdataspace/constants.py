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
    Exported = "exported"  #: Owner has exported the project back to datasets.


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
        Owner: 0,
        Manager: 1,
        LabelLeader: 2,
        ReviewLeader: 3,
        Labeler: 4,
        Reviewer: 5
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


class ErrCode:
    # 200 family
    OK = 0  #: OK.
    OKMsg = "success"

    # For label project
    PartialSuccessBatchAssignLeaders = 200001  #: Batch assign leaders partially success.
    PartialSuccessBatchAssignLeadersMsg = "Batch assign leaders partially success."
    PartialSuccessBatchAssignWorkers = 200002  #: Batch assign workers partially success.
    PartialSuccessBatchAssignWorkersMsg = "Batch assign workers partially success."

    # 400 family
    BadRequest = 400000  #: Bad request.
    BadRequestMsg = "Bad request."
    ParameterMissing = 400001  #: Parameter missing.
    ParameterMissingMsg = "Parameter missing."
    ParameterIsInvalid = 400002  #: Parameter is invalid.
    ParameterIsInvalidMsg = "Parameter is invalid."

    # 400 family for annotation, range [400050, 400099]
    AnnotationNotListOfObj = 400050  #: Annotation must be a list of object.
    AnnotationNotListOfObjMsg = "Annotation must be a list of object."
    AnnotationMissingCatName = 400051  #: Annotation object missing category_name.
    AnnotationMissingCatNameMsg = "Annotation object missing category name."
    AnnotationMissingBBox = 400052  #: Annotation object missing bounding box.
    AnnotationMissingBBoxMsg = "Annotation object missing bounding box."
    AnnotationBBoxFormatError = 400053  #: Annotation object bounding box format error.
    AnnotationBBoxFormatErrorMsg = "Annotation object bounding box format error."
    AnnotationFormatError = 400054  #: Annotation object format error.
    AnnotationFormatErrorMsg = "Annotation object format error."

    # 400 family for flag, range [400100, 400149]
    FlagGroupsNotListOfObj = 400100  #: flag_groups must be a list of object.
    FlagGroupsNotListOfObjMsg = "flag_groups must be a list of object."
    FlagObjectMissingFlag = 400101  #: flag object missing flag.
    FlagObjectMissingFlagMsg = "flag object missing flag."
    FlagObjectFlagValueInvalid = 400102  #: flag object flag value invalid.
    FlagObjectFlagValueInvalidMsg = "flag object flag value invalid, must be one of [0, 1, 2]."
    FlagObjectMissingIDs = 400103  #: flag object missing ids.
    FlagObjectMissingIDsMsg = "flag object missing ids."
    FlagObjectIDsNotList = 400104  #: flag object ids must be a list.
    FlagObjectIDsNotListMsg = "flag object ids must be a list."

    # 400 family for label set, range [400150, 400199]
    LabelSetNameInvalid = 400150  #: label set name can't be GroundTruth and UserAnnotation.
    LabelSetNameInvalidMsg = "label set name can't be GroundTruth and UserAnnotation."
    LabelSetNameConflicts = 400151  #: target label set name is already taken.
    LabelSetNameConflictsMsg = "target label set name is already taken."

    # 400 family for label project, range [400200, 400249]
    UserNotFoundForLabelProject = 400200  #: user not found for label project.
    UserNotFoundForLabelProjectMsg = "user not found for label project."
    UserNotActiveForLabelProject = 400201  #: user not active for label project.
    UserNotActiveForLabelProjectMsg = "user not active for label project."
    DatasetNotFoundForLabelProject = 400202  #: dataset not found for label project.
    DatasetNotFoundForLabelProjectMsg = "dataset not found for label project."
    LabelTaskNotFoundForLabelProject = 400203  #: label task not found for label project.
    LabelTaskNotFoundForLabelProjectMsg = "label task not found for label project."
    CreateLabelProjectRequireManager = 400204  #: managers can't be empty when creating label project.
    CreateLabelProjectRequireManagerMsg = "managers can't be empty when creating label project."
    CreateLabelProjectRequireDataset = 400205  #: datasets can't be empty when creating label project.
    CreateLabelProjectRequireDatasetMsg = "datasets can't be empty when creating label project."
    CreateLabelProjectRequireCategory = 400206  #: categories can't be empty when creating label project.
    CreateLabelProjectRequireCategoryMsg = "categories can't be empty when creating label project."
    CreateLabelProjectDatasetOccupied = 400207  #: dataset is occupied by other label project.
    CreateLabelProjectDatasetOccupiedMsg = "dataset is occupied by other label project."
    EditLabelProjectRequireManager = 400208  #: managers can't be empty when editing label project.
    EditLabelProjectRequireManagerMsg = "managers can't be empty when editing label project."
    InitLabelProjectMustBeWaiting = 400209  #: label project must be in status of waiting for init.
    InitLabelProjectMustBeWaitingMsg = "label project must be in status of waiting for init."
    InitLabelProjectTaskConfigError = 400210  #: batch_size, label_times, review_times must be set at the same time.
    InitLabelProjectTaskConfigErrorMsg = "batch_size, label_times, review_times must be set at the same time."
    QALabelProjectActionError = 400211  #: qa action error, must be 'accept' or 'reject'.
    QALabelProjectActionErrorMsg = "qa action error, must be 'accept' or 'reject'."
    QALabelProjectMustBeReviewing = 400212  #: label project must be in status of reviewing.
    QALabelProjectMustBeReviewingMsg = "label project must be in status of reviewing."
    ExportLabelProjectMustBeAccepted = 400213  #: label project must be in status of accepted.
    ExportLabelProjectMustBeAcceptedMsg = "label project must be in status of accepted."
    LeaderIDIsRequired = 400214  #: leader_id is required.
    LeaderIDIsRequiredMsg = "labeler_leader_id and reviewer_leader_id can not be empty at the same time."
    LabelerIDIsRequired = 400215  #: labeler_id is required.
    LabelerIDIsRequiredMsg = "labeler_ids and reviewer_ids can not be empty at the same time."
    LabelProjectRoleIsNotTaskLevel = 400216  #: label project role is not task level, so it cannot be bounded to a task.
    LabelProjectRoleIsNotTaskLevelMsg = "label project role is not task level, so it cannot be bounded to a task."
    CantReplaceRoleWithTheSameUser = 400217  #: can't replace role with the same user.
    CantReplaceRoleWithTheSameUserMsg = "can't replace role with the same user."
    OldUserDoesNotHaveTheTaskRole = 400218  #: old user does not have the task role to be replaced.
    OldUserDoesNotHaveTheTaskRoleMsg = "old user does not have the task role to be replaced."
    NewUserAlreadyHaveTheTaskRole = 400219  #: new user already have the task role.
    NewUserAlreadyHaveTheTaskRoleMsg = "new user already have the task role."
    CantTransferRoleBetweenDifferentTask = 400220  #: can't transfer role between different task.
    CantTransferRoleBetweenDifferentTaskMsg = "can't transfer role between different task."
    CantTransferRoleToDifferentKind = 400221  #: can't transfer role to different kind.
    CantTransferRoleToDifferentKindMsg = "can't transfer role to different kind."
    RestartLabelTaskMustBeRejected = 400222  #: label task must be in status of rejected.
    RestartLabelTaskMustBeRejectedMsg = "label task must be in status of rejected."
    QALabelTaskActionError = 400223  #: qa action error, must be 'accept', 'reject' or 'force_accept'.
    QALabelTaskActionErrorMsg = "qa action error, must be 'accept', 'reject' or 'force_accept'."
    AcceptLabelTaskMustBeReviewing = 400224  #: label task must be in status of reviewing.
    AcceptLabelTaskMustBeReviewingMsg = "label task must be in status of reviewing."
    RejectLabelTaskMustBeReviewing = 400225  #: label task must be in status of reviewing.
    RejectLabelTaskMustBeReviewingMsg = "label task must be in status of reviewing."
    ForceAcceptLabelTaskMustBeRejected = 400226  #: label task must be in status of rejected.
    ForceAcceptLabelTaskMustBeRejectedMsg = "label task must be in status of rejected."
    LabelAnnotationMissingFields = 400227  #: label annotation missing fields.
    LabelAnnotationMissingFieldsMsg = "label annotation missing fields."
    LabelAnnotationFieldValueInvalid = 400228  #: label annotation field value invalid.
    LabelAnnotationFieldValueInvalidMsg = "label annotation field value invalid."
    LabelImageRequireTaskStatusWorking = 400229  #: label image require task status be working.
    LabelImageRequireTaskStatusWorkingMsg = "label image require task status be working."
    LabelImageRequireUnfinishedReviewing = 400230  #: label image require unfinished reviewing.
    LabelImageRequireUnfinishedReviewingMsg = "label image require unfinished reviewing."
    ReviewImageRequireTaskStatusWorking = 400231  #: review image require task status be working.
    ReviewImageRequireTaskStatusWorkingMsg = "review image require task status be working."
    ReviewImageRequireFinishedLabeling = 400232  #: review image require finished labeling.
    ReviewImageRequireFinishedLabelingMsg = "review image require finished labeling."
    ReviewImageTargetLabelNotFound = 400233  #: review image target label not found.
    ReviewImageTargetLabelNotFoundMsg = "review image target label not found."
    ReviewImageFoundExistedReview = 400234  #: image has already been reviewed.
    ReviewImageFoundExistedReviewMsg = "image has already been reviewed."
    CantDeleteAllOwnersOfLabelProject = 400235  #: can't delete all owners of label project.
    CantDeleteAllOwnersOfLabelProjectMsg = "can't delete all owners of label project."
    NumOfTaskLeaderMismatchesConfig = 400236  #: num of task leader mismatches config.
    NumOfTaskLeaderMismatchesConfigMsg = "num of task leader mismatches config."
    TaskDoesNotRequireReviewer = 400237  #: task does not require reviewer.
    TaskDoesNotRequireReviewerMsg = "task does not require reviewer."
    NumOfTaskLabelerMismatchesConfig = 400238  #: num of task labeler mismatches config.
    NumOfTaskLabelerMismatchesConfigMsg = "num of task labeler mismatches config."
    NumOfTaskReviewerMismatchesConfig = 400239  #: num of task reviewer mismatches config.
    NumOfTaskReviewerMismatchesConfigMsg = "num of task reviewer mismatches config."
    TryInitRoleForTaskWithActiveRoles = 400240  #: try init role for task with active roles.
    TryInitRoleForTaskWithActiveRolesMsg = "can't init roles for task with active roles."
    TaskRoleNotOfLeaderKind = 400241  #: task role not of leader kind.
    TaskRoleNotOfLeaderKindMsg = "task role not of leader kind."

    # 401 family
    Unauthorized = 401000  #: Unauthorized.
    UnauthorizedMsg = "Unauthorized."

    # 403 family
    Forbidden = 403000  #: Forbidden.
    ForbiddenMsg = "Forbidden."

    # 403 family for user, range [403050, 403099]
    UserAuthenticationFailed = 403050  #: User authentication failed.
    UserAuthenticationFailedMsg = "User authentication failed."
    UserCantViewLabelProjectTask = 403051  #: User can't view label project.
    UserCantViewLabelProjectTaskMsg = "User can't view label project."
    UserCantViewLabelProjectRole = 403052  #: User can't view label project role.
    UserCantViewLabelProjectRoleMsg = "User can't view label project role."
    UserCantCreateLabelProject = 403053  #: User can't create label project.
    UserCantCreateLabelProjectMsg = "User can't create label project."
    UserCantViewLabelProject = 403054  #: User can't view label project.
    UserCantViewLabelProjectMsg = "User can't view label project."
    UserCantEditLabelProject = 403055  #: User can't edit label project.
    UserCantEditLabelProjectMsg = "User can't edit label project."
    UserCantInitLabelProject = 403056  #: User can't init label project.
    UserCantInitLabelProjectMsg = "User can't init label project."
    UserCantQALabelProject = 403057  #: User can't QA label project.
    UserCantQALabelProjectMsg = "User can't QA label project."
    UserCantExportLabelProject = 403058  #: User can't export label project.
    UserCantExportLabelProjectMsg = "User can't export label project."
    UserCantAssignLabelTaskLeader = 403059  #: User can't assign label task leader.
    UserCantAssignLabelTaskLeaderMsg = "User can't assign label task leader."
    UserCantAssignLabelTaskWorker = 403060  #: User can't assign label task worker.
    UserCantAssignLabelTaskWorkerMsg = "User can't assign label task worker."
    UserCantRestartLabelTask = 403061  #: User can't restart label task.
    UserCantRestartLabelTaskMsg = "User can't restart label task."
    UserCantQALabelTask = 403062  #: User can't QA label task.
    UserCantQALabelTaskMsg = "User can't QA label task."
    UserCantLabelTaskImage = 403063  #: User can't label task image.
    UserCantLabelTaskImageMsg = "User can't label task image."
    UserCantReviewTaskImage = 403064  #: User can't review task image.
    UserCantReviewTaskImageMsg = "User can't review task image."

    # 404 family
    NotFound = 404000  #: Not found.
    NotFoundMsg = "Not found."

    # 404 family for dataset, range [404050, 404099]
    DatasetNotFound = 404050  #: Dataset not found.
    DatasetNotFoundMsg = "Dataset not found."
    DatasetNotReadable = 404051  #: Dataset not readable.
    DatasetNotReadableMsg = "Dataset not readable."
    DatasetMissingEmbdFile = 404052  #: Dataset missing embedding file for re-ranking task.
    DatasetMissingEmbdFileMsg = "Dataset missing embedding file."
    DatasetImageNotFound = 404053  #: Dataset image not found.
    DatasetImageNotFoundMsg = "Dataset image not found."
    DatasetHasNoFNFPData = 404054  #: Dataset has no FN/FP data.
    DatasetHasNoFNFPDataMsg = "Dataset has no FN/FP data."
    DatasetLabelNotFound = 404055  #: Dataset label not found.
    DatasetLabelNotFoundMsg = "Dataset label not found."
    DatasetFNFPPrecisionNotFound = 404056  #: Dataset FN/FP precision not found.
    DatasetFNFPPrecisionNotFoundMsg = "Dataset FN/FP precision not found."
    DatasetSubsetNotFound = "Dataset subset not found."
    DatasetSubsetNotFoundMsg = "Dataset subset not found."

    # 404 family for task, range [404100, 404149]
    ReRankByFlagTaskNotFound = 404100  #: Task not found.

    # 404 family for label project, range [404150, 404199]
    LabelProjectNotFound = 404150  #: Label project not found.
    LabelProjectNotFoundMsg = "Label project not found."
    LabelProjectRoleNotFound = 404151  #: Label project role not found.
    LabelProjectRoleNotFoundMsg = "Label project role not found."
    LabelProjectTaskNotFound = 404152  #: Label project task not found.
    LabelProjectTaskNotFoundMsg = "Label project task not found."
    LabelTaskImageNotFound = 404153  #: Label task image not found.
    LabelTaskImageNotFoundMsg = "Label task image not found."

    # 500 family
    InternalError = 500000  #: Internal error.
    InternalErrorMsg = "Internal error."
    FailedToCloneLabelSet = 500001  #: Failed to clone label set.
    FailedToCloneLabelSetMsg = "Failed to clone label set."
