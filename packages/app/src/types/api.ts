/* eslint-disable @typescript-eslint/no-namespace */
import { EUserStatus, EnumTaskStatus } from '@/constants';
import { NsDataSet } from './dataset';
import { NsProject } from './project';
import { Category } from '.';

export namespace NsApiDataset {
  export interface FetchDatasetListRsp {
    datasetList: Array<NsDataSet.DataSet>;
    total: number;
  }

  export interface FetchDatasetDetailRsp {
    categoryList: Array<Category>;
    labelList: Array<NsDataSet.Label>;
    objectTypes: Array<string>;
    files: {
      [propName: string]: string;
    };
    name: string;
    description: string;
  }

  export interface FetchImgListRsp {
    imageList: Array<NsDataSet.DataSetImg>;
    total: number;
  }

  export interface FetchNewDatasetRsp {
    id: string;
  }

  export interface GetDatasetUploadPoliciesRsp {
    path: string;
    region: string;
    bucket: string;
    policy: {
      securityToken: string;
      accessKeyId: string;
      accessKeySecret: string;
      expiration: string;
    };
  }

  export interface SignDatasetUploadRsp {
    imageList: {
      path: string;
      url: string;
      originUrl: string;
      filename: string;
    }[];
  }

  export interface UpdateDataset {
    id: number;
    name: string;
    description: string;
  }

  export interface AsyncTaskRsp {
    id: string;
    name: string;
    status: EnumTaskStatus;
  }
}

export namespace NsApiProject {
  export interface FetchProjectListRsp {
    projectList: Array<NsProject.Project>;
    total: number;
  }

  export interface FetchDatasetLintRsp {
    datasetList: {
      id: string;
      name: string;
      valid: boolean;
    }[];
  }

  export interface FetchUserLintRsp {
    userList: {
      id: string;
      name: string;
    }[];
  }

  export interface FetchProjectTasksRsp {
    taskList: Array<NsProject.ProjectTask>;
    total: number;
  }

  export interface RequestLabelTaskRolesRsp {
    roleList: Array<NsProject.ProjectWorker>;
  }

  export interface RequestLabelTaskConfigsRsp {
    categoryList: Array<Category>;
  }

  export interface RequestLabelTaskImagesRsp {
    imageList: Array<NsProject.TaskImage>;
    total: number;
    pageSize: number;
    pageNum: number;
  }
}

export namespace NsApiUser {
  export interface FetchUserInfoRsp {
    name: string;
    id: string;
    status: EUserStatus;
    isStaff: boolean;
  }

  export interface ReqLoginRsp {
    username: string;
    userId: string;
    token: string;
    isStaff: boolean;
  }
}
