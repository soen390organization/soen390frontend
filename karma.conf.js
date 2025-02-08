// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
      require("karma-sabarivka-reporter"),
      require("karma-jasmine"),
      require("karma-chrome-launcher"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
      require("karma-sabarivka-reporter"),
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage"), // Coverage directory
      subdir: ".",
      reporters: [
        { type: "text-summary" }, // ✅ Show a summary in the terminal
        { type: "lcov", subdir: "lcov-report" }, // ✅ Generate LCOV report for CI/CD
      ],
      includeAllSources: true, // Ensure all source files are included in coverage
    },
    
 
    reporters: [ "coverage", "progress", "kjhtml"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: process.env.CI ? ["ChromeHeadless"] : ["Chrome"],
    browsers: process.env.CI ? ["ChromeHeadless"] : ["Chrome"],
    singleRun: false,
    restartOnFileChange: true,
    restartOnFileChange: true,
  });
};
