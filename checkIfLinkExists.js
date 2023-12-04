const https = require("https");

const checkIfLinkExists = (url) => {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: "HEAD",
    };

    const request = https.request(url, requestOptions, (response) => {
      console.log(response.statusCode);
      console.log(response);
      if (response.statusCode === 200) {
        resolve(true); // Link exists (status code 200 OK)
      } else {
        resolve(false); // Link does not exist (status code is not 200 OK)
      }
    });

    request.on("error", (error) => {
      reject(error); // An error occurred while making the request
    });

    request.end();
  });
};

module.exports = checkIfLinkExists;
