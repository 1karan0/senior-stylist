export const parseApiError = (error: any): string => {
  try {
    const res = error?.response?.data ?? error;

    if (!res) return 'Something went wrong.';

    // Laravel-style { errors: { field: [...messages] } }
    if (res.errors && typeof res.errors === 'object') {
      const msgs: string[] = [];

      Object.values(res.errors).forEach((val) => {
        if (Array.isArray(val)) msgs.push(...val);
        else if (typeof val === 'string') msgs.push(val);
      });

      if (msgs.length > 0) return msgs.join('\n');
    }

    // Standard { message: "..." }
    if (typeof res.message === 'string') return res.message;

    // Raw string
    if (typeof res === 'string') return res;

    // Fallback
    return 'Unexpected error occurred.';
  } catch {
    return 'Something went wrong.';
  }
};
