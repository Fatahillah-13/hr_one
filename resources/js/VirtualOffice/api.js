import axios from 'axios';

// Ubah kalau HR One berjalan di sub-folder, misalnya '/hr-one/virtual-office'.
export const BASE = '/virtual-office';

export const api = {
  conversations: () => axios.get(`${BASE}/conversations`).then((r) => r.data.conversations),
  openPersonal: (userId) => axios.post(`${BASE}/conversations/personal/${userId}`).then((r) => r.data.conversation),
  createGroup: (name, memberIds) =>
    axios.post(`${BASE}/conversations/group`, { name, member_ids: memberIds }).then((r) => r.data.conversation),
  addMembers: (conversationId, memberIds) =>
    axios.post(`${BASE}/conversations/${conversationId}/members`, { member_ids: memberIds }).then((r) => r.data.conversation),
  deleteGroup: (conversationId) =>
    axios.delete(`${BASE}/conversations/${conversationId}`).then((r) => r.data),
  messages: (conversationId, beforeId) =>
    axios
      .get(`${BASE}/conversations/${conversationId}/messages`, { params: beforeId ? { before_id: beforeId } : {} })
      .then((r) => r.data),
  send: (conversationId, body, file) => {
    const fd = new FormData();
    if (body) fd.append('body', body);
    if (file) fd.append('file', file);
    return axios.post(`${BASE}/conversations/${conversationId}/messages`, fd).then((r) => r.data.message);
  },
  read: (conversationId) => axios.post(`${BASE}/conversations/${conversationId}/read`).then((r) => r.data),
  updateStatus: (payload) => axios.put(`${BASE}/status`, payload).then((r) => r.data.profile),
  updateAvatar: ({ mode, photoBlob, config }) => {
    const fd = new FormData();
    fd.append('mode', mode);
    if (photoBlob) fd.append('photo', photoBlob, 'avatar.jpg');
    if (config) Object.entries(config).forEach(([k, v]) => fd.append(`config[${k}]`, v));
    return axios.post(`${BASE}/avatar`, fd).then((r) => r.data.profile);
  },

  // ---- Editor Denah ----
  saveDraft: (layout) => axios.put(`${BASE}/editor/draft`, layout).then((r) => r.data),
  publish: (layout, note) => axios.post(`${BASE}/editor/publish`, { ...layout, note }).then((r) => r.data),
  version: (id) => axios.get(`${BASE}/editor/versions/${id}`).then((r) => r.data.layout),
};

/** Ambil pesan error validasi Laravel yang paling relevan. */
export function errorText(err) {
  const data = err?.response?.data;
  if (data?.errors) return Object.values(data.errors).flat()[0];
  return data?.message || 'Terjadi kesalahan. Coba lagi.';
}
