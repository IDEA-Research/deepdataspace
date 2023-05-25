import { useModel } from '@umijs/max';
import { DATA } from '@/services/type';

export enum EProjectRole {
  Owner = 'owner',
  Manager = 'manager',
  LabelLeader = 'label_leader',
  ReviewLeader = 'review_leader',
  Labeler = 'labeler',
  Reviewer = 'reviewer',
}

export enum EProjectAction {
  /** project */
  ProjectEdit = 0,
  ProjectInfo,
  ProjectInit,
  ProjectQa,
  /** task */
  AssignLeader = 100,
  TaskQa,
  AssignLabeler,
  AssignReviewer,
  RestartTask,
  StartLabel,
  StartReview,
  CommitReviewTask,
  View,
}

const RolePermissions: Record<EProjectRole, EProjectAction[]> = {
  [EProjectRole.Owner]: [
    EProjectAction.ProjectEdit,
    EProjectAction.ProjectQa,
    EProjectAction.View,
  ],
  [EProjectRole.Manager]: [
    EProjectAction.ProjectInit,
    EProjectAction.ProjectInfo,
    EProjectAction.AssignLeader,
    EProjectAction.TaskQa,
    EProjectAction.View,
  ],
  [EProjectRole.LabelLeader]: [
    EProjectAction.AssignLabeler,
    EProjectAction.RestartTask,
    EProjectAction.View,
  ],
  [EProjectRole.ReviewLeader]: [
    EProjectAction.AssignReviewer,
    EProjectAction.View,
  ],
  [EProjectRole.Labeler]: [EProjectAction.StartLabel],
  [EProjectRole.Reviewer]: [
    EProjectAction.StartReview,
    EProjectAction.CommitReviewTask,
  ],
};

export default () => {
  const { user } = useModel('user');

  /**
   * Get the corresponding project role of the current user.
   * @param project
   * @param task
   * @returns
   */
  const getUserRoles = (project?: DATA.Project, task?: DATA.ProjectTask) => {
    if (!user.userId || !project) return [];

    const roles = [];
    if (user.userId === project.owner.id) {
      roles.push(EProjectRole.Owner);
    }
    if (project.managers.find((item) => item.id === user.userId)) {
      roles.push(EProjectRole.Manager);
    }
    if (task) {
      if (task.labelLeader?.userId === user.userId) {
        roles.push(EProjectRole.LabelLeader);
      }
      if (task.reviewLeader?.userId === user.userId) {
        roles.push(EProjectRole.ReviewLeader);
      }
      if (task.labelers.find((item) => item.userId === user.userId)) {
        roles.push(EProjectRole.Labeler);
      }
      if (task.reviewers.find((item) => item.userId === user.userId)) {
        roles.push(EProjectRole.Reviewer);
      }
    }
    return roles;
  };

  const checkPermission = (
    roles: EProjectRole[] = [],
    requiredPermissions: EProjectAction,
  ) => {
    const permissions: EProjectAction[] = [];
    roles.forEach((role: EProjectRole) => {
      const roleP = RolePermissions[role];
      roleP.forEach((perm) => {
        if (!permissions.includes(perm)) {
          permissions.push(perm);
        }
      });
    });
    return permissions.includes(requiredPermissions);
  };

  return {
    getUserRoles,
    checkPermission,
  };
};
