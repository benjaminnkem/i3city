const NIGERIAN_MOBILE = /^234[789][01]\d{8}$/;

export function normaliseNigerianPhone(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  let international: string;
  if (digits.startsWith("+234")) {
    international = digits.slice(1);
  } else if (digits.startsWith("234")) {
    international = digits;
  } else if (digits.startsWith("0")) {
    international = `234${digits.slice(1)}`;
  } else {
    return null;
  }
  return NIGERIAN_MOBILE.test(international) ? international : null;
}

export function formatNigerianPhone(international: string): string {
  const local = international.startsWith("234")
    ? `0${international.slice(3)}`
    : international;
  return local.length === 11
    ? `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
    : local;
}
