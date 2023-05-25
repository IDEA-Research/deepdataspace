import { useImmer } from 'use-immer';

export enum RoleType {
  admin = 'Owner',
  projectManager = 'Project Manager',
  teamLeader = 'Team Leader',
  labeler = 'Labeler',
  reviewer = 'Reviewer',
}

export const ROLE_OPTIONS = [
  RoleType.admin,
  RoleType.projectManager,
  RoleType.teamLeader,
  RoleType.labeler,
  RoleType.reviewer,
];

export default () => {
  const [role, setRole] = useImmer<RoleType>(RoleType.admin);

  const onChangedRole = (type: RoleType) => {
    setRole(type);
  };

  return {
    role,
    onChangedRole,
  };
};
