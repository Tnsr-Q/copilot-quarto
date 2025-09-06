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

module.exports = {
  QuartoConfigureSiteYml,
  QuartoRenderLocal,
  QuartoCreateGitignore,
  QuartoDefineOjsChunk
};