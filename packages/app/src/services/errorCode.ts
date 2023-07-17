import { globalLocaleText } from '@/locales/helper';

export const ERROR_STATUS_MSG_MAP: Record<number, string> = {
  /** CODE_2XX */
  200: 'requestConfig.success.msg',
  /** CODE_4xx */
  401: 'requestConfig.unAuth.msg',
  403: 'requestConfig.permissionDenied.msg',
  429: 'errCode.TokenExceedsRateLimit',
  /** CODE_5XX */
  500: 'requestConfig.responseStatus.msg',
};

export const ERROR_CODE_MSG_MAP: Record<number, string> = {
  101: 'requestConfig.errorContent.msg',
  /** CODE_2XXXXX */
  200001: 'errCode.PartialSuccessBatchAssignLeaders',
  200002: 'errCode.PartialSuccessBatchAssignWorkers',

  /** CODE_4XXXXX */
  400000: 'errCode.BadRequest',
  400001: 'errCode.ParameterMissing',
  400002: 'errCode.ParameterIsInvalid',
  400050: 'errCode.AnnotationNotListOfObj',
  400051: 'errCode.AnnotationMissingCatName',
  400052: 'errCode.AnnotationMissingBBox',
  400053: 'errCode.AnnotationBBoxFormatError',
  400054: 'errCode.AnnotationFormatError',
  400100: 'errCode.FlagGroupsNotListOfObj',
  400101: 'errCode.FlagObjectMissingFlag',
  400102: 'errCode.FlagObjectFlagValueInvalid',
  400103: 'errCode.FlagObjectMissingIDs',
  400104: 'errCode.FlagObjectIDsNotList',
  400150: 'errCode.LabelSetNameInvalid',
  400151: 'errCode.LabelSetNameConflicts',
  400200: 'errCode.UserNotFoundForLabelProject',
  400201: 'errCode.UserNotActiveForLabelProject',
  400202: 'errCode.DatasetNotFoundForLabelProject',
  400203: 'errCode.LabelTaskNotFoundForLabelProject',
  400204: 'errCode.CreateLabelProjectRequireManager',
  400205: 'errCode.CreateLabelProjectRequireDataset',
  400206: 'errCode.CreateLabelProjectRequireCategory',
  400207: 'errCode.CreateLabelProjectDatasetOccupied',
  400208: 'errCode.EditLabelProjectRequireManager',
  400209: 'errCode.InitLabelProjectMustBeWaiting',
  400210: 'errCode.InitLabelProjectTaskConfigError',
  400211: 'errCode.QALabelProjectActionError',
  400212: 'errCode.QALabelProjectMustBeReviewing',
  400213: 'errCode.ExportLabelProjectMustBeAccepted',
  400214: 'errCode.LeaderIDIsRequired',
  400215: 'errCode.LabelerIDIsRequired',
  400216: 'errCode.LabelProjectRoleIsNotTaskLevel',
  400217: 'errCode.CantReplaceRoleWithTheSameUser',
  400218: 'errCode.OldUserDoesNotHaveTheTaskRole',
  400219: 'errCode.NewUserAlreadyHaveTheTaskRole',
  400220: 'errCode.CantTransferRoleBetweenDifferentTask',
  400221: 'errCode.CantTransferRoleToDifferentKind',
  400222: 'errCode.RestartLabelTaskMustBeRejected',
  400223: 'errCode.QALabelTaskActionError',
  400224: 'errCode.AcceptLabelTaskMustBeReviewing',
  400225: 'errCode.RejectLabelTaskMustBeReviewing',
  400226: 'errCode.ForceAcceptLabelTaskMustBeRejected',
  400227: 'errCode.LabelAnnotationMissingFields',
  400228: 'errCode.LabelAnnotationFieldValueInvalid',
  400229: 'errCode.LabelImageRequireTaskStatusWorking',
  400230: 'errCode.LabelImageRequireUnfinishedReviewing',
  400231: 'errCode.ReviewImageRequireTaskStatusWorking',
  400232: 'errCode.ReviewImageRequireFinishedLabeling',
  400233: 'errCode.ReviewImageTargetLabelNotFound',
  400234: 'errCode.ReviewImageFoundExistedReview',
  400235: 'errCode.CantDeleteAllOwnersOfLabelProject',
  400236: 'errCode.NumOfTaskLeaderMismatchesConfig',
  400237: 'errCode.TaskDoesNotRequireReviewer',
  400238: 'errCode.NumOfTaskLabelerMismatchesConfig',
  400239: 'errCode.NumOfTaskReviewerMismatchesConfig',
  400240: 'errCode.TryInitRoleForTaskWithActiveRoles',
  400241: 'errCode.TaskRoleNotOfLeaderKind',
  401000: 'errCode.Unauthorized',
  401001: 'requestConfig.unAuth.msg',
  403000: 'errCode.Forbidden',
  403001: 'requestConfig.permissionDenied.msg',
  403050: 'errCode.UserAuthenticationFailed',
  403051: 'errCode.UserCantViewLabelProjectTask',
  403052: 'errCode.UserCantViewLabelProjectRole',
  403053: 'errCode.UserCantCreateLabelProject',
  403054: 'errCode.UserCantViewLabelProject',
  403055: 'errCode.UserCantEditLabelProject',
  403056: 'errCode.UserCantInitLabelProject',
  403057: 'errCode.UserCantQALabelProject',
  403058: 'errCode.UserCantExportLabelProject',
  403059: 'errCode.UserCantAssignLabelTaskLeader',
  403060: 'errCode.UserCantAssignLabelTaskWorker',
  403061: 'errCode.UserCantRestartLabelTask',
  403062: 'errCode.UserCantQALabelTask',
  403063: 'errCode.UserCantLabelTaskImage',
  403064: 'errCode.UserCantReviewTaskImage',
  404000: 'errCode.NotFound',
  404050: 'errCode.DatasetNotFound',
  404051: 'errCode.DatasetNotReadable',
  404052: 'errCode.DatasetMissingEmbdFile',
  404053: 'errCode.DatasetImageNotFound',
  404054: 'errCode.DatasetHasNoFNFPData',
  404055: 'errCode.DatasetLabelNotFound',
  404056: 'errCode.DatasetFNFPPrecisionNotFound',
  404100: 'errCode.ReRankByFlagTaskNotFound',
  404150: 'errCode.LabelProjectNotFound',
  404151: 'errCode.LabelProjectRoleNotFound',
  404152: 'errCode.LabelProjectTaskNotFound',
  404153: 'errCode.LabelTaskImageNotFound',
  429002: 'errCode.TokenExceedsRateLimit',
  500000: 'errCode.InternalError',
  /** CODE_5XXXXX */
  500001: 'errCode.FailedToCloneLabelSet',
};

/**
 * return common code / status message
 * @param code
 * @param status
 * @returns
 */
export const matchErrorMsg = (code?: number, status?: number) => {
  if (code && ERROR_CODE_MSG_MAP[code]) {
    return globalLocaleText(ERROR_CODE_MSG_MAP[code]);
  }
  if (status && ERROR_STATUS_MSG_MAP[status]) {
    return globalLocaleText(ERROR_STATUS_MSG_MAP[status]);
  }
  return globalLocaleText('requestConfig.errorData.msg', {
    code: `${status}${code ? `-${code}` : ''}`,
  });
};
