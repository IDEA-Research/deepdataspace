const projects = [
  {
    id: 'project_1',
    name: 'project_owner',
    description: 'test only owner role',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
      {
        id: '2',
        name: 'openimage',
      },
    ],
    owner: {
      id: '8eee9e3d76e7219f81dad0aa08af55a8',
      name: 'yuanhao',
    },
    managers: [
      {
        id: '2',
        name: 'fengce',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 0,
    status: 'waiting',
    createdTs: Date.now(),
  },
  {
    id: 'project_2',
    name: 'project_owner_pm',
    description: 'test owner & pm role',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '8eee9e3d76e7219f81dad0aa08af55a8',
      name: 'yuanhao',
    },
    managers: [
      {
        id: '8eee9e3d76e7219f81dad0aa08af55a8',
        name: 'yuanhao',
      },
      {
        id: '2',
        name: 'fengce',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 0,
    status: 'initializing',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 0.7,
  },
  {
    id: 'project_3',
    name: 'project_pm',
    description: 'test only pm role',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
      {
        id: '2',
        name: 'openimage',
      },
    ],
    owner: {
      id: '1',
      name: 'weiqiang',
    },
    managers: [
      {
        id: '8eee9e3d76e7219f81dad0aa08af55a8',
        name: 'yuanhao',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 0,
    status: 'waiting',
    createdTs: Date.now(),
  },
  {
    id: 'project_6',
    name: 'project_pm_reviewing',
    description: 'test pm_reviewing',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '8eee9e3d76e7219f81dad0aa08af55a8',
      name: 'yuanhao',
    },
    managers: [
      {
        id: '8eee9e3d76e7219f81dad0aa08af55a8',
        name: 'yuanhao',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 100,
    status: 'reviewing',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 70,
  },
  {
    id: 'project_7',
    name: 'project_pm_accepted',
    description: 'test pm_accepted',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '8eee9e3d76e7219f81dad0aa08af55a8',
      name: 'yuanhao',
    },
    managers: [
      {
        id: '8eee9e3d76e7219f81dad0aa08af55a8',
        name: 'yuanhao',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 100,
    status: 'accepted',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 70,
  },
  {
    id: 'project_8',
    name: 'project_pm_rejected',
    description: 'test pm_rejected',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '1',
      name: 'weiqiang',
    },
    managers: [
      {
        id: '8eee9e3d76e7219f81dad0aa08af55a8',
        name: 'yuanhao',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 100,
    status: 'rejected',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 70,
  },
  {
    id: 'project_4',
    name: 'project_teamleader',
    description: 'test teamleader role',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '1',
      name: 'weiqiang',
    },
    managers: [
      {
        id: '1',
        name: 'weiqiang',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 20,
    status: 'working',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 70,
  },
  {
    id: 'project_5',
    name: 'project_worker',
    description: 'test labeler or reviewer role',
    datasets: [
      {
        id: '1',
        name: 'coco',
      },
    ],
    owner: {
      id: '1',
      name: 'weiqiang',
    },
    managers: [
      {
        id: '1',
        name: 'weiqiang',
      },
    ],
    taskNumTotal: 100,
    taskNumAccepted: 30,
    status: 'working',
    createdTs: Date.now(),
    batchSize: 100,
    labelTimes: 2,
    reviewTimes: 1,
    reviewPercent: 70,
  },
];

export default {
  'GET  /api/v1/fetchProjectList': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        list: projects,
        total: projects.length,
      },
    });
  },
  'GET /api/v1/fetchProjectDetail': (req: any, res: any) => {
    const id = req.query.project_id;
    res.json({
      code: 0,
      msg: 'success',
      data: projects.find((item) => item.id === id),
    });
  },
  'POST /api/v1/newProject': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        projectId: 'project_id_1',
      },
    });
  },
  'POST /api/v1/initProject': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        projectId: 'project_id_1',
      },
    });
  },
  'POST /api/v1/editProject': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        projectId: 'project_id_1',
      },
    });
  },
  'GET  /api/v1/fetchDatasetLint': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        list: [
          {
            id: '1',
            name: 'coco',
          },
          {
            id: '2',
            name: 'openimage',
          },
          {
            id: '3',
            name: 'tsvxxx',
          },
        ],
      },
    });
  },
  'GET  /api/v1/fetchUserLint': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        list: [
          {
            id: '8eee9e3d76e7219f81dad0aa08af55a8',
            name: 'yuanhao',
          },
          {
            id: '2',
            name: 'fengce',
          },
          {
            id: '3',
            name: 'weiqiang',
          },
        ],
      },
    });
  },
  'GET  /api/v1/fetchProjectTasks': (req: any, res: any) => {
    const projectId = req.query.project_id;
    const project = projects.find((item) => item.id === projectId);
    const isOwner = project?.owner?.id === '8eee9e3d76e7219f81dad0aa08af55a8';
    const isPm = !!project?.managers.find(
      (item) => item.id === '8eee9e3d76e7219f81dad0aa08af55a8',
    );
    // console.log('>>>>', req.query.project_id, project, isOwner, isPm);
    let list = [];
    if (isOwner || isPm) {
      list.push(
        ...[
          // not assign leader
          {
            taskId: 'task_empty_1',
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'waiting',
          },
          {
            taskId: 'task_empty_2',
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'waiting',
          },
          {
            taskId: 'task_empty_3',
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'waiting',
          },
        ],
      );
    }
    if (projectId !== 'project_5') {
      // not only worker
      list.push(
        ...[
          // have teamleader no worker
          {
            taskId: 'task_team_leader_1',
            labelLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'working',
          },
          {
            taskId: 'task_team_leader_2',
            labelLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '1',
              username: 'leader1',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'working',
          },
          {
            taskId: 'task_team_leader_3',
            labelLeader: {
              userId: '1',
              username: 'leader2',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [],
            reviewers: [],
            totalCount: 100,
            status: 'working',
          },
          {
            taskId: 'task_all_role11',
            labelLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [
              {
                id: '0fd2d63a5186481ca355534c5869dbcc',
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 100,
                reviewNumWaiting: 0,
                reviewNumRejected: 0,
                reviewNumAccepted: 0,
                role: 'labeler',
              },
              {
                userId: 'label2',
                username: 'label2',
                labelNumWaiting: 100,
                reviewNumWaiting: 0,
                reviewNumRejected: 0,
                reviewNumAccepted: 0,
                role: 'labeler',
              },
            ],
            reviewers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 100,
                reviewNumWaiting: 0,
                reviewNumRejected: 0,
                reviewNumAccepted: 0,
                role: 'reviewer',
              },
            ],
            totalCount: 100,
            status: 'working',
          },
          {
            taskId: 'task_all_role2',
            labelLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 60,
              reviewNumWaiting: 20,
              reviewNumRejected: 5,
              reviewNumAccepted: 15,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '8eee9e3d76e7219f81dad0aa08af55a8',
              username: 'yuanhao',
              labelNumWaiting: 60,
              reviewNumWaiting: 20,
              reviewNumRejected: 5,
              reviewNumAccepted: 15,
              role: 'review_leader',
            },
            labelers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'labeler',
              },
              {
                userId: 'label2',
                username: 'label2',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'labeler',
              },
            ],
            reviewers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'reviewer',
              },
            ],
            totalCount: 100,
            status: 'working',
          },
          {
            taskId: 'task_labeler_reviewer',
            labelLeader: {
              userId: '1',
              username: 'leader1',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            reviewLeader: {
              userId: '2',
              username: 'leader2',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'labeler',
              },
              {
                userId: 'label2',
                username: 'label2',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'labeler',
              },
            ],
            reviewers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'reviewer',
              },
            ],
            totalCount: 100,
            status: 'reviewing',
          },
        ],
      );
    } else {
      // worker
      list.push(
        ...[
          // only labeler
          {
            taskId: 'task_labeler',
            labelLeader: {
              userId: '1',
              username: 'leader1',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'label_leader',
            },
            labelers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 60,
                reviewNumWaiting: 20,
                reviewNumRejected: 5,
                reviewNumAccepted: 15,
                role: 'labeler',
              },
            ],
            reviewers: [],
            totalCount: 100,
            status: 'working',
          },
          // only reviewer
          {
            taskId: 'task_reviewer',
            reviewLeader: {
              userId: '2',
              username: 'leader2',
              labelNumWaiting: 100,
              reviewNumWaiting: 0,
              reviewNumRejected: 0,
              reviewNumAccepted: 0,
              role: 'review_leader',
            },
            labelers: [],
            reviewers: [
              {
                userId: '8eee9e3d76e7219f81dad0aa08af55a8',
                username: 'yuanhao',
                labelNumWaiting: 0,
                reviewNumWaiting: 0,
                reviewNumRejected: 0,
                reviewNumAccepted: 100,
                role: 'reviewer',
              },
            ],
            totalCount: 100,
            status: 'accepted',
          },
        ],
      );
    }

    res.json({
      code: 0,
      msg: 'success',
      data: {
        list,
        total: list.length,
      },
    });
  },
  'POST /api/v1/assignTeamLeader': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
  'POST /api/v1/assignWorkers': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
  'POST /api/v1/reassignWorker': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
  'POST /api/v1/updataTaskStatus': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
  'POST /api/v1/commitReiviewTask': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
};
