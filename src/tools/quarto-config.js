const { CopilotQuartoTool } = require('../core');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('yaml');

/**
 * Tool to configure _quarto.yml site settings
 */
class QuartoConfigureSiteYml extends CopilotQuartoTool {
  constructor() {
    super('quarto_configure_site_yml', 
      'Edit _quarto.yml to set project type, nav-bar, theme, output dir, etc.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.quarto_yml_path) {
      errors.push('quarto_yml_path is required');
    }
    
    if (!params.project_type) {
      errors.push('project_type is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { 
      quarto_yml_path, 
      project_type, 
      output_dir = '_site',
      navigation_type,
      pages_list,
      theme_config
    } = params;
    
    this.log(`Configuring Quarto site: ${quarto_yml_path}`);
    
    let config = {};
    
    // Load existing config if it exists
    if (fs.existsSync(quarto_yml_path)) {
      const content = fs.readFileSync(quarto_yml_path, 'utf8');
      config = yaml.parse(content) || {};
    }
    
    // Set project type
    config.project = config.project || {};
    config.project.type = project_type;
    config.project['output-dir'] = output_dir;
    
    // Configure website settings if project type is website
    if (project_type === 'website') {
      config.website = config.website || {};
      
      if (navigation_type) {
        if (navigation_type === 'navbar') {
          config.website.navbar = config.website.navbar || {};
          if (pages_list && pages_list.length > 0) {
            config.website.navbar.left = pages_list.map(page => ({
              href: page,
              text: this.getPageTitle(page)
            }));
          }
        } else if (navigation_type === 'sidebar') {
          config.website.sidebar = config.website.sidebar || {};
          if (pages_list && pages_list.length > 0) {
            config.website.sidebar.contents = pages_list;
          }
        }
      }
    }
    
    // Configure format and theme
    config.format = config.format || {};
    config.format.html = config.format.html || {};
    
    if (theme_config) {
      try {
        // Handle theme_config as string or array
        if (theme_config.startsWith('[') && theme_config.endsWith(']')) {
          // Parse as array
          const themeArray = JSON.parse(theme_config);
          config.format.html.theme = themeArray;
        } else {
          config.format.html.theme = theme_config;
        }
      } catch (error) {
        // Fallback to string
        config.format.html.theme = theme_config;
      }
    }
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(quarto_yml_path));
    
    // Write configuration
    const yamlContent = yaml.stringify(config);
    fs.writeFileSync(quarto_yml_path, yamlContent);
    
    this.success(`Quarto configuration updated: ${quarto_yml_path}`);
    
    return {
      success: true,
      file_path: quarto_yml_path,
      config,
      message: 'Quarto site configuration updated'
    };
  }

  getPageTitle(pagePath) {
    const basename = path.basename(pagePath, '.qmd');
    return basename.charAt(0).toUpperCase() + basename.slice(1);
  }
}

/**
 * Tool to render Quarto project locally
 */
class QuartoRenderLocal extends CopilotQuartoTool {
  constructor() {
    super('quarto_render_local', 
      'Run `quarto render` on a file or whole project for local preview.');
  }

  validateParams(params) {
    return { valid: true, errors: [] };
  }

  async execute(params) {
    const { qmd_file_path } = params;
    
    this.log('Rendering Quarto project/file locally');
    
    try {
      // Check if quarto is available
      execSync('quarto --version', { stdio: 'ignore' });
      
      let renderCommand = 'quarto render';
      if (qmd_file_path) {
        renderCommand += ` "${qmd_file_path}"`;
      }
      
      const output = execSync(renderCommand, { 
        encoding: 'utf8',
        timeout: 300000 // 5 minutes timeout
      });
      
      this.success('Quarto project rendered successfully');
      
      // Try to find the preview URL
      let previewUrl = null;
      try {
        const previewOutput = execSync('quarto preview --no-browser --port 0', { 
          encoding: 'utf8',
          timeout: 10000,
          stdio: 'pipe'
        });
        
        const urlMatch = previewOutput.match(/Browse at (https?:\/\/[^\s]+)/);
        if (urlMatch) {
          previewUrl = urlMatch[1];
        }
      } catch (error) {
        // Preview command failed, but render succeeded
        this.log('Could not start preview server, but render completed');
      }
      
      return {
        success: true,
        file_path: qmd_file_path || 'whole project',
        preview_url: previewUrl,
        output: output,
        message: 'Quarto project rendered locally'
      };
      
    } catch (error) {
      if (error.message.includes('quarto: command not found')) {
        throw new Error('Quarto is not installed or not in PATH. Please install Quarto first.');
      }
      
      this.error(`Failed to render: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to create .gitignore file for Quarto projects
 */
class QuartoCreateGitignore extends CopilotQuartoTool {
  constructor() {
    super('quarto_create_gitignore', 
      'Create or overwrite .gitignore with standard Quarto/R exclusions.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.target_folder) {
      errors.push('target_folder is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { target_folder, gitignore_content } = params;
    
    this.log(`Creating .gitignore in ${target_folder}`);
    
    const gitignorePath = path.join(target_folder, '.gitignore');
    
    const defaultContent = `.Rproj.user
.Rhistory
.RData
.Ruserdata
.Renviron
.quarto/
_site/
*_files/
renv/library/
.DS_Store
node_modules/
*.log
.env
*.tmp
*.temp
Thumbs.db`;

    const content = gitignore_content || defaultContent;
    
    // Ensure directory exists
    fs.ensureDirSync(target_folder);
    
    // Write .gitignore
    fs.writeFileSync(gitignorePath, content);
    
    this.success(`.gitignore created in ${target_folder}`);
    
    return {
      success: true,
      file_path: gitignorePath,
      content,
      message: '.gitignore file created'
    };
  }
}

/**
 * Tool to add OJS chunks to QMD files
 */
class QuartoDefineOjsChunk extends CopilotQuartoTool {
  constructor() {
    super('quarto_define_ojs_chunk', 
      'Insert an ObservableJS code chunk (```ojs) into the current .qmd.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.ojs_code_content) {
      errors.push('ojs_code_content is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { ojs_code_content, chunk_options } = params;
    
    this.log('Adding OJS chunk to current working QMD file');
    
    // Create the OJS chunk
    let chunkHeader = '```{ojs}';
    if (chunk_options) {
      chunkHeader = `\`\`\`{ojs}\n#| ${chunk_options}`;
    }
    
    const ojsChunk = `${chunkHeader}
${ojs_code_content}
\`\`\``;
    
    // For now, we'll return the chunk content - in a real implementation,
    // this would append to the current QMD file being edited
    this.success('OJS chunk created');
    
    return {
      success: true,
      chunk_content: ojsChunk,
      message: 'OJS chunk ready to be added to QMD file'
    };
  }
}

/**
 * Tool to apply SCSS theme to Quarto project
 */
class QuartoApplyScssTheme extends CopilotQuartoTool {
  constructor() {
    super('quarto_apply_scss_theme', 
      'Append a custom SCSS file to the theme list in _quarto.yml.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.quarto_yml_path) {
      errors.push('quarto_yml_path is required');
    }
    
    if (!params.scss_file_path) {
      errors.push('scss_file_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { quarto_yml_path, scss_file_path } = params;
    
    this.log(`Applying SCSS theme: ${scss_file_path}`);
    
    try {
      if (!await fs.pathExists(quarto_yml_path)) {
        throw new Error(`Quarto YAML file not found: ${quarto_yml_path}`);
      }

      // Read the current configuration
      const content = await fs.readFile(quarto_yml_path, 'utf8');
      const config = yaml.parse(content) || {};

      // Ensure format.html exists
      if (!config.format) config.format = {};
      if (!config.format.html) config.format.html = {};

      // Handle theme configuration
      let currentTheme = config.format.html.theme;
      
      if (!currentTheme) {
        // No theme set, create array with just the scss file
        config.format.html.theme = [scss_file_path];
      } else if (typeof currentTheme === 'string') {
        // Single theme, convert to array and append scss
        config.format.html.theme = [currentTheme, scss_file_path];
      } else if (Array.isArray(currentTheme)) {
        // Already an array, append if not already present
        if (!currentTheme.includes(scss_file_path)) {
          currentTheme.push(scss_file_path);
        }
      } else {
        // Object or other format, create new array
        config.format.html.theme = [scss_file_path];
      }

      // Write back the configuration
      const updatedContent = yaml.stringify(config);
      await fs.writeFile(quarto_yml_path, updatedContent);

      this.success(`SCSS theme applied: ${scss_file_path}`);
      
      return {
        success: true,
        quarto_yml_path,
        scss_file_path,
        theme_config: config.format.html.theme
      };
    } catch (error) {
      this.error(`Failed to apply SCSS theme: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to configure chunk output options
 */
class QuartoConfigureChunkOutput extends CopilotQuartoTool {
  constructor() {
    super('quarto_configure_chunk_output', 
      'Set echo/include for a code chunk.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.code_chunk_header) {
      errors.push('code_chunk_header is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { code_chunk_header, echo, include } = params;
    
    this.log('Configuring chunk output options');
    
    try {
      // Parse the existing chunk header
      let chunkHeader = code_chunk_header;
      
      // Remove existing backticks if present
      chunkHeader = chunkHeader.replace(/^```\{/, '').replace(/\}$/, '');
      
      // Extract language and existing options
      const parts = chunkHeader.split(/\s+/);
      const language = parts[0] || 'r';
      const existingOptions = parts.slice(1);
      
      // Build new options
      const newOptions = [];
      
      // Add existing options that we're not overriding
      existingOptions.forEach(option => {
        if (!option.startsWith('echo=') && !option.startsWith('include=')) {
          newOptions.push(option);
        }
      });
      
      // Add new options
      if (echo !== undefined) {
        newOptions.push(`echo=${echo}`);
      }
      
      if (include !== undefined) {
        newOptions.push(`include=${include}`);
      }
      
      // Build the final chunk header
      const finalHeader = newOptions.length > 0 ? 
        `\`\`\`{${language} ${newOptions.join(', ')}}` : 
        `\`\`\`{${language}}`;

      this.success('Configured chunk output options');
      
      return {
        success: true,
        original_header: code_chunk_header,
        modified_header: finalHeader,
        language,
        echo,
        include,
        all_options: newOptions
      };
    } catch (error) {
      this.error(`Failed to configure chunk output: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to name code chunks
 */
class QuartoNameCodeChunk extends CopilotQuartoTool {
  constructor() {
    super('quarto_name_code_chunk', 
      'Give a chunk a readable name for logs and cross-references.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.code_chunk_header) {
      errors.push('code_chunk_header is required');
    }
    
    if (!params.chunk_name) {
      errors.push('chunk_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { code_chunk_header, chunk_name } = params;
    
    this.log(`Naming code chunk: ${chunk_name}`);
    
    try {
      // Parse the existing chunk header
      let chunkHeader = code_chunk_header;
      
      // Remove existing backticks if present
      chunkHeader = chunkHeader.replace(/^```\{/, '').replace(/\}$/, '');
      
      // Extract language and existing options
      const parts = chunkHeader.split(/\s+/);
      const language = parts[0] || 'r';
      const existingOptions = parts.slice(1);
      
      // Clean the chunk name (remove spaces, special chars)
      const cleanName = chunk_name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      
      // Build the final chunk header with name
      const optionsStr = existingOptions.length > 0 ? `, ${existingOptions.join(', ')}` : '';
      const finalHeader = `\`\`\`{${language} ${cleanName}${optionsStr}}`;

      this.success(`Named code chunk: ${cleanName}`);
      
      return {
        success: true,
        original_header: code_chunk_header,
        modified_header: finalHeader,
        chunk_name: cleanName,
        language,
        existing_options: existingOptions
      };
    } catch (error) {
      this.error(`Failed to name code chunk: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to generate RevealJS slides
 */
class QuartoGenerateRevealJsSlides extends CopilotQuartoTool {
  constructor() {
    super('quarto_generate_revealjs_slides', 
      'Create a starter slides.qmd ready for RevealJS with your theme, title slide background image, and highlight style.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.target_folder) {
      errors.push('target_folder is required');
    }
    
    if (!params.title) {
      errors.push('title is required');
    }
    
    if (!params.author) {
      errors.push('author is required');
    }
    
    if (!params.theme_file) {
      errors.push('theme_file is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { 
      target_folder, 
      title, 
      author, 
      theme_file, 
      highlight_style = 'atom-one',
      title_slide_background_image 
    } = params;
    
    this.log(`Generating RevealJS slides: ${title}`);
    
    try {
      // Ensure target directory exists
      await fs.ensureDir(target_folder);
      
      // Generate the slides content
      const slidesContent = `---
title: "${title}"
author: "${author}"
format:
  revealjs:
    theme: ${theme_file}
    highlight-style: ${highlight_style}
    slide-number: true
    chalkboard: true
    preview-links: auto
    css: styles.css${title_slide_background_image ? `
    title-slide-attributes:
      data-background-image: "${title_slide_background_image}"
      data-background-size: cover
      data-background-opacity: "0.7"` : ''}
---

# ${title}

${author}

## Slide 2

Content for your second slide goes here.

- Bullet point 1
- Bullet point 2
- Bullet point 3

## Code Example

\`\`\`{r}
#| echo: true
# Sample R code
library(ggplot2)
data(mtcars)
ggplot(mtcars, aes(x = mpg, y = hp)) +
  geom_point() +
  labs(title = "Miles per Gallon vs Horsepower")
\`\`\`

## Thank You!

Questions?
`;

      // Generate accompanying CSS file
      const cssContent = `/* Custom styles for RevealJS slides */
.reveal h1, .reveal h2, .reveal h3 {
  text-transform: none;
}

.reveal .slides section {
  text-align: left;
}

.reveal .slides section > h1,
.reveal .slides section > h2 {
  text-align: center;
}

/* Code block styling */
.reveal pre code {
  max-height: 400px;
  overflow-y: auto;
}

/* Custom title slide if background image is used */
.reveal .title .title {
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.reveal .title .author {
  color: white;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
}
`;

      // Write files
      const slidesPath = path.join(target_folder, 'slides.qmd');
      const cssPath = path.join(target_folder, 'styles.css');
      
      await fs.writeFile(slidesPath, slidesContent);
      await fs.writeFile(cssPath, cssContent);

      this.success(`RevealJS slides generated: ${slidesPath}`);
      
      return {
        success: true,
        slides_path: slidesPath,
        css_path: cssPath,
        title,
        author,
        theme_file,
        highlight_style,
        background_image: title_slide_background_image,
        render_command: `quarto render "${slidesPath}"`
      };
    } catch (error) {
      this.error(`Failed to generate RevealJS slides: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  QuartoConfigureSiteYml,
  QuartoRenderLocal,
  QuartoCreateGitignore,
  QuartoDefineOjsChunk,
  QuartoApplyScssTheme,
  QuartoConfigureChunkOutput,
  QuartoNameCodeChunk,
  QuartoGenerateRevealJsSlides
};