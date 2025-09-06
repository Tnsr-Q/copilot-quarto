const { CopilotQuartoTool } = require('../core');
const { Octokit } = require('@octokit/rest');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('yaml');

/**
 * Tool to create GitHub repository
 */
class GithubCreateRepository extends CopilotQuartoTool {
  constructor() {
    super('github_create_repository', 
      'Create a new GitHub repo (public or private).');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.repository_name) {
      errors.push('repository_name is required');
    }
    
    if (!params.visibility || !['public', 'private'].includes(params.visibility)) {
      errors.push('visibility must be either "public" or "private"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { repository_name, visibility } = params;
    
    this.log(`Creating GitHub repository: ${repository_name} (${visibility})`);
    
    try {
      // Get GitHub token from environment
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }
      
      const octokit = new Octokit({ auth: token });
      
      // Create repository
      const response = await octokit.rest.repos.createForAuthenticatedUser({
        name: repository_name,
        private: visibility === 'private',
        auto_init: false,
        description: `Quarto project: ${repository_name}`
      });
      
      this.success(`Repository created: ${response.data.html_url}`);
      
      return {
        success: true,
        repository_name,
        repository_url: response.data.html_url,
        clone_url: response.data.clone_url,
        ssh_url: response.data.ssh_url,
        message: 'GitHub repository created successfully'
      };
      
    } catch (error) {
      this.error(`Failed to create repository: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to push local project to GitHub
 */
class GitPushProject extends CopilotQuartoTool {
  constructor() {
    super('git_push_project', 
      'Stage, commit and push local Quarto project to the remote GitHub repo.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.local_project_path) {
      errors.push('local_project_path is required');
    }
    
    if (!params.github_repo_url) {
      errors.push('github_repo_url is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { local_project_path, github_repo_url } = params;
    
    this.log(`Pushing ${local_project_path} to ${github_repo_url}`);
    
    if (!fs.existsSync(local_project_path)) {
      throw new Error(`Local project path does not exist: ${local_project_path}`);
    }
    
    try {
      const projectPath = path.resolve(local_project_path);
      
      // Check if it's a git repository
      const gitDir = path.join(projectPath, '.git');
      if (!fs.existsSync(gitDir)) {
        this.log('Initializing git repository');
        execSync('git init', { cwd: projectPath, stdio: 'inherit' });
      }
      
      // Add remote origin if not exists
      try {
        execSync('git remote get-url origin', { cwd: projectPath, stdio: 'ignore' });
        this.log('Remote origin already exists, updating URL');
        execSync(`git remote set-url origin "${github_repo_url}"`, { cwd: projectPath, stdio: 'inherit' });
      } catch (error) {
        this.log('Adding remote origin');
        execSync(`git remote add origin "${github_repo_url}"`, { cwd: projectPath, stdio: 'inherit' });
      }
      
      // Stage all files
      execSync('git add .', { cwd: projectPath, stdio: 'inherit' });
      
      // Check if there are changes to commit
      try {
        execSync('git diff --staged --quiet', { cwd: projectPath, stdio: 'ignore' });
        this.log('No changes to commit');
      } catch (error) {
        // There are staged changes, commit them
        execSync('git commit -m "Initial commit from copilot-quarto"', { cwd: projectPath, stdio: 'inherit' });
      }
      
      // Push to GitHub
      execSync('git push -u origin main', { cwd: projectPath, stdio: 'inherit' });
      
      this.success(`Project pushed to ${github_repo_url}`);
      
      return {
        success: true,
        local_project_path: projectPath,
        github_repo_url,
        message: 'Project pushed to GitHub successfully'
      };
      
    } catch (error) {
      this.error(`Failed to push project: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to create GitHub Pages branch
 */
class GithubCreateGhPagesBranch extends CopilotQuartoTool {
  constructor() {
    super('github_create_gh_pages_branch', 
      'Create an orphan `gh-pages` branch (used by GitHub-Pages).');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.repository_name) {
      errors.push('repository_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { repository_name } = params;
    
    this.log(`Creating gh-pages branch for ${repository_name}`);
    
    try {
      // Get GitHub token from environment
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }
      
      const octokit = new Octokit({ auth: token });
      
      // Get authenticated user
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const owner = user.login;
      
      // Check if gh-pages branch already exists
      try {
        await octokit.rest.repos.getBranch({
          owner,
          repo: repository_name,
          branch: 'gh-pages'
        });
        
        this.log('gh-pages branch already exists');
        return {
          success: true,
          repository_name,
          branch_name: 'gh-pages',
          message: 'gh-pages branch already exists'
        };
      } catch (error) {
        if (error.status !== 404) {
          throw error;
        }
        // Branch doesn't exist, continue to create it
      }
      
      // Get main branch reference
      const { data: mainBranch } = await octokit.rest.repos.getBranch({
        owner,
        repo: repository_name,
        branch: 'main'
      });
      
      // Create gh-pages branch
      await octokit.rest.git.createRef({
        owner,
        repo: repository_name,
        ref: 'refs/heads/gh-pages',
        sha: mainBranch.commit.sha
      });
      
      this.success(`gh-pages branch created for ${repository_name}`);
      
      return {
        success: true,
        repository_name,
        branch_name: 'gh-pages',
        message: 'gh-pages branch created successfully'
      };
      
    } catch (error) {
      this.error(`Failed to create gh-pages branch: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to configure GitHub Actions publishing workflow
 */
class GithubActionsConfigurePublishingWorkflow extends CopilotQuartoTool {
  constructor() {
    super('github_actions_configure_publishing_workflow', 
      'Create `.github/workflows/publish.yml` that installs R + Quarto, restores renv, renders and deploys to GitHub-Pages on every push to main.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.workflow_file_path) {
      errors.push('workflow_file_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { workflow_file_path, quarto_docs_workflow_content } = params;
    
    this.log(`Creating GitHub Actions workflow: ${workflow_file_path}`);
    
    const defaultWorkflowContent = `name: Publish Quarto Site

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup R
        uses: r-lib/actions/setup-r@v2
        with:
          use-public-rspm: true

      - name: Setup Quarto
        uses: quarto-dev/quarto-actions/setup@v2

      - name: Restore renv packages
        shell: Rscript {0}
        run: |
          if (!requireNamespace("renv", quietly = TRUE)) install.packages("renv")
          renv::restore()

      - name: Setup Pages
        uses: actions/configure-pages@v3

      - name: Render Quarto Project
        uses: quarto-dev/quarto-actions/render@v2

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: ./_site

  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2`;

    const workflowContent = quarto_docs_workflow_content || defaultWorkflowContent;
    
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(workflow_file_path));
    
    // Write workflow file
    fs.writeFileSync(workflow_file_path, workflowContent);
    
    this.success(`GitHub Actions workflow created: ${workflow_file_path}`);
    
    return {
      success: true,
      workflow_file_path,
      message: 'GitHub Actions publishing workflow configured'
    };
  }
}

/**
 * Tool to schedule GitHub Actions workflow with cron
 */
class GithubActionsScheduleWorkflow extends CopilotQuartoTool {
  constructor() {
    super('github_actions_schedule_workflow', 
      'Insert a cron schedule into an existing workflow file.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.workflow_yml_path) {
      errors.push('workflow_yml_path is required');
    }
    
    if (!params.cron_expression) {
      errors.push('cron_expression is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { workflow_yml_path, cron_expression } = params;
    
    this.log(`Adding cron schedule to workflow: ${workflow_yml_path}`);
    
    if (!fs.existsSync(workflow_yml_path)) {
      throw new Error(`Workflow file does not exist: ${workflow_yml_path}`);
    }
    
    try {
      const content = fs.readFileSync(workflow_yml_path, 'utf8');
      const workflow = yaml.parse(content);
      
      // Add schedule to the workflow
      if (!workflow.on) {
        workflow.on = {};
      }
      
      workflow.on.schedule = [
        { cron: cron_expression }
      ];
      
      // Write back to file
      const updatedContent = yaml.stringify(workflow);
      fs.writeFileSync(workflow_yml_path, updatedContent);
      
      this.success(`Cron schedule added to workflow: ${cron_expression}`);
      
      return {
        success: true,
        workflow_yml_path,
        cron_expression,
        message: 'Workflow scheduled successfully'
      };
      
    } catch (error) {
      this.error(`Failed to schedule workflow: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to configure GitHub Pages deployment source
 */
class GithubPagesConfigureDeploymentSource extends CopilotQuartoTool {
  constructor() {
    super('github_pages_configure_deployment_source', 
      'Tell GitHub-Pages to serve from `gh-pages` branch /root folder.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.repository_name) {
      errors.push('repository_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { repository_name, branch_name = 'gh-pages' } = params;
    
    this.log(`Configuring GitHub Pages for ${repository_name}`);
    
    try {
      // Get GitHub token from environment
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }
      
      const octokit = new Octokit({ auth: token });
      
      // Get authenticated user
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const owner = user.login;
      
      // Configure GitHub Pages
      await octokit.rest.repos.createPagesSite({
        owner,
        repo: repository_name,
        source: {
          branch: branch_name,
          path: '/'
        }
      });
      
      this.success(`GitHub Pages configured for ${repository_name}`);
      
      return {
        success: true,
        repository_name,
        branch_name,
        pages_url: `https://${owner}.github.io/${repository_name}/`,
        message: 'GitHub Pages deployment configured'
      };
      
    } catch (error) {
      if (error.message.includes('Pages already set up')) {
        this.log('GitHub Pages already configured');
        return {
          success: true,
          repository_name,
          branch_name,
          message: 'GitHub Pages already configured'
        };
      }
      
      this.error(`Failed to configure GitHub Pages: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  GithubCreateRepository,
  GitPushProject,
  GithubCreateGhPagesBranch,
  GithubActionsConfigurePublishingWorkflow,
  GithubActionsScheduleWorkflow,
  GithubPagesConfigureDeploymentSource
};