import { toCsv } from "./csv.js";

const BOM = String.fromCharCode(0xfeff);

describe("toCsv", () => {
  it("writes a header, rows and a byte order mark for Excel", () => {
    expect(toCsv(["a", "b"], [["1", "2"]])).toBe(`${BOM}a,b\r\n1,2\r\n`);
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(toCsv(["x"], [['He said "hi", twice\nok']])).toBe(
      `${BOM}x\r\n"He said ""hi"", twice\nok"\r\n`,
    );
  });
});
