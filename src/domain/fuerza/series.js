
export function parseSeries(str) {
  const m = str.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : 1;
}
