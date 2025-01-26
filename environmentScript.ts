import * as fs from 'fs';
import * as path from 'path';

const dir = 'src/environments';
const localEnv = 'environment.ts';
const prodEnv = 'environment.prod.ts';

const content = `${process.env['ENVIRONMENT_VARS']}`;

// Check if the directory exists
fs.access(dir, fs.constants.F_OK, (err) => {
  if (err) {
    // Directory doesn't exist
    console.log("src doesn't exist, creating now", process.cwd());
    // Create /src
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (error) {
      console.log(`Error while creating ${dir}. Error is ${error}`);
      process.exit(1);
    }
  }

  // Write to files
  try {
    fs.writeFileSync(path.join(dir, localEnv), content);
    fs.writeFileSync(path.join(dir, prodEnv), content);
    console.log('Created successfully in', process.cwd());

    if (fs.existsSync(path.join(dir, localEnv))) {
      console.log('File is created', path.resolve(dir, localEnv));
      const str = fs.readFileSync(path.join(dir, localEnv)).toString();
      console.log(str);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
});
