const { CopilotQuartoTool } = require('../core');
const fs = require('fs-extra');

/**
 * Tool to embed YouTube videos via iframe
 */
class QuartoEmbedYoutubeIframe extends CopilotQuartoTool {
  constructor() {
    super('quarto_embed_youtube_iframe', 
      'Paste raw YouTube embed code into the doc.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.youtube_embed_code) {
      errors.push('youtube_embed_code is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { youtube_embed_code } = params;
    
    this.log('Embedding YouTube iframe');
    
    try {
      // Extract video ID if a full URL is provided instead of embed code
      let embedCode = youtube_embed_code;
      
      // Check if it's a YouTube URL and convert to embed code
      const youtubeUrlPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
      const match = youtube_embed_code.match(youtubeUrlPattern);
      
      if (match) {
        const videoId = match[1];
        embedCode = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        this.log(`Converted YouTube URL to embed code for video ID: ${videoId}`);
      }
      
      // Validate that it's an iframe tag
      if (!embedCode.includes('<iframe') || !embedCode.includes('youtube.com')) {
        throw new Error('Provided code does not appear to be a valid YouTube embed iframe');
      }
      
      // Generate the markdown content for Quarto
      const quartoContent = `
## YouTube Video

${embedCode}
`;

      // Generate alternative responsive version
      const responsiveEmbedCode = embedCode
        .replace(/width="\d+"/, 'width="100%"')
        .replace(/height="\d+"/, 'height="315"')
        .replace('<iframe', '<iframe style="max-width: 100%; aspect-ratio: 16/9;"');

      const responsiveQuartoContent = `
## YouTube Video (Responsive)

::: {.video-container}
${responsiveEmbedCode}
:::

<style>
.video-container iframe {
  width: 100%;
  max-width: 560px;
  height: auto;
  aspect-ratio: 16/9;
}
</style>
`;

      this.success('Generated YouTube embed code');
      
      return {
        success: true,
        original_code: youtube_embed_code,
        embed_code: embedCode,
        quarto_content: quartoContent,
        responsive_version: responsiveQuartoContent,
        video_id: match ? match[1] : null
      };
    } catch (error) {
      this.error(`Failed to embed YouTube video: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to embed Spotify content via iframe
 */
class QuartoEmbedSpotifyIframe extends CopilotQuartoTool {
  constructor() {
    super('quarto_embed_spotify_iframe', 
      'Paste raw Spotify embed code into the doc.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.spotify_embed_code) {
      errors.push('spotify_embed_code is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { spotify_embed_code } = params;
    
    this.log('Embedding Spotify iframe');
    
    try {
      let embedCode = spotify_embed_code;
      
      // Check if it's a Spotify URL and convert to embed code
      const spotifyUrlPattern = /https:\/\/open\.spotify\.com\/(track|album|playlist|artist)\/([a-zA-Z0-9]+)/;
      const match = spotify_embed_code.match(spotifyUrlPattern);
      
      if (match) {
        const [, type, id] = match;
        embedCode = `<iframe src="https://open.spotify.com/embed/${type}/${id}" width="300" height="380" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`;
        this.log(`Converted Spotify URL to embed code for ${type}: ${id}`);
      }
      
      // Validate that it's a Spotify iframe
      if (!embedCode.includes('<iframe') || !embedCode.includes('spotify.com')) {
        throw new Error('Provided code does not appear to be a valid Spotify embed iframe');
      }
      
      // Generate different embed styles
      const compactEmbed = embedCode
        .replace(/height="\d+"/, 'height="152"')
        .replace(/width="\d+"/, 'width="100%"');
      
      const fullEmbed = embedCode
        .replace(/height="\d+"/, 'height="380"')
        .replace(/width="\d+"/, 'width="100%"');
      
      // Generate the markdown content for Quarto
      const quartoContent = `
## Spotify Embed

### Compact Player
${compactEmbed}

### Full Player  
${fullEmbed}
`;

      // Generate responsive version with styling
      const responsiveQuartoContent = `
## Spotify Content

::: {.spotify-container}
${embedCode}
:::

<style>
.spotify-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.spotify-container iframe {
  max-width: 100%;
  border-radius: 12px;
}
</style>
`;

      this.success('Generated Spotify embed code');
      
      return {
        success: true,
        original_code: spotify_embed_code,
        embed_code: embedCode,
        compact_embed: compactEmbed,
        full_embed: fullEmbed,
        quarto_content: quartoContent,
        responsive_version: responsiveQuartoContent,
        content_type: match ? match[1] : 'unknown',
        content_id: match ? match[2] : null
      };
    } catch (error) {
      this.error(`Failed to embed Spotify content: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to embed Shiny apps via iframe
 */
class QuartoEmbedShinyAppIframe extends CopilotQuartoTool {
  constructor() {
    super('quarto_embed_shiny_app_iframe', 
      'Embed an externally-hosted Shiny app via iframe.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.shiny_app_url) {
      errors.push('shiny_app_url is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { 
      shiny_app_url, 
      iframe_height = '600px', 
      iframe_width = '100%' 
    } = params;
    
    this.log(`Embedding Shiny app: ${shiny_app_url}`);
    
    try {
      // Validate URL format
      try {
        new URL(shiny_app_url);
      } catch (urlError) {
        throw new Error(`Invalid URL format: ${shiny_app_url}`);
      }
      
      // Generate the iframe embed code
      const embedCode = `<iframe src="${shiny_app_url}" width="${iframe_width}" height="${iframe_height}" frameborder="0" allowfullscreen></iframe>`;
      
      // Generate responsive version
      const responsiveEmbedCode = `<iframe src="${shiny_app_url}" width="100%" height="${iframe_height}" frameborder="0" allowfullscreen style="min-height: 400px; border: 1px solid #ddd; border-radius: 4px;"></iframe>`;
      
      // Generate the markdown content for Quarto
      const quartoContent = `
## Shiny Application

${embedCode}
`;

      // Generate enhanced version with loading message and error handling
      const enhancedQuartoContent = `
## Interactive Shiny Application

::: {.shiny-container}
<div id="shiny-loading" style="text-align: center; padding: 2rem;">
  <p>Loading Shiny application...</p>
  <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
</div>

${responsiveEmbedCode}
:::

<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.shiny-container iframe {
  width: 100%;
  max-width: 100%;
  display: block;
}

/* Hide loading message once iframe loads */
.shiny-container iframe:not([src=""]) ~ #shiny-loading {
  display: none;
}
</style>

<script>
// Hide loading message when iframe loads
document.addEventListener('DOMContentLoaded', function() {
  const iframe = document.querySelector('.shiny-container iframe');
  const loading = document.querySelector('#shiny-loading');
  
  if (iframe && loading) {
    iframe.onload = function() {
      loading.style.display = 'none';
    };
  }
});
</script>
`;

      // Generate troubleshooting information
      const troubleshooting = `
## Troubleshooting Shiny App Embed

If the Shiny app doesn't load:

1. **Check URL**: Ensure ${shiny_app_url} is accessible
2. **CORS Issues**: The hosting platform must allow iframe embedding
3. **HTTPS**: Make sure the app uses HTTPS for secure embedding
4. **Headers**: Check if X-Frame-Options headers block embedding

### Common Shiny hosting platforms:
- shinyapps.io: Usually allows embedding
- Posit Connect: Check admin settings
- Self-hosted: Configure server to allow iframe embedding
`;

      this.success(`Generated Shiny app embed for ${shiny_app_url}`);
      
      return {
        success: true,
        shiny_app_url,
        iframe_width,
        iframe_height,
        embed_code: embedCode,
        responsive_embed: responsiveEmbedCode,
        quarto_content: quartoContent,
        enhanced_version: enhancedQuartoContent,
        troubleshooting
      };
    } catch (error) {
      this.error(`Failed to embed Shiny app: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  QuartoEmbedYoutubeIframe,
  QuartoEmbedSpotifyIframe,
  QuartoEmbedShinyAppIframe
};