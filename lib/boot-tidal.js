'use babel'

const path = require('path');
const fs = require('fs');

const bootTidalPathProperty = 'jensaarai.bootTidalPath'
const defaultBootFileName = 'BootTidal.hs';
const defaultBootFilePath = __dirname + path.sep + defaultBootFileName;

export default class BootTidal {

  constructor(ghc, rootDirectories) {
    this.ghc = ghc
    this.rootDirectories = rootDirectories
  }

  choosePath() {
    const configuredBootFilePath = atom.config.get(bootTidalPathProperty);
    if (configuredBootFilePath) return configuredBootFilePath

    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + path.sep + defaultBootFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) return currentDirectoryPath;

    let tidalBootPath = path.join(this.ghc.tidalDataDir(), defaultBootFileName)
    if (fs.existsSync(tidalBootPath)) {
      return tidalBootPath
    } else {
      return defaultBootFilePath
    }

  }

}
