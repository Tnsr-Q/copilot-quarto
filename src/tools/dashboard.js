const { CopilotQuartoTool } = require('../core');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');

/**
 * Tool to convert QMD file to dashboard format
 */
class QuartoDefineDashboardFormat extends CopilotQuartoTool {
  constructor() {
    super('quarto_define_dashboard_format', 
      'Flip a .qmd file into dashboard mode by injecting `format: dashboard` into its YAML header.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.qmd_file_path) {
      errors.push('qmd_file_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { qmd_file_path, format_type = 'dashboard' } = params;
    
    this.log(`Converting ${qmd_file_path} to ${format_type} format`);
    
    if (!fs.existsSync(qmd_file_path)) {
      throw new Error(`File ${qmd_file_path} does not exist`);
    }
    
    try {
      const content = fs.readFileSync(qmd_file_path, 'utf8');
      const { frontMatter, body } = this.parseQmdFile(content);
      
      // Update format in frontmatter
      frontMatter.format = format_type;
      
      // Write back to file
      const updatedContent = this.serializeQmdFile(frontMatter, body);
      fs.writeFileSync(qmd_file_path, updatedContent);
      
      this.success(`File ${qmd_file_path} converted to ${format_type} format`);
      
      return {
        success: true,
        file_path: qmd_file_path,
        format_type,
        message: `QMD file converted to ${format_type} format`
      };
      
    } catch (error) {
      this.error(`Failed to convert file: ${error.message}`);
      throw error;
    }
  }

  parseQmdFile(content) {
    const lines = content.split('\n');
    let frontMatterStart = -1;
    let frontMatterEnd = -1;
    
    // Find YAML frontmatter
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (frontMatterStart === -1) {
          frontMatterStart = i;
        } else {
          frontMatterEnd = i;
          break;
        }
      }
    }
    
    let frontMatter = {};
    let body = content;
    
    if (frontMatterStart !== -1 && frontMatterEnd !== -1) {
      const yamlContent = lines.slice(frontMatterStart + 1, frontMatterEnd).join('\n');
      frontMatter = yaml.parse(yamlContent) || {};
      body = lines.slice(frontMatterEnd + 1).join('\n');
    }
    
    return { frontMatter, body };
  }

  serializeQmdFile(frontMatter, body) {
    const yamlContent = yaml.stringify(frontMatter);
    return `---\n${yamlContent}---\n${body}`;
  }
}

/**
 * Tool to define dashboard layout
 */
class QuartoDefineDashboardLayout extends CopilotQuartoTool {
  constructor() {
    super('quarto_define_dashboard_layout', 
      'Write a layout block (rows/columns with widths & heights) into the dashboard YAML.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.qmd_file_path) {
      errors.push('qmd_file_path is required');
    }
    
    if (!params.layout_structure) {
      errors.push('layout_structure is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { qmd_file_path, layout_structure, orientation = 'columns' } = params;
    
    this.log(`Setting dashboard layout for ${qmd_file_path}`);
    
    if (!fs.existsSync(qmd_file_path)) {
      throw new Error(`File ${qmd_file_path} does not exist`);
    }
    
    try {
      const content = fs.readFileSync(qmd_file_path, 'utf8');
      const { frontMatter, body } = this.parseQmdFile(content);
      
      // Ensure format is dashboard
      if (frontMatter.format !== 'dashboard') {
        frontMatter.format = 'dashboard';
      }
      
      // Add layout configuration
      frontMatter.layout = layout_structure;
      frontMatter.orientation = orientation;
      
      // Write back to file
      const updatedContent = this.serializeQmdFile(frontMatter, body);
      fs.writeFileSync(qmd_file_path, updatedContent);
      
      this.success(`Dashboard layout configured for ${qmd_file_path}`);
      
      return {
        success: true,
        file_path: qmd_file_path,
        layout_structure,
        orientation,
        message: 'Dashboard layout configured'
      };
      
    } catch (error) {
      this.error(`Failed to set dashboard layout: ${error.message}`);
      throw error;
    }
  }

  parseQmdFile(content) {
    const lines = content.split('\n');
    let frontMatterStart = -1;
    let frontMatterEnd = -1;
    
    // Find YAML frontmatter
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (frontMatterStart === -1) {
          frontMatterStart = i;
        } else {
          frontMatterEnd = i;
          break;
        }
      }
    }
    
    let frontMatter = {};
    let body = content;
    
    if (frontMatterStart !== -1 && frontMatterEnd !== -1) {
      const yamlContent = lines.slice(frontMatterStart + 1, frontMatterEnd).join('\n');
      frontMatter = yaml.parse(yamlContent) || {};
      body = lines.slice(frontMatterEnd + 1).join('\n');
    }
    
    return { frontMatter, body };
  }

  serializeQmdFile(frontMatter, body) {
    const yamlContent = yaml.stringify(frontMatter);
    return `---\n${yamlContent}---\n${body}`;
  }
}

/**
 * Tool to add logo to dashboard
 */
class QuartoAddDashboardLogo extends CopilotQuartoTool {
  constructor() {
    super('quarto_add_dashboard_logo', 
      'Reference a logo image in the dashboard YAML so it appears in the header.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.qmd_file_path) {
      errors.push('qmd_file_path is required');
    }
    
    if (!params.logo_image_path) {
      errors.push('logo_image_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { qmd_file_path, logo_image_path } = params;
    
    this.log(`Adding logo ${logo_image_path} to ${qmd_file_path}`);
    
    if (!fs.existsSync(qmd_file_path)) {
      throw new Error(`File ${qmd_file_path} does not exist`);
    }
    
    try {
      const content = fs.readFileSync(qmd_file_path, 'utf8');
      const { frontMatter, body } = this.parseQmdFile(content);
      
      // Add logo to frontmatter
      frontMatter.logo = logo_image_path;
      
      // Write back to file
      const updatedContent = this.serializeQmdFile(frontMatter, body);
      fs.writeFileSync(qmd_file_path, updatedContent);
      
      this.success(`Logo added to ${qmd_file_path}`);
      
      return {
        success: true,
        file_path: qmd_file_path,
        logo_image_path,
        message: 'Logo added to dashboard'
      };
      
    } catch (error) {
      this.error(`Failed to add logo: ${error.message}`);
      throw error;
    }
  }

  parseQmdFile(content) {
    const lines = content.split('\n');
    let frontMatterStart = -1;
    let frontMatterEnd = -1;
    
    // Find YAML frontmatter
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        if (frontMatterStart === -1) {
          frontMatterStart = i;
        } else {
          frontMatterEnd = i;
          break;
        }
      }
    }
    
    let frontMatter = {};
    let body = content;
    
    if (frontMatterStart !== -1 && frontMatterEnd !== -1) {
      const yamlContent = lines.slice(frontMatterStart + 1, frontMatterEnd).join('\n');
      frontMatter = yaml.parse(yamlContent) || {};
      body = lines.slice(frontMatterEnd + 1).join('\n');
    }
    
    return { frontMatter, body };
  }

  serializeQmdFile(frontMatter, body) {
    const yamlContent = yaml.stringify(frontMatter);
    return `---\n${yamlContent}---\n${body}`;
  }
}

module.exports = {
  QuartoDefineDashboardFormat,
  QuartoDefineDashboardLayout,
  QuartoAddDashboardLogo
};