export function formatQueryParams(params: Record<string, any>) {
  let str = "";
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      for (const v of value) {
        str += str ? `&${key}=${v}` : `${key}=${v}`;
      }
    } else if (value !== undefined) {
      str += str ? `&${key}=${value}` : `${key}=${value}`;
    }
  });
  return str;
}
