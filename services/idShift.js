export async function shiftsByCourse(courseId) {
    const API = process.env.EXPO_PUBLIC_API_URL;
    const res = await fetch(`${API}/shifts/by-course/${courseId}`);
    const data = await res.json().catch(()=>null);
    if (!res.ok) throw new Error(data?.message || `Error ${res.status}`);
    return data?.data ?? data; // lista de ShiftDTO (cada item tiene .id)
  }
  