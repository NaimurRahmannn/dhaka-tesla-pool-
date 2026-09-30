export function formatFare(farePaisa: number | null | undefined): string {
  if (farePaisa === null || farePaisa === undefined) {
    return "Not available";
  }

  return `BDT ${(farePaisa / 100).toFixed(2)}`;
}
