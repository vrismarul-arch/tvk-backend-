// src/utils/getRegionKey.js
export const getRegionKey = (name) => {
  if (name.includes("மாதவரம்")) return "madhavaram";
  if (name.includes("புழல்")) return "puzhal";
  if (name.includes("வில்லிவாக்கம்")) return "villivakkam";
  if (name.includes("சோழவரம்")) return "cholavaram";
  return "";
};
