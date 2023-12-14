function createSlug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // Trim leading/trailing white spaces
  str = str.toLowerCase(); // Convert to lowercase
  str = str
    .replace(/[^a-z0-9 -]/g, "") // Remove non-alphanumeric characters except dash and space
    .replace(/\s+/g, "-") // Replace spaces with dash
    .replace(/-+/g, "-"); // Replace multiple dashes with single dash
  return str;
}

const sleep = (ms = 20000) => new Promise((resolve) => setTimeout(resolve, ms));

function isValidImageURL(url) {
  const imageExtensionsRegex = /\.(jpg|jpeg|svg|png|gif|tiff)/i;
  return imageExtensionsRegex.test(url);
}

module.exports = { createSlug, sleep, isValidImageURL };
