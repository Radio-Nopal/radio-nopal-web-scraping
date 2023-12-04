const fs = require("fs");

const saveJsonToFile = (data) => {
  // Convert the JSON object to a string with 2-space indentation
  const jsonData = JSON.stringify(data, null, 2);

  try {
    fs.writeFileSync("output.json", jsonData);
    console.log("JSON data has been written to the file successfully.");
  } catch (error) {
    console.error("Error writing JSON data to file:", error);
  }
};

module.exports = saveJsonToFile;
