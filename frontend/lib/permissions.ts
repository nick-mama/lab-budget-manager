type AppUser = {
  id: number;
  role: string;
};

type ProjectLike = {
  id: number;
  manager_id?: number;
};

export function canViewProject(user: AppUser | null) {
  if (!user) return false;

  return (
    user.role === "Financial Admin" ||
    user.role === "Lab Manager" ||
    user.role === "Researcher"
  );
}

export function canEditProject(user: AppUser | null, project: ProjectLike) {
  if (!user) return false;

  if (user.role === "Financial Admin") return true;

  if (
    user.role === "Lab Manager" &&
    Number(project.manager_id) === Number(user.id)
  ) {
    return true;
  }

  return false;
}

export function canDeleteProject(user: AppUser | null, project: ProjectLike) {
  return canEditProject(user, project);
}
