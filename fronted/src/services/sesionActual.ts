let usuarioActualId: number | null = null;

export function setUsuarioActualId(id: number | null): void {
  usuarioActualId = id;
}

export function getUsuarioActualId(): number | null {
  return usuarioActualId;
}