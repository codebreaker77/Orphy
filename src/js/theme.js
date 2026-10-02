const ThemeEngine = {
  extractDominantColor(imgElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 16; // sample at small size for performance
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(imgElement, 0, 0, size, size);
      
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;
      
      // Find the most vibrant color by scoring saturation * brightness
      let bestColor = { r: 255, g: 107, b: 107 }; // fallback
      let bestScore = 0;
      
      // Group similar colors using a simple bucketing approach
      const buckets = {};
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];
        if (a < 128) continue; // skip transparent
        
        // Skip very dark or very bright pixels (background/highlights)
        const brightness = (r + g + b) / 3;
        if (brightness < 30 || brightness > 240) continue;
        
        const { h, s, l } = ThemeEngine.rgbToHsl(r, g, b);
        
        // Score: prefer saturated, medium-brightness colors
        const score = s * (1 - Math.abs(l - 0.5) * 2) * 1.5 + s * 0.5;
        
        // Bucket by hue (group similar colors)
        const bucket = Math.floor(h * 12);
        if (!buckets[bucket] || buckets[bucket].score < score) {
          buckets[bucket] = { r, g, b, score, count: (buckets[bucket]?.count || 0) + 1 };
        } else {
          buckets[bucket].count++;
        }
      }
      
      // Find the bucket with best combined score and count
      for (const key in buckets) {
        const b = buckets[key];
        const combinedScore = b.score * Math.sqrt(b.count);
        if (combinedScore > bestScore) {
          bestScore = combinedScore;
          bestColor = { r: b.r, g: b.g, b: b.b };
        }
      }
      
      // Ensure the color is vibrant enough
      return ThemeEngine.ensureVibrancy(bestColor.r, bestColor.g, bestColor.b);
    } catch (e) {
      return { r: 255, g: 107, b: 107 }; // fallback coral
    }
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h, s, l };
  },

  hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  },

  ensureVibrancy(r, g, b) {
    let { h, s, l } = ThemeEngine.rgbToHsl(r, g, b);
    // Boost saturation if too low
    if (s < 0.4) s = 0.4 + s * 0.5;
    // Clamp lightness to a visible range  
    if (l < 0.35) l = 0.35;
    if (l > 0.65) l = 0.65;
    return ThemeEngine.hslToRgb(h, Math.min(s, 0.85), l);
  }
};

window.ThemeEngine = ThemeEngine;
