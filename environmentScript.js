import * as fs from "fs";
import * as path from "path";

console.log("running environment building script");

const dir = "src/environments";
const prodEnv = "environment.ts";

const content = process.env["ENVIRONMENT_VARS"] || "Default content";
const testVar = process.env["TEST_VAR"];
console.log(testVar);

function writeToFile(filePath, content) {
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error("Error writing to file:", err);
    } else {
      console.log("Successfully wrote to file:", filePath);
    }
  });
}

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const filePath = path.join(dir, prodEnv);
writeToFile(filePath, content);
