/**
 * Project status
 */
export enum EProjectStatus {
  Waiting = 'waiting',
  Initializing = 'initializing',
  Working = 'working',
  Reviewing = 'reviewing',
  Rejected = 'rejected',
  Accepted = 'accepted',
}

export const PROJECT_STATUS_MAP = {
  [EProjectStatus.Waiting]: {
    text: 'proj.statusMap.waiting',
    color: 'default',
  },
  [EProjectStatus.Initializing]: {
    text: 'proj.statusMap.initializing',
    color: 'default',
  },
  [EProjectStatus.Working]: {
    text: 'proj.statusMap.working',
    color: 'processing',
  },
  [EProjectStatus.Reviewing]: {
    text: 'proj.statusMap.reviewing',
    color: 'warning',
  },
  [EProjectStatus.Rejected]: {
    text: 'proj.statusMap.rejected',
    color: 'error',
  },
  [EProjectStatus.Accepted]: {
    text: 'proj.statusMap.accepted',
    color: 'success',
  },
};

export enum ETaskStatus {
  Waiting = 'waiting',
  Working = 'working',
  Reviewing = 'reviewing',
  Rejected = 'rejected',
  Accepted = 'accepted',
}

export const TASK_STATUS_MAP = {
  [ETaskStatus.Waiting]: {
    text: 'proj.eTaskStatus.waiting',
    color: 'default',
  },
  [ETaskStatus.Working]: {
    text: 'proj.eTaskStatus.working',
    color: 'processing',
  },
  [ETaskStatus.Reviewing]: {
    text: 'proj.eTaskStatus.reviewing',
    color: 'warning',
  },
  [ETaskStatus.Rejected]: {
    text: 'proj.eTaskStatus.rejected',
    color: 'error',
  },
  [ETaskStatus.Accepted]: {
    text: 'proj.eTaskStatus.accepted',
    color: 'success',
  },
};

export enum EQaAction {
  Accept = 'accept',
  Reject = 'reject',
  ForceAccept = 'force_accept',
}

export enum ETaskImageStatus {
  Labeling = 'labeling',
  Reviewing = 'reviewing',
  Rejected = 'rejected',
  Accepted = 'accepted',
}
