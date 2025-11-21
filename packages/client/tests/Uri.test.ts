import { PublicKey, Uri } from "@";

describe("Uri class", () => {
  test("should be created from PublicKey", () => {
    const publicKey = PublicKey.tryFromHex(
      "04c71f6c7b87edf4bec14f16f715ee49c6fea918549abdf06c734d384b60ba922990317cc4bf68da8c85b455a65595cf7007f1e54bfd6be26ffee53d1ea6d7406b",
    );
    expect(Uri.fromPublicKey(publicKey).value).toBe(
      "rho:id:qrh6mgfp5z6orgchgszyxnuonanz7hw3amgrprqtciia6astt66ypn",
    );
  });

  test("should parse from string", () => {
    const uri = Uri.tryFrom(
      "rho:id:qrh6mgfp5z6orgchgszyxnuonanz7hw3amgrprqtciia6astt66ypn",
    );
    expect(uri.value).toBe(
      "rho:id:qrh6mgfp5z6orgchgszyxnuonanz7hw3amgrprqtciia6astt66ypn",
    );
  });
});
