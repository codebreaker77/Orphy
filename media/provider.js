class MediaProvider {
  static create() {
    if (process.platform === 'win32') {
      const WindowsProvider = require('./windows-provider');
      return new WindowsProvider();
    } else {
      const LinuxProvider = require('./linux-provider');
      return new LinuxProvider();
    }
  }
}
module.exports = MediaProvider;
