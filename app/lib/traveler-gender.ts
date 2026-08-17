export type TravelerGender = "female" | "male";

export type TravelerArtworkName =
  | "character1.webp"
  | "character2.webp"
  | "character3.webp"
  | "head.webp"
  | "大合照.webp";

const femaleArtworkNames: Record<TravelerArtworkName, string> = {
  "character1.webp": "g-character1.webp",
  "character2.webp": "g-character2.webp",
  "character3.webp": "g-character3.webp",
  "head.webp": "g-head.webp",
  "大合照.webp": "g-大合照.webp",
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
