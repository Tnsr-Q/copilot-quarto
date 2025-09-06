const { CopilotQuartoTool } = require('../core');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

/**
 * Tool to generate theme recommendations using OpenAI
 */
class OpenaiGenerateThemeRecommendations extends CopilotQuartoTool {
  constructor() {
    super('openai_generate_theme_recommendations', 
      'Ask GPT-4 for a JSON palette (font, primary, secondary, accent) based on a theme phrase.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.api_key) {
      errors.push('api_key is required');
    }
    
    if (!params.user_theme_input) {
      errors.push('user_theme_input is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { api_key, user_theme_input, output_format = 'JSON' } = params;
    
    this.log(`Generating theme recommendations for: ${user_theme_input}`);
    
    try {
      const prompt = `Create a cohesive color palette and font recommendation for a "${user_theme_input}" theme. 
Return ONLY a JSON object with these exact keys:
{
  "font_family": "recommended Google Font name",
  "primary_color": "#hex color for primary elements",
  "secondary_color": "#hex color for secondary elements", 
  "accent_color": "#hex color for highlights and accents"
}

The colors should work well together and match the theme aesthetic. Choose colors that have good contrast and accessibility.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      });

      const themeText = response.data.choices[0].message.content.trim();
      
      // Parse the JSON response
      let themeData;
      try {
        themeData = JSON.parse(themeText);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = themeText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          themeData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse theme recommendations as JSON');
        }
      }
      
      // Validate the response has required fields
      const requiredFields = ['font_family', 'primary_color', 'secondary_color', 'accent_color'];
      for (const field of requiredFields) {
        if (!themeData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }
      
      this.success('Theme recommendations generated successfully');
      
      return {
        success: true,
        theme_data: themeData,
        user_theme_input,
        message: 'Theme recommendations generated'
      };
      
    } catch (error) {
      this.error(`Failed to generate theme recommendations: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to generate images using OpenAI DALL-E
 */
class OpenaiGenerateImage extends CopilotQuartoTool {
  constructor() {
    super('openai_generate_image', 
      'Call DALL-E /images/generations and save the returned image locally.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.api_key) {
      errors.push('api_key is required');
    }
    
    if (!params.prompt) {
      errors.push('prompt is required');
    }
    
    if (!params.output_file_path) {
      errors.push('output_file_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { api_key, prompt, output_file_path } = params;
    
    this.log(`Generating image: ${prompt}`);
    
    try {
      // Generate image with DALL-E
      const response = await axios.post('https://api.openai.com/v1/images/generations', {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url'
      }, {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      });

      const imageUrl = response.data.data[0].url;
      
      // Download the image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer'
      });
      
      // Ensure output directory exists
      fs.ensureDirSync(path.dirname(output_file_path));
      
      // Save the image
      fs.writeFileSync(output_file_path, imageResponse.data);
      
      this.success(`Image saved to: ${output_file_path}`);
      
      return {
        success: true,
        prompt,
        output_file_path,
        image_url: imageUrl,
        message: 'Image generated and saved successfully'
      };
      
    } catch (error) {
      this.error(`Failed to generate image: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to generate custom SCSS based on theme data
 */
class QuartoGenerateCustomScss extends CopilotQuartoTool {
  constructor() {
    super('quarto_generate_custom_scss', 
      'Write a custom.scss file that imports Google fonts and sets CSS variables for the theme.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.target_folder) {
      errors.push('target_folder is required');
    }
    
    if (!params.font_family) {
      errors.push('font_family is required');
    }
    
    if (!params.primary_color) {
      errors.push('primary_color is required');
    }
    
    if (!params.secondary_color) {
      errors.push('secondary_color is required');
    }
    
    if (!params.accent_color) {
      errors.push('accent_color is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { target_folder, font_family, primary_color, secondary_color, accent_color } = params;
    
    this.log(`Generating custom SCSS for ${target_folder}`);
    
    // Create Google Fonts import URL
    const fontUrl = `https://fonts.googleapis.com/css2?family=${font_family.replace(/\s+/g, '+')}:wght@300;400;500;600;700&display=swap`;
    
    const scssContent = `/*-- scss:defaults --*/

// Import Google Fonts
@import url('${fontUrl}');

// Custom theme variables
$font-family-sans-serif: "${font_family}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !default;

// Color palette
$primary: ${primary_color} !default;
$secondary: ${secondary_color} !default;
$accent: ${accent_color} !default;

// Bootstrap variable overrides
$theme-colors: (
  "primary": $primary,
  "secondary": $secondary,
  "accent": $accent
) !default;

// Body and text
$body-bg: #ffffff !default;
$body-color: #333333 !default;

// Links
$link-color: $primary !default;
$link-hover-color: darken($primary, 15%) !default;

// Navigation
$navbar-brand-color: $primary !default;
$navbar-brand-hover-color: $accent !default;

/*-- scss:rules --*/

// Custom styles
.navbar-brand {
  font-weight: 600;
  color: $primary !important;
}

.navbar-nav .nav-link {
  font-weight: 500;
}

.btn-primary {
  background-color: $primary;
  border-color: $primary;
  
  &:hover {
    background-color: darken($primary, 10%);
    border-color: darken($primary, 10%);
  }
}

.btn-secondary {
  background-color: $secondary;
  border-color: $secondary;
  
  &:hover {
    background-color: darken($secondary, 10%);
    border-color: darken($secondary, 10%);
  }
}

// Accent elements
.text-accent {
  color: $accent !important;
}

.bg-accent {
  background-color: $accent !important;
}

// Dashboard specific styles
.dashboard-title {
  color: $primary;
  font-weight: 600;
}

.card {
  border: 1px solid rgba($primary, 0.2);
  
  .card-header {
    background-color: rgba($primary, 0.1);
    border-bottom-color: rgba($primary, 0.2);
  }
}

// Code highlighting
.sourceCode {
  background-color: rgba($secondary, 0.05);
  border: 1px solid rgba($secondary, 0.1);
}

// Tables
.table {
  --bs-table-accent-bg: rgba($primary, 0.05);
}

.table-striped > tbody > tr:nth-of-type(odd) > td {
  background-color: rgba($primary, 0.03);
}`;

    const scssPath = path.join(target_folder, 'custom.scss');
    
    // Ensure directory exists
    fs.ensureDirSync(target_folder);
    
    // Write SCSS file
    fs.writeFileSync(scssPath, scssContent);
    
    this.success(`Custom SCSS generated: ${scssPath}`);
    
    return {
      success: true,
      scss_path: scssPath,
      theme: {
        font_family,
        primary_color,
        secondary_color,
        accent_color
      },
      message: 'Custom SCSS theme file generated'
    };
  }
}

module.exports = {
  OpenaiGenerateThemeRecommendations,
  OpenaiGenerateImage,
  QuartoGenerateCustomScss
};