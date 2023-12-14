const {createSlug} = require("./utils");

const usernameRegex =
  /(?:https?:\/\/)?(?:www\.)?(instagram|twitter)\.com\/([a-zA-Z0-9_]+)\/?/;

// Function to extract username from URL
function extractUsernameAndPlatform(url) {
  const matches = url.match(usernameRegex);
  if (matches && matches.length > 2) {
    const medio = matches[1];
    const usuario = matches[2];
    return {
      _type: "contacto",
      _key: `${createSlug(usuario)}-${medio}-key`,
      medio,
      usuario,
    };
  } else {
    return null;
  }
}

module.exports = extractUsernameAndPlatform;
