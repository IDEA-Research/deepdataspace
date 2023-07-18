export default {
  /** aside */
  datasets: 'Datasets',
  projects: 'Projects',
  annotate: 'Annotate',
  annotator: 'Annotator',
  lab: 'Lab',
  docs: 'Docs',

  /** menu */
  'menu.Home': 'Home',
  'menu.Dataset': 'Dataset',
  'menu.Dataset.Dataset': 'Dataset',
  'menu.Dataset.Datasets': 'Datasets',
  'menu.Project': 'Project',
  'menu.Project.Projects': 'Project List',
  'menu.Project.ProjectDetail': 'Project Detail',
  'menu.Project.ProjectTaskWorkspace': 'Project Task Workspace',
  'menu.Login': 'Login',
  'menu.Annotator': 'Annotator',
  'menu.Lab': 'Lab',
  'menu.Lab.Lab': 'Lab',
  'menu.Lab.Datasets': 'Datasets',
  'menu.Lab.flagtool': 'Flag Tool',

  /** user */
  login: 'Login',
  logout: 'Logout',
  loginSuccess: 'Login Successfully',
  loginAuthenticationFailed:
    'Authentication failed. Please check your username and password and try again.',
  logoutSuccess: 'Logout Successfully',
  logoutFailed: 'Logout Failed',
  username: 'Username',
  password: 'Password',
  usernameTip: 'Please input your username',
  passwordTip: 'Please input your password',
  getStart: 'GET START',

  /** dataset */
  'dataset.images': 'images',
  'dataset.detail.category': 'Category',
  'dataset.detail.labelSets': 'Label sets',
  'dataset.diffMode.overlay': 'Overlay',
  'dataset.diffMode.tiled': 'Tiled',
  'dataset.detail.labelSetsName': 'Name',
  'dataset.detail.confidence': 'Confidence',
  'dataset.detail.style': 'Style',
  'dataset.detail.displayOptions': 'Display options',
  'dataset.detail.showAnnotations': 'Display annotation of selected type',
  'dataset.detail.displayType': 'Type',
  'dataset.detail.analysis': 'Analysis',
  'dataset.detail.analModal.title': 'Analysis',
  'dataset.detail.analModal.btn': 'Analysis FN/FP',
  'dataset.detail.analModal.select': 'Select a prediction label set',
  'dataset.detail.analModal.precision': 'Precision',
  'dataset.detail.analModal.sort': 'Sort',
  'dataset.detail.analModal.display': 'Display',
  'dataset.detail.analModal.diff': ' Diff',
  'dataset.detail.analModal.score': 'score',
  'dataset.detail.analModal.exit': 'Exit Analysis',
  'dataset.detail.columnSetting.title': 'Max column count',

  'dataset.toAnalysis.unSupportWarn':
    'You should have a prediction label set with detection annotaion first',
  'dataset.toAnalysis.unSelectWarn': 'Please select a prediction label set',
  'dataset.onClickCopyLink.success': 'Copy link success!',
  'dataset.detail.overlay': 'Overlay',

  /** Annotate */
  'annotate.quick': 'Quick Mode',
  'annotate.quick.desc':
    'Upload local image set for quick annotation experience',
  'annotate.collaborative': 'Collaborative Mode',
  'annotate.collaborative.desc':
    'Create project for collaborative annotation management',

  /** Annotator */
  'annotator.setting': 'Setting',
  'annotator.export': 'Export Annotation',
  'annotator.formModal.title': 'Before you start',
  'annotator.formModal.importImages': 'Import Images',
  'annotator.formModal.imageTips':
    'Tips: Import a maximum of 20 images, with each image not exceeding 5MB.',
  'annotator.formModal.categories': 'Categories',
  'annotator.formModal.addCategory': 'Add',
  'annotator.formModal.categoryPlaceholder':
    'Please enter the category names. You can input multiple categories by separating them with a new line. E.g.: \n person \n dog \n car',
  'annotator.formModal.categoriesCount': 'Categories Count',
  'annotator.formModal.fileRequiredMsg': 'At least one image is required.',
  'annotator.formModal.fileCountLimitMsg':
    'File count should not exceed {count}.',
  'annotator.formModal.fileSizeLimitMsg':
    'The size of each individual image cannot exceed {size} MB.',
  'annotator.formModal.categoryRequiredMsg':
    'At least one category is required.',
  'annotator.formModal.deleteCategory.title': 'Info',
  'annotator.formModal.deleteCategory.desc':
    'This category is used by current annotations. Please manually delete those annotations or revise their category first.',

  /** SmartAnnotation */
  'smartAnnotation.infoModal.title': 'Experience Intelligent Annotate',
  'smartAnnotation.infoModal.content':
    'Sorry, this feature is not available in the local version of DeepDataSpace currently. Please visit the official website for more information. You can contact us (deepdataspace_dm@idea.edu.cn) for a priority experience of intelligent annotate.',
  'smartAnnotation.infoModal.action': 'Visit Our Website',
  'smartAnnotation.detection.name': 'Intelligent Object Detection',
  'smartAnnotation.detection.input': 'Select or enter categories',
  'smartAnnotation.segmentation.name': 'Intelligent Segmentation',
  'smartAnnotation.pose.name': 'Intelligent Pose Estimation',
  'smartAnnotation.pose.input': 'Select template',
  'smartAnnotation.pose.apply': 'Apply Results',
  'smartAnnotation.annotate': 'Auto-Annotate',
  'smartAnnotation.segmentation.tipsInitial':
    'Tips: Draw a bounding box around your target or click the center of it to generate initial segmentation.',
  'smartAnnotation.segmentation.tipsNext':
    'Tips: Modify results by clicking the left mouse button to add a positive point, or clicking the right mouse button to add a negative point.',
  'smartAnnotation.msg.loading': 'Loading Intelligent Annotation...',
  'smartAnnotation.msg.success': 'Request Annotations Successfully',
  'smartAnnotation.msg.error': 'Request Annotations Failed',
  'smartAnnotation.msg.labelRequired': 'Please select one category at least',
  'smartAnnotation.msg.confResults': '{count} matching annotations shown',
  'smartAnnotation.msg.applyConf':
    '{count} annotations have been retained, with the others removed.',
  'smartAnnotation.rateLimit.title': 'Tips',
  'smartAnnotation.rateLimit.content':
    'Sorry, our public server is currently under low capacity and unable to process your request. Please try again later.',
  'smartAnnotation.rateLimit.okText': 'OK',

  /** Editor */
  'editor.save': 'Save',
  'editor.cancel': 'Cancel',
  'editor.delete': 'Delete',
  'editor.reject': 'Reject',
  'editor.approve': 'Approve',
  'editor.prev': 'Previous Image',
  'editor.next': 'Next Image',
  'editor.exit': 'Exit',
  'editor.shortcuts': 'Shortcuts',
  'editor.confidence': 'Confidence',
  'editor.annotsList.categories': 'Categories',
  'editor.annotsList.objects': 'Objects',
  'editor.annotsList.hideAll': 'Hide All',
  'editor.annotsList.showAll': 'Show All',
  'editor.annotsList.hideCate': 'Hide Category',
  'editor.annotsList.showCate': 'Show Category',
  'editor.annotsList.hide': 'Hide',
  'editor.annotsList.show': 'Show',
  'editor.annotsList.delete': 'Delete',
  'editor.annotsList.convertToSmartMode': 'Convert To Intelligent Segmentation',
  'editor.toolbar.undo': 'Undo',
  'editor.toolbar.redo': 'Redo',
  'editor.toolbar.rectangle': 'Rectangle',
  'editor.toolbar.polygon': 'Polygon',
  'editor.toolbar.skeleton': 'Skeleton (Human Body)',
  'editor.toolbar.aiAnno': 'Intelligent Annotate',
  'editor.toolbar.drag': 'Drag / Select Tool',
  'editor.zoomTool.reset': 'Reset Zoom',
  'editor.zoomIn': 'Zoom In',
  'editor.zoomOut': 'Zoom Out',
  'editor.toolbar.undo.desc': 'Undo the previous action.',
  'editor.toolbar.redo.desc': 'Redo the previous action.',
  'editor.toolbar.rectangle.desc':
    'Click and drag to create a rectangular annotation that surrounds an object.',
  'editor.toolbar.polygon.desc':
    'Click around the object to create a closed polygon annotation.',
  'editor.toolbar.skeleton.desc':
    'Click and drag to create a human skeleton annotation, then modify the position of individual points.',
  'editor.toolbar.aiAnno.desc':
    'Activate this mode under any of Rectangle / Polygon / Skeleton tools for auto-generating corresponding annotations.',
  'editor.toolbar.drag.desc':
    'Drag the image or select & edit individual annotations.',
  'editor.annotsEditor.title': 'Annotation Editor',
  'editor.annotsEditor.delete': 'Delete',
  'editor.annotsEditor.finish': 'Finish',
  'editor.annotsEditor.add': 'Add',
  'editor.annotsEditor.addCategory': 'Add a category',
  'editor.confirmLeave.content':
    'Are you sure to leave without saving your changes ?',
  'editor.confirmLeave.cancel': 'Wrong Click',
  'editor.confirmLeave.ok': 'No Need to Save',
  'editor.shortcuts.tools': 'Basic Tools',
  'editor.shortcuts.tools.rectangle': 'Rectangle Tool',
  'editor.shortcuts.tools.polygon': 'Polygon Tool',
  'editor.shortcuts.tools.skeleton': 'Skeleton Tool',
  'editor.shortcuts.tools.drag': 'Drag / Select Tool',
  'editor.shortcuts.general': 'General Controls',
  'editor.shortcuts.general.smart':
    'Activate / Deactivate Intelligent Annotate',
  'editor.shortcuts.general.undo': 'Undo',
  'editor.shortcuts.general.redo': 'Redo',
  'editor.shortcuts.general.next': 'Next Image',
  'editor.shortcuts.general.prev': 'Previous Image',
  'editor.shortcuts.general.save': 'Save',
  'editor.shortcuts.general.accept': 'Accept',
  'editor.shortcuts.general.reject': 'Reject',
  'editor.shortcuts.viewControl': 'View Controls',
  'editor.shortcuts.viewControl.zoomIn': 'Zoom In',
  'editor.shortcuts.viewControl.zoomOut': 'Zoom Out',
  'editor.shortcuts.viewControl.zoomReset': 'Reset zoom to fit screen',
  'editor.shortcuts.viewControl.hideCurrObject':
    'Hide / Show current selected annotation',
  'editor.shortcuts.viewControl.hideCurrCategory':
    'Hide / Show all annotations of the selected category',
  'editor.shortcuts.viewControl.hideAll': 'Hide / Show all annotations',
  'editor.shortcuts.viewControl.panImage':
    'Pan the image by dragging mouse while holding the key',
  'editor.shortcuts.annotsControl': 'Annotation Controls',
  'editor.shortcuts.annotsControl.delete': 'Delete current selected annotation',
  'editor.shortcuts.annotsControl.finish':
    'Complete the annotation creation or modification',
  'editor.shortcuts.annotsControl.cancel':
    'Cancel the selection or discard the annotation in progress',
  'editor.msg.lostCategory':
    '{count} annotations have lost their categories. Please revise them manually.',
  'editor.annotsList.uncategorized': 'Uncategorized',
  'editor.annotsList.point.notInImage': 'Not In Image',
  'editor.annotsList.point.notVisible': 'Not Visible',
  'editor.annotsList.point.visible': 'Visible',

  /** projects */
  'proj.title': 'Projects',
  'proj.table.name': 'Project Name',
  'proj.table.owner': 'Owner',
  'proj.table.datasets': 'Datasets',
  'proj.table.progress': 'Task Progress',
  'proj.table.PM': 'Project Manager',
  'proj.table.status': 'Status',
  'proj.table.createAt': 'Create At',
  'proj.table.action': 'Action',
  'proj.table.action.accept': 'Accept',
  'proj.table.action.reject': 'Reject',
  'proj.table.action.reject.tips': 'Are you sure to reject this project?',
  'proj.table.action.edit': 'Edit',
  'proj.table.action.init': 'Init',
  'proj.table.action.info': 'info',
  'proj.table.action.detail': 'Detail',
  'proj.table.action.export': 'Export',
  'proj.table.newProject': 'New Project',

  'proj.table.detail.index': 'Index',
  'proj.table.detail.labelLeader': 'Label Leader',
  'proj.table.detail.labeler': 'Labeler',
  'proj.table.detail.reviewLeader': 'Review Leader',
  'proj.table.detail.reviewer': 'Reviewer',
  'proj.table.detail.progress': 'Progress',
  'proj.table.detail.status': 'Status',
  'proj.table.detail.action': 'Action',

  'proj.table.detail.action.assignLeader': 'Assign Leader',
  'proj.table.detail.action.assignWorker': 'Assign Worker',
  'proj.table.detail.action.detail': 'Detail',
  'proj.table.detail.action.restart': 'Restart',
  'proj.table.detail.action.accept': 'Accept',
  'proj.table.detail.action.reject': 'Reject',
  'proj.table.detail.action.reject.tips': 'Are you sure to reject this task?',
  'proj.table.detail.action.view': 'View',
  'proj.table.detail.action.startLabel': 'Start Label',
  'proj.table.detail.action.startReview': 'Start Review',

  'proj.table.detail.batchAssignLeader': 'Batch Assign Leader',
  'proj.detail.owner': 'Owner',
  'proj.detail.managers': 'Managers',

  'proj.assign.modal.assign': 'Assign',
  'proj.assign.modal.reassign': 'Reassign',
  'proj.assign.modal.ll.label': 'Leader of Label Team',
  'proj.assign.modal.ll.placeholder':
    'Select one of members as Team Leader to assign labelers',
  'proj.assign.modal.ll.tooltip':
    'Assign yourself as Team Leader is also allowed here',
  'proj.assign.modal.ll.msg':
    'Please select one of members as Team Leader for this task',
  'proj.assign.modal.rl.label': 'Leader of Review Team',
  'proj.assign.modal.rl.placeholder':
    'Select one of members as Team Leader to assign reviews',
  'proj.assign.modal.rl.tooltip':
    'Assign yourself as Team Leader is also allowed here',
  'proj.assign.modal.rl.msg':
    'Please select one of members as Team Leader for this task',
  'proj.assign.modal.ler.label': 'Labeler',
  'proj.assign.modal.ler.placeholder':
    'Select {times} of members as labeler to work',
  'proj.assign.modal.ler.tootltip':
    'Assign yourself as Labeler is also allowed here',
  'proj.assign.modal.ler.msg':
    'Please select {times} of members as Labeler for this task',
  'proj.assign.modal.ler.msgTimes': 'Must be {times} members',
  'proj.assign.modal.rer.label': 'Reviewer',
  'proj.assign.modal.rer.placeholder':
    'Select {times} of members as labeler to work',
  'proj.assign.modal.rer.tootltip':
    'Assign yourself as Reviewer is also allowed here',
  'proj.assign.modal.rer.msg':
    'Please select {times} of members as Reviewer for this task',
  'proj.assign.modal.rer.msgTimes': 'Must be {times} members',
  'proj.assign.modal.reassign.label': 'Reassign to',
  'proj.assign.modal.reassign.placeholder': 'Select one of members to reassign',
  'proj.assign.modal.reassign.msg': 'Please select one of members to reassign',

  'proj.detail.modal.reassign': 'Reassign',
  'proj.detail.modal.index': 'Index',
  'proj.detail.modal.role': 'Role',
  'proj.detail.modal.worker': 'Worker',
  'proj.detail.modal.progress': 'Progress',
  'proj.detail.modal.action': 'Action',
  'proj.detail.modal.title': 'Task Detail {id}',

  'proj.taskProgress.done': 'Done',
  'proj.taskProgress.inRework': 'InRework',
  'proj.taskProgress.toReview': 'ToReview',
  'proj.taskProgress.toLabel': 'ToLabel',

  'proj.assignModalFinish.assignLeader': 'Assign team leader success!',
  'proj.assignModalFinish.assignWorker': 'Assign worker success!',
  'proj.assignModalFinish.reassignWorker': 'Reassign worker success!',
  'proj.assignModalFinish.restarTask': 'Restart task success!',
  'proj.assignModalFinish.commiTask': 'Commit task success!',
  'proj.assignModalFinish.changeTaskStatus': 'Change task status success!',

  'proj.projectModalFinish.new': 'New project success!',
  'proj.projectModalFinish.edit': 'Edit project success!',
  'proj.projectModalFinish.init': 'Init project success!',
  'proj.projectModalFinish.change': 'Change project status success!',

  'proj.onLabelSave.warning': 'have not add any annotation, please check it',
  'proj.onLabelSave.loading': 'Saving annotation...',
  'proj.onLabelSave.save': 'Save success！',
  'proj.onLabelSave.finish': 'Finish work！',
  'proj.onLabelSave.error': 'Save annotation fail, please retry',

  'proj.onReviewResult.loading': 'Saving review result...',
  'proj.onReviewResult.save': 'Save success！',
  'proj.onReviewResult.finish': 'Finish work！',
  'proj.onReviewResult.error': 'Save review result fail, please retry',
  'proj.tabItems.toLabel': 'To Label ({num})',
  'proj.tabItems.toReview': 'To Review ({num})',
  'proj.tabItems.inRework': 'In Rework ({num})',
  'proj.tabItems.done': 'Done ({num})',

  'proj.editModal.editProj': 'Edit Project',
  'proj.editModal.newProj': 'New Project',
  'proj.editModal.stepForm.title': 'Basics',
  'proj.editModal.stepForm.desc': 'Admin Only',
  'proj.editModal.stepForm.name.label': 'Project Name',
  'proj.editModal.stepForm.name.placeholder': 'Please input project name',
  'proj.editModal.stepForm.name.rule': 'Please input project name',
  'proj.editModal.stepForm.desc.label': 'Description',
  'proj.editModal.stepForm.desc.placeholder':
    'Optional description of your project',
  'proj.editModal.stepForm.dataset.label': 'Datasets',
  'proj.editModal.stepForm.dataset.placeholder':
    'Connect at least one dataset to this project',
  'proj.editModal.stepForm.dataset.rule':
    'Please select at least one dataset for this project',
  'proj.editModal.stepForm.preLabel.label': 'Pre Label',
  'proj.editModal.stepForm.preLabel.placeholder': 'Please input pre label name',
  'proj.editModal.stepForm.category.label': 'Categories',
  'proj.editModal.stepForm.category.placeholder': `Please input project categories, split with ','`,
  'proj.editModal.stepForm.category.rule': 'Please input categories',
  'proj.editModal.stepForm.PM.label': 'Project Managers',
  'proj.editModal.stepForm.PM.placeholder':
    'Select at least one of members as Project Manager to manage tasks',
  'proj.editModal.stepForm.PM.extra':
    'Assign yourself as PM is also allowed here',
  'proj.editModal.stepForm.PM.rule':
    'Please select at least one of members as Project Manager',
  'proj.editModal.stepForm.task.title': 'Workflow Setting',
  'proj.editModal.stepForm.task.desc': 'Project Manager Only',
  'proj.editModal.stepForm.task.msg':
    'Project Manager Only (You can assign yourself as PM on previous step).',
  'proj.editModal.stepForm.radio.label': 'Split Task Way',
  'proj.editModal.stepForm.radio.dataset': 'dataset',
  'proj.editModal.stepForm.radio.size': 'Batch Size',
  'proj.editModal.stepForm.batchSize.label': 'Batch Size',
  'proj.editModal.stepForm.batchSize.placeholder': 'Please enter Batch size',
  'proj.editModal.stepForm.batchSize.tooltip':
    'Batch size is set as the number of images of each task',
  'proj.editModal.stepForm.batchSize.msg': 'Please enter Batch size',
  'proj.editModal.stepForm.rview.label': 'Rviewer Settings',
  'proj.editModal.stepForm.rview.no': 'No Reviewer',
  'proj.editModal.stepForm.rview.one': '1 Reviewer',
  'proj.editModal.setWorkflowNow': 'Set workflow now',

  'proj.infoModal.title': 'Project Info',
  'proj.infoModal.name': 'Project Name',
  'proj.infoModal.desc': 'Description',
  'proj.infoModal.label': 'Project Managers',

  'proj.exportModal.title': 'Export to Dataset',
  'proj.exportModal.labelName.name': 'Labelset',
  'proj.exportModal.labelName.rule': 'Please input labelset name',
  'proj.exportModal.labelName.tips':
    'You can check labeling result in selected dataset with the labelset name after clicking "OK". ',
  'proj.exportModal.submitSuccess':
    'Successfully export labelset "{name}" into selected dataset, you can check labeled results in datasets module.',

  'proj.workspace.eTask.startLabel': 'Start Label',
  'proj.workspace.eTask.edit': 'Edit',
  'proj.workspace.eTask.startRework': 'Start Rework',
  'proj.workspace.eTask.startReview': 'Start Review',
  'proj.workspace.eProj.startLabeling': 'Start Labeling',
  'proj.workspace.eProj.startRework': 'Start Rework',
  'proj.workspace.eProj.startReview': 'Start Review',
  'proj.workspace.eProj.role': 'Current Role',

  'proj.statusMap.waiting': 'Waiting',
  'proj.statusMap.initializing': 'Initializing',
  'proj.statusMap.working': 'Working',
  'proj.statusMap.reviewing': 'Reviewing',
  'proj.statusMap.rejected': 'Rejected',
  'proj.statusMap.accepted': 'Accepted',
  'proj.statusMap.exported': 'Exported',

  'proj.eTaskStatus.waiting': 'Waiting',
  'proj.eTaskStatus.working': 'Working',
  'proj.eTaskStatus.reviewing': 'Reviewing',
  'proj.eTaskStatus.rejected': 'Rejected',
  'proj.eTaskStatus.accepted': 'Accepted',

  /** Lab */
  'lab.card.title': 'Flag Tool',
  'lab.card.subTitle': 'Pick images to flag',
  'lab.toolsBar.selectAll': 'Select all',
  'lab.toolsBar.selectSome': 'Selected {num} items',
  'lab.toolsBar.selectInvert': 'Select invert',
  'lab.toolsBar.filter': 'Filter',
  'lab.toolsBar.saveAs': 'Save selected items as',
  'lab.toolsBar.updateOrder': 'Update Order',

  'lab.displayOption.showAnnotations': 'Display annotation of selected type',
  'lab.displayOption.showAllCategory':
    'Display annotations from all categories',
  'lab.displayOption.showImgDesc': 'Show image description',
  'lab.displayOption.showBoxText': 'Show text in boxes',
  'lab.displayOption.showSegFilling': 'Display segmentation filling (F)',
  'lab.displayOption.showSegContour': 'Display segmentation contour (C)',
  'lab.displayOption.showMattingColorFill': 'Display matting color filling',
  'lab.displayOption.showKeyPointsLine': 'Display keypoint lines',
  'lab.displayOption.showKeyPointsBox': 'Display keypoint boxs',
  'lab.onClickCopyLink.success': 'Copy link success!',

  /** 404 */
  'notFound.title': 'Sorry, the page you visited does not exist.',
  'notFound.backHome': 'Back Home',

  /** mobile alert **/
  'mobileAlert.title': 'Kindly Reminder',
  'mobileAlert.subTitle':
    'This site not support mobile display yet, please switch to computer to open.',

  /** app */
  'layout.title': 'Deep Data Space',

  /** error code & status msg or error handler msg **/
  'requestConfig.errorData.msg': 'Request error, please retry ({code})',
  'requestConfig.success.msg': 'Request succeeded.',
  'requestConfig.unAuth.msg': 'Unauthorized access. Please Login.',
  'requestConfig.permissionDenied.msg':
    'Permission denied. Your account does not have the required permissions to perform this action.',
  'requestConfig.responseStatus.msg': 'Response status: {status}',
  'requestConfig.noResponse.msg': 'None response! Please retry.',
  'requestConfig.requestError.msg': 'Request error, please retry.',
  'requestConfig.errorContent.msg':
    'Request contains sensitive content, please check.',

  'errCode.PartialSuccessBatchAssignLeaders':
    'Batch assign leaders partially success.',
  'errCode.PartialSuccessBatchAssignWorkers':
    'Batch assign workers partially success.',
  'errCode.BadRequest': 'Bad request.',
  'errCode.ParameterMissing': 'Parameter missing.',
  'errCode.ParameterIsInvalid': 'Parameter is invalid.',
  'errCode.AnnotationNotListOfObj': 'Annotation must be a list of object.',
  'errCode.AnnotationMissingCatName':
    'Annotation object missing category name.',
  'errCode.AnnotationMissingBBox': 'Annotation object missing bounding box.',
  'errCode.AnnotationBBoxFormatError':
    'Annotation object bounding box format error.',
  'errCode.AnnotationFormatError': 'Annotation object format error.',
  'errCode.FlagGroupsNotListOfObj': 'flag_groups must be a list of object.',
  'errCode.FlagObjectMissingFlag': 'flag object missing flag.',
  'errCode.FlagObjectFlagValueInvalid':
    'flag object flag value invalid, must be one of [0, 1, 2].',
  'errCode.FlagObjectMissingIDs': 'flag object missing ids.',
  'errCode.FlagObjectIDsNotList': 'flag object ids must be a list.',
  'errCode.LabelSetNameInvalid':
    "label set name can't be GroundTruth and UserAnnotation.",
  'errCode.LabelSetNameConflicts': 'target label set name is already taken.',
  'errCode.UserNotFoundForLabelProject': 'user not found for label project.',
  'errCode.UserNotActiveForLabelProject': 'user not active for label project.',
  'errCode.DatasetNotFoundForLabelProject':
    'dataset not found for label project.',
  'errCode.LabelTaskNotFoundForLabelProject':
    'label task not found for label project.',
  'errCode.CreateLabelProjectRequireManager':
    "managers can't be empty when creating label project.",
  'errCode.CreateLabelProjectRequireDataset':
    "datasets can't be empty when creating label project.",
  'errCode.CreateLabelProjectRequireCategory':
    "categories can't be empty when creating label project.",
  'errCode.CreateLabelProjectDatasetOccupied':
    'dataset is occupied by other label project.',
  'errCode.EditLabelProjectRequireManager':
    "managers can't be empty when editing label project.",
  'errCode.InitLabelProjectMustBeWaiting':
    'label project must be in status of waiting for init.',
  'errCode.InitLabelProjectTaskConfigError':
    'batch_size, label_times, review_times must be set at the same time.',
  'errCode.QALabelProjectActionError':
    "qa action error, must be 'accept' or 'reject'.",
  'errCode.QALabelProjectMustBeReviewing':
    'label project must be in status of reviewing.',
  'errCode.ExportLabelProjectMustBeAccepted':
    'label project must be in status of accepted.',
  'errCode.LeaderIDIsRequired':
    'labeler_leader_id and reviewer_leader_id can not be empty at the same time.',
  'errCode.LabelerIDIsRequired':
    'labeler_ids and reviewer_ids can not be empty at the same time.',
  'errCode.LabelProjectRoleIsNotTaskLevel':
    'label project role is not task level, so it cannot be bounded to a task.',
  'errCode.CantReplaceRoleWithTheSameUser':
    "can't replace role with the same user.",
  'errCode.OldUserDoesNotHaveTheTaskRole':
    'old user does not have the task role to be replaced.',
  'errCode.NewUserAlreadyHaveTheTaskRole':
    'new user already have the task role.',
  'errCode.CantTransferRoleBetweenDifferentTask':
    "can't transfer role between different task.",
  'errCode.CantTransferRoleToDifferentKind':
    "can't transfer role to different kind.",
  'errCode.RestartLabelTaskMustBeRejected':
    'label task must be in status of rejected.',
  'errCode.QALabelTaskActionError':
    "qa action error, must be 'accept', 'reject' or 'force_accept'.",
  'errCode.AcceptLabelTaskMustBeReviewing':
    'label task must be in status of reviewing.',
  'errCode.RejectLabelTaskMustBeReviewing':
    'label task must be in status of reviewing.',
  'errCode.ForceAcceptLabelTaskMustBeRejected':
    'label task must be in status of rejected.',
  'errCode.LabelAnnotationMissingFields': 'label annotation missing fields.',
  'errCode.LabelAnnotationFieldValueInvalid':
    'label annotation field value invalid.',
  'errCode.LabelImageRequireTaskStatusWorking':
    'label image require task status be working.',
  'errCode.LabelImageRequireUnfinishedReviewing':
    'label image require unfinished reviewing.',
  'errCode.ReviewImageRequireTaskStatusWorking':
    'review image require task status be working.',
  'errCode.ReviewImageRequireFinishedLabeling':
    'review image require finished labeling.',
  'errCode.ReviewImageTargetLabelNotFound':
    'review image target label not found.',
  'errCode.ReviewImageFoundExistedReview': 'image has already been reviewed.',
  'errCode.CantDeleteAllOwnersOfLabelProject':
    "can't delete all owners of label project.",
  'errCode.NumOfTaskLeaderMismatchesConfig':
    'num of task leader mismatches config.',
  'errCode.TaskDoesNotRequireReviewer': 'task does not require reviewer.',
  'errCode.NumOfTaskLabelerMismatchesConfig':
    'num of task labeler mismatches config.',
  'errCode.NumOfTaskReviewerMismatchesConfig':
    'num of task reviewer mismatches config.',
  'errCode.TryInitRoleForTaskWithActiveRoles':
    "can't init roles for task with active roles.",
  'errCode.TaskRoleNotOfLeaderKind': 'task role not of leader kind.',
  'errCode.Unauthorized': 'Unauthorized.',
  'errCode.Forbidden': 'Forbidden.',
  'errCode.UserAuthenticationFailed': 'User authentication failed.',
  'errCode.UserCantViewLabelProjectTask': "User can't view label project.",
  'errCode.UserCantViewLabelProjectRole': "User can't view label project role.",
  'errCode.UserCantCreateLabelProject': "User can't create label project.",
  'errCode.UserCantViewLabelProject': "User can't view label project.",
  'errCode.UserCantEditLabelProject': "User can't edit label project.",
  'errCode.UserCantInitLabelProject': "User can't init label project.",
  'errCode.UserCantQALabelProject': "User can't QA label project.",
  'errCode.UserCantExportLabelProject': "User can't export label project.",
  'errCode.UserCantAssignLabelTaskLeader':
    "User can't assign label task leader.",
  'errCode.UserCantAssignLabelTaskWorker':
    "User can't assign label task worker.",
  'errCode.UserCantRestartLabelTask': "User can't restart label task.",
  'errCode.UserCantQALabelTask': "User can't QA label task.",
  'errCode.UserCantLabelTaskImage': "User can't label task image.",
  'errCode.UserCantReviewTaskImage': "User can't review task image.",
  'errCode.NotFound': 'Not found.',
  'errCode.DatasetNotFound': 'Dataset not found.',
  'errCode.DatasetNotReadable': 'Dataset not readable.',
  'errCode.DatasetMissingEmbdFile': 'Dataset missing embedding file.',
  'errCode.DatasetImageNotFound': 'Dataset image not found.',
  'errCode.DatasetHasNoFNFPData': 'Dataset has no FN/FP data.',
  'errCode.DatasetLabelNotFound': 'Dataset label not found.',
  'errCode.DatasetFNFPPrecisionNotFound': 'Dataset FN/FP precision not found.',
  'errCode.DatasetSubsetNotFound': 'Dataset subset not found.',
  'errCode.LabelProjectNotFound': 'Label project not found.',
  'errCode.LabelProjectRoleNotFound': 'Label project role not found.',
  'errCode.LabelProjectTaskNotFound': 'Label project task not found.',
  'errCode.LabelTaskImageNotFound': 'Label task image not found.',
  'errCode.TokenExceedsRateLimit': 'Token exceeds Rate Limit.',
  'errCode.InternalError': 'Internal error.',
  'errCode.FailedToCloneLabelSet': 'Failed to clone label set.',
};
