const { execFile } = require('child_process');
const fs = require('fs/promises');

class LinuxProvider {
  runCommand(args) {
    return new Promise((resolve) => {
      execFile('playerctl', args, (error, stdout) => {
        if (error) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  async getMediaInfo() {
    try {
      const metadataStr = await this.runCommand(['metadata', '--format', '{{title}}|||{{artist}}|||{{album}}|||{{mpris:artUrl}}|||{{duration(position)}}|||{{duration(mpris:length)}}']);
      if (!metadataStr) return null;

      const parts = metadataStr.split('|||');
      if (parts.length < 6) return null;

      const title = parts[0];
      const artist = parts[1];
      const album = parts[2];
      let artUrl = parts[3];
      const positionStr = parts[4];
      const durationStr = parts[5];

      const statusStr = await this.runCommand(['status']);
      const isPlaying = statusStr === 'Playing';

      let thumbnailDataUrl = null;
      if (artUrl) {
        if (artUrl.startsWith('file://')) {
          const filePath = artUrl.replace('file://', '');
          try {
            const data = await fs.readFile(filePath);
            const ext = filePath.split('.').pop().toLowerCase();
            const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
            thumbnailDataUrl = \`data:\${mime};base64,\${data.toString('base64')}\`;
          } catch (e) {}
        } else if (artUrl.startsWith('http')) {
          thumbnailDataUrl = artUrl; // Return URL directly
        }
      }

      const parseTime = (str) => {
        if (!str) return 0;
        const match = str.match(/([0-9:]+)/);
        if (match) {
          const timeParts = match[1].split(':').reverse();
          let seconds = 0;
          for (let i = 0; i < timeParts.length; i++) {
            seconds += parseInt(timeParts[i], 10) * Math.pow(60, i);
          }
          return seconds;
        }
        return 0;
      };

      return {
        title,
        artist,
        album,
        thumbnailDataUrl,
        position: parseTime(positionStr),
        duration: parseTime(durationStr),
        isPlaying
      };
    } catch (e) {
      return null;
    }
  }

  async control(action, arg) {
    if (action === 'toggle') await this.runCommand(['play-pause']);
    else if (action === 'next') await this.runCommand(['next']);
    else if (action === 'prev') await this.runCommand(['previous']);
    else if (action === 'seek' && typeof arg === 'number') {
      await this.runCommand(['position', Math.round(arg).toString()]);
    }
    return true;
  }
}

module.exports = LinuxProvider;
