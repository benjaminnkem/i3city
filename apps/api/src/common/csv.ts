const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string {
  const lines = [headers, ...rows].map((cells) =>
    cells.map(escapeCell).join(","),
  );
  return `${BYTE_ORDER_MARK}${lines.join("\r\n")}\r\n`;
}
