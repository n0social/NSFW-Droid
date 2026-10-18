/**
 * Open3DLab network: SmutBase downloads use smutba.se (smutbase.com often redirects away).
 * Project UUIDs work across SmutBase / SFMLab.
 */
export function smutbaseProjectUrl(projectId: string): string {
  const id = projectId.trim();
  return `https://smutba.se/project/${id}/`;
}

export function sfmlabProjectUrl(projectId: string): string {
  const id = projectId.trim();
  return `https://sfmlab.com/project/${id}/`;
}
