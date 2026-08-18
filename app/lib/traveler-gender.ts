export type TravelerGender = "female" | "male";

export type TravelerArtworkName =
  | "new-character1.webp"
  | "new-character2.webp"
  | "new-character3.webp"
  | "head.webp"
  | "new-大合照.webp";

const femaleArtworkNames: Record<TravelerArtworkName, string> = {
  "new-character1.webp": "new-g-character1.webp",
  "new-character2.webp": "new-g-character2.webp",
  "new-character3.webp": "new-g-character3.webp",
  "head.webp": "g-head.webp",
  "new-大合照.webp": "new-g-大合照.webp",
};

export const getTravelerGenderFromSearch = (
  search: string,
): TravelerGender =>
  new URLSearchParams(search).get("gender") === "female" ? "female" : "male";

export const getTravelerArtworkName = (
  artworkName: TravelerArtworkName,
  travelerGender: TravelerGender,
) =>
  travelerGender === "female"
    ? femaleArtworkNames[artworkName]
    : artworkName;
