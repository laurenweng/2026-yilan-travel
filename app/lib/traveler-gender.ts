export type TravelerGender = "female" | "male";

export type TravelerArtworkName =
  | "character1.svg"
  | "character2.svg"
  | "character3.svg"
  | "head.svg"
  | "大合照.png";

const femaleArtworkNames: Record<TravelerArtworkName, string> = {
  "character1.svg": "g-character1.svg",
  "character2.svg": "g-character2.svg",
  "character3.svg": "g-character3.svg",
  "head.svg": "g-head.svg",
  "大合照.png": "g-大合照.png",
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
