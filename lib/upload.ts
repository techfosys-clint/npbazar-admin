import { API_BASE } from '@/lib/api';

/** Upload files to the server and return the hosted URLs. */
export async function uploadImages(files: FileList | File[]): Promise<string[]> {
  const token = localStorage.getItem('adminToken');
  const fd = new FormData();
  Array.from(files).forEach((f) => fd.append('images', f));

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) throw new Error(data.message || 'Upload failed');
  return data.urls as string[];
}
