export default [
  {
    path: '/',
    redirect: '/dataset',
  },
  {
    name: 'Dataset',
    routes: [
      {
        path: '/dataset',
        name: 'Datasets',
        component: './DatasetList',
      },
      {
        path: '/dataset/detail',
        name: 'Dataset',
        component: './Dataset',
      },
    ],
  },
  {
    path: '/annotator',
    name: 'Annotator',
    component: './Annotator',
    hideSider: true,
  },
  {
    name: 'Project',
    component: '@/wrappers/auth',
    hideSider: true,
    routes: [
      {
        path: '/project',
        name: 'Projects',
        component: './Project',
      },
      {
        path: '/project/:projectId',
        name: 'ProjectDetail',
        component: './Project/Detail',
      },
      {
        path: '/project/task/workspace',
        name: 'ProjectTaskWorkspace',
        component: './Project/Workspace',
      },
    ],
  },
  {
    name: 'Lab',
    menuIcon: 'BulbOutlined',
    menuLink: '/lab',
    routes: [
      {
        path: '/lab',
        name: 'Lab',
        component: './Lab',
      },
      {
        path: '/lab/datasets',
        name: 'Datasets',
        component: './Lab/Datasets',
      },
      {
        path: '/lab/flagtool',
        name: 'flagtool',
        component: './Lab/FlagTool',
      },
    ],
  },
  {
    name: 'Login',
    path: '/login',
    component: './Login',
    hideSider: true,
  },
  {
    name: '404',
    path: '/*',
    component: './404',
  },
];
