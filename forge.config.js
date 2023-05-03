const { spawn } = require('child_process');
module.exports = {
  packagerConfig: {},
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  hooks: {
    readPackageJson: async (forgeConfig, packageJson) => {
      // only copy deps if there isn't any
      if (Object.keys(packageJson.dependencies).length === 0) {
        const originalPackageJson = await fs.readJson(path.resolve(__dirname, 'package.json'));
        const webpackConfigJs = require('./webpack.renderer.config.js');
        Object.keys(webpackConfigJs.externals).forEach(package => {
          packageJson.dependencies[package] = originalPackageJson.dependencies[package];
        });
      }
      return packageJson;
    },
    packageAfterPrune: async (forgeConfig, buildPath) => {
      // console.log(buildPath);
      return new Promise((resolve, reject) => {
        const npmInstall = spawn('npm', ['install'], {
          cwd: buildPath,
          stdio: 'inherit',
          shell: true
        });

        npmInstall.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error('process finished with error code ' + code));
          }
        });

        npmInstall.on('error', (error) => {
          reject(error);
        });
      });
    }
  },
};
