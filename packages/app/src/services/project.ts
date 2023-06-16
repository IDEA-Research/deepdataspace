import { request } from '@umijs/max';
import { API, DATA } from './type';
import { EQaAction, ETaskImageStatus } from '@/pages/Project/constants';

/** project list */
export async function fetchProjectList(
  params: {
    pageNum: number;
    pageSize: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchProjectListRsp>(`/api/v1/label_projects`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** project detail */
export async function fetchProjectDetail(
  projectId: string,
  options?: { [key: string]: any },
) {
  return request<DATA.Project>(`/api/v1/label_projects/${projectId}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** new_project (for inner worker) */
export async function newProject(
  params: {
    name?: string;
    description?: string;
    categories?: string;
    preLabel: string;
    datasetIds?: string[];
    managerIds?: string[];
  },
  options?: { [key: string]: any },
) {
  return request<DATA.Project>(`/api/v1/label_projects`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** init_project (for pm) */
export async function initProject(
  projectId: string,
  params: {
    batchSize?: number;
    labelTimes?: number;
    reviewTimes?: number;
    reviewPercent?: number;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_project_configs/${projectId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** edit project (for owner) */
export async function editProject(
  projectId: string,
  params: {
    description?: string;
    managerIds?: string[];
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_projects/${projectId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** commit project qa (for owner) */
export async function qaProject(
  projectId: string,
  params: {
    action: EQaAction;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_project_qa/${projectId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** export label project (for owner) */
export async function exportLabelProject(
  projectId: string,
  params: {
    labelName: string;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_project_export/${projectId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** dataset lint */
export async function fetchDatasetLint(
  params: {
    name: string;
    purpose?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchDatasetLintRsp>(`/api/v1/dataset_name_lints`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** user lint */
export async function fetchUserLint(
  params: {
    name: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchUserLintRsp>(`/api/v1/user_name_lints`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** project task list */
export async function fetchProjectTasks(
  params: {
    projectId: string;
    pageNum: number;
    pageSize: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.FetchProjectTasksRsp>(`/api/v1/label_tasks`, {
    method: 'GET',
    params,
    ...(options || {}),
  });
}

/** assign teamleader (for pm) */
export async function requestAssignTeamLeader(
  params: {
    projectId: string;
    taskIds: string[];
    labelLeaderId?: string;
    reviewLeaderId?: string;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_leaders`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** assign task workers (for tl) */
export async function requestAssignWorkers(
  taskId: string,
  params: {
    labelerIds?: string[];
    reviewerIds?: string[];
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_workers/${taskId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** reassign task workers (for tl) */
export async function requestReassignWorker(
  taskId: string,
  params: {
    oldWorkerId: string;
    newWorkerId: string;
    role: string;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_reassign/${taskId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** restart task (for tl) */
export async function requestRestartTask(
  taskId: string,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_restart/${taskId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** update task status (for pm) */
export async function qaTask(
  taskId: string,
  params: {
    action: EQaAction;
  },
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_qa/${taskId}`, {
    method: 'POST',
    data: {
      ...params,
    },
    ...(options || {}),
  });
}

/** commit task (for reviewer) */
export async function requestCommitReiviewTask(
  taskId: string,
  options?: { [key: string]: any },
) {
  return request(`/api/v1/label_task_review_commit/${taskId}`, {
    method: 'POST',
    ...(options || {}),
  });
}

/** Get the number of roles that the user can view in the Task. */
export async function requestLabelTaskRoles(
  taskId: string,
  options?: { [key: string]: any },
) {
  return request<API.RequestLabelTaskRolesRsp>(
    `/api/v1/label_task_roles/${taskId}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** Get the categories of the user in the Task. */
export async function requestLabelTaskConfigs(
  taskId: string,
  options?: { [key: string]: any },
) {
  return request<API.RequestLabelTaskConfigsRsp>(
    `/api/v1/label_task_configs/${taskId}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** Get all images of the user in the Task. */
export async function requestLabelTaskImages(
  taskId: string,
  params: {
    status?: ETaskImageStatus;
    roleId?: string;
    pageSize: number;
    pageNum: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RequestLabelTaskImagesRsp>(
    `/api/v1/label_task_images/${taskId}`,
    {
      method: 'GET',
      params,
      ...(options || {}),
    },
  );
}

/** Save the label of the image in the Task. */
export async function saveLabelTaskLabels(
  taskImageId: string,
  params: {
    annotations: DATA.BaseObject[];
  },
  options?: { [key: string]: any },
) {
  return request<DATA.TaskLabel>(
    `/api/v1/label_task_image_labels/${taskImageId}`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {
        hideCodeErrorMsg: true,
      }),
    },
  );
}

/** Save the review result of the image in the Task. */
export async function saveLabelTaskReviews(
  taskImageId: string,
  params: {
    labelId: string;
    action: EQaAction;
  },
  options?: { [key: string]: any },
) {
  return request<DATA.TaskReview>(
    `/api/v1/label_task_image_reviews/${taskImageId}`,
    {
      method: 'POST',
      data: {
        ...params,
      },
      ...(options || {
        hideCodeErrorMsg: true,
      }),
    },
  );
}
