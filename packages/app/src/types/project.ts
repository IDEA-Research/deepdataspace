/* eslint-disable @typescript-eslint/no-namespace */

import {
  EProjectStatus,
  EQaAction,
  ETaskImageStatus,
  ETaskStatus,
} from '@/pages/Project/constants';
import { EProjectRole } from '@/pages/Project/models/auth';
import { BaseImage, BaseObject } from '.';

export namespace NsProject {
  /**
   * Project Manage
   */
  export interface Project {
    id: string;
    name: string;
    description: string;
    categories: string;
    preLabel: string;
    datasets: {
      id: string;
      name: string;
    }[];
    owner: {
      id: string;
      name: string;
    };
    managers: {
      id: string;
      name: string;
    }[];
    taskNumAccepted: number;
    taskNumRejected: number;
    taskNumReviewing: number;
    taskNumTotal: number;
    taskNumWaiting: number;
    taskNumWorking: number;
    status: EProjectStatus;
    batchSize: number;
    labelTimes: number;
    reviewTimes: number;
    /** Unit: ms */
    createdTs: number;
    /** Used in page. */
    userRoles?: EProjectRole[];
  }

  export interface ProjectWorker {
    id: string;
    taskId: string;
    projectId: string;
    userId: string;
    userName: string;
    labelNumWaiting: number;
    reviewNumWaiting: number;
    reviewNumRejected: number;
    reviewNumAccepted: number;
    role: EProjectRole;
  }

  export interface ProjectTask {
    id: string;
    idx: number;
    projectId: string;
    datasetId: string;
    labelLeader?: ProjectWorker;
    reviewLeader?: ProjectWorker;
    labelers: ProjectWorker[];
    reviewers: ProjectWorker[];
    numTotal: number;
    status: ETaskStatus;
    createdTs: number;
  }

  export interface TaskLabel {
    id: string;
    userId: string;
    userName: string;
    status: ETaskImageStatus;
    createdTs: number;
    annotations: BaseObject[];
  }

  export interface TaskReview {
    id: string;
    userId: string;
    userName: string;
    action: EQaAction;
    labelId: string;
    createdTs: number;
  }

  export interface TaskImage extends BaseImage {
    taskId: string;
    /** Pre-annotation data. */
    defaultLabels?: TaskLabel;
    labels: TaskLabel[];
    reviews: TaskReview[];
    /** Used in page. */
    labeled?: boolean;
  }
}
