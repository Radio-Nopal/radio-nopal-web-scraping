const { createClient } = require("@sanity/client");

const sanityClient = createClient({
  projectId: "projectId",
  dataset: "production",
  token:
    "token", // we need this to get write access
  useCdn: false, // We can't use the CDN for writing
  apiVersion: "2021-08-31",
});

module.exports = sanityClient;
