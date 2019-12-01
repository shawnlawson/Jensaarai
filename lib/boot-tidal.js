'use babel'

const path = require('path');
const fs = require('fs');
const Ghc = require('./ghc')

const defaultBootFileName = 'BootTidal.hs';
const defaultBootFilePath = __dirname + path.sep + defaultBootFileName;

export default class BootTidal {

  static getPath() {
    let rootDirectories = atom.project.rootDirectories
    return new BootTidal(rootDirectories).choosePath()
  }

  constructor(rootDirectories) {
    this.rootDirectories = rootDirectories
  }

  choosePath() {
    const configuredBootFilePath = atom.config.get('jensaarai.bootTidalPath');
    if (configuredBootFilePath) return configuredBootFilePath

    const currentDirectoryPath = this.rootDirectories.length > 0 ?
        this.rootDirectories[0].path + path.sep + defaultBootFileName :
        null;

    if (fs.existsSync(currentDirectoryPath)) return currentDirectoryPath;

    let tidalBootPath = path.join(Ghc.tidalDataDir(), defaultBootFileName)
    if (fs.existsSync(tidalBootPath)) {
      return tidalBootPath
    } else {
      return defaultBootFilePath
    }

  }

}
