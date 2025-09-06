const { CopilotQuartoTool } = require('../core');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Tool to create a new Quarto project with renv and git initialization
 */
class QuartoCreateProjectWithRenvAndGit extends CopilotQuartoTool {
  constructor() {
    super('quarto_create_project_with_renv_and_git', 
      'Scaffold a new Quarto project folder, initialise renv, git, and a GitHub-ready README.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.project_directory_name) {
      errors.push('project_directory_name is required');
    }
    
    if (typeof params.create_git_repo !== 'boolean') {
      errors.push('create_git_repo must be a boolean');
    }
    
    if (typeof params.use_renv !== 'boolean') {
      errors.push('use_renv must be a boolean');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { project_directory_name, create_git_repo, use_renv } = params;
    
    this.log(`Creating Quarto project: ${project_directory_name}`);
    
    // Create project directory
    const projectPath = path.resolve(project_directory_name);
    
    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory '${project_directory_name}' already exists`);
    }
    
    fs.ensureDirSync(projectPath);
    
    try {
      // Create basic Quarto project structure
      await this.createQuartoProject(projectPath);
      
      // Initialize git if requested
      if (create_git_repo) {
        this.log('Initializing git repository');
        execSync('git init', { cwd: projectPath, stdio: 'inherit' });
        
        // Create .gitignore
        const gitignoreContent = `
.Rproj.user
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
`;
        fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent.trim());
      }
      
      // Initialize renv if requested
      if (use_renv) {
        this.log('Initializing renv');
        await this.initializeRenv(projectPath);
      }
      
      // Create README
      await this.createREADME(projectPath, project_directory_name);
      
      this.success(`Project '${project_directory_name}' created successfully`);
      
      return {
        success: true,
        project_path: projectPath,
        message: `Quarto project created at ${projectPath}`
      };
      
    } catch (error) {
      // Clean up on failure
      fs.removeSync(projectPath);
      throw error;
    }
  }

  async createQuartoProject(projectPath) {
    // Create _quarto.yml
    const quartoConfig = {
      project: {
        type: 'website'
      },
      website: {
        title: path.basename(projectPath),
        navbar: {
          left: [
            { href: 'index.qmd', text: 'Home' }
          ]
        }
      },
      format: {
        html: {
          theme: 'cosmo',
          css: 'styles.css',
          toc: true
        }
      }
    };
    
    const yaml = require('yaml');
    fs.writeFileSync(
      path.join(projectPath, '_quarto.yml'), 
      yaml.stringify(quartoConfig)
    );
    
    // Create index.qmd
    const indexContent = `---
title: "${path.basename(projectPath)}"
---

# Welcome to ${path.basename(projectPath)}

This is a Quarto project.

## About

[Add your content here]
`;
    
    fs.writeFileSync(path.join(projectPath, 'index.qmd'), indexContent);
    
    // Create styles.css
    const stylesContent = `/* Custom styles for ${path.basename(projectPath)} */

/* Add your custom CSS here */
`;
    
    fs.writeFileSync(path.join(projectPath, 'styles.css'), stylesContent);
  }

  async initializeRenv(projectPath) {
    try {
      // Check if R is available
      execSync('R --version', { stdio: 'ignore' });
      
      // Initialize renv
      const rScript = `
        if (!requireNamespace("renv", quietly = TRUE)) {
          install.packages("renv")
        }
        renv::init(restart = FALSE)
      `;
      
      const tempScript = path.join(projectPath, '.temp_renv_init.R');
      fs.writeFileSync(tempScript, rScript);
      
      try {
        execSync(`R --slave --no-restore --file=${tempScript}`, { 
          cwd: projectPath, 
          stdio: 'inherit' 
        });
      } finally {
        fs.removeSync(tempScript);
      }
      
    } catch (error) {
      this.error('Failed to initialize renv. Make sure R is installed and available.');
      throw error;
    }
  }

  async createREADME(projectPath, projectName) {
    const readmeContent = `# ${projectName}

A Quarto project created with copilot-quarto.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   # If using renv
   R -e "renv::restore()"
   \`\`\`

2. Render the project:
   \`\`\`bash
   quarto render
   \`\`\`

3. Preview locally:
   \`\`\`bash
   quarto preview
   \`\`\`

## Project Structure

- \`index.qmd\` - Main content file
- \`_quarto.yml\` - Quarto configuration
- \`styles.css\` - Custom styles
- \`renv/\` - R package dependencies (if using renv)

## Deployment

This project can be deployed to GitHub Pages or other static hosting services.

## License

[Add license information]
`;
    
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);
  }
}

module.exports = QuartoCreateProjectWithRenvAndGit;