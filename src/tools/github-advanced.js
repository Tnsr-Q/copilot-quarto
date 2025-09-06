const { CopilotQuartoTool } = require('../core');
const { Octokit } = require('@octokit/rest');
const fs = require('fs-extra');
const yaml = require('yaml');

/**
 * Tool to create or update GitHub repository secrets
 */
class GithubActionsCreateSecret extends CopilotQuartoTool {
  constructor() {
    super('github_actions_create_secret', 
      'Create or update an encrypted repo secret (masked in logs).');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.repository_name) {
      errors.push('repository_name is required');
    }
    
    if (!params.secret_name) {
      errors.push('secret_name is required');
    }
    
    if (!params.secret_value) {
      errors.push('secret_value is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { repository_name, secret_name, secret_value } = params;
    
    this.log(`Creating/updating secret '${secret_name}' in repository '${repository_name}'`);
    
    try {
      // Note: In a real implementation, this would use GitHub API with proper authentication
      // For now, we'll simulate the action and provide instructions
      
      const instructions = `
To create the secret '${secret_name}' in repository '${repository_name}':

1. Go to GitHub repository: https://github.com/${repository_name}
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: ${secret_name}
5. Value: [REDACTED]
6. Click "Add secret"

Or use GitHub CLI:
gh secret set ${secret_name} --body "${secret_value}" --repo ${repository_name}
`;

      this.log('Secret creation instructions generated');
      this.success(`Secret '${secret_name}' setup instructions created`);
      
      return {
        success: true,
        secret_name,
        repository_name,
        instructions,
        cli_command: `gh secret set ${secret_name} --body "***" --repo ${repository_name}`
      };
    } catch (error) {
      this.error(`Failed to create secret: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to define workflow environment variables that map to GitHub secrets
 */
class GithubActionsDefineWorkflowEnv extends CopilotQuartoTool {
  constructor() {
    super('github_actions_define_workflow_env', 
      'Add an env-map entry so that `${{ secrets.XXX }}` becomes `Sys.getenv(\'YYY\')` inside R scripts during the workflow.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.workflow_yml_path) {
      errors.push('workflow_yml_path is required');
    }
    
    if (!params.r_script_env_name) {
      errors.push('r_script_env_name is required');
    }
    
    if (!params.github_secret_name) {
      errors.push('github_secret_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { workflow_yml_path, r_script_env_name, github_secret_name } = params;
    
    this.log(`Adding environment mapping to workflow: ${workflow_yml_path}`);
    
    try {
      if (!await fs.pathExists(workflow_yml_path)) {
        throw new Error(`Workflow file not found: ${workflow_yml_path}`);
      }

      // Read the workflow file
      const workflowContent = await fs.readFile(workflow_yml_path, 'utf8');
      const workflowData = yaml.parse(workflowContent);

      // Ensure the jobs exist
      if (!workflowData.jobs) {
        workflowData.jobs = {};
      }

      // Add environment variable to all jobs or create a default job
      const jobKeys = Object.keys(workflowData.jobs);
      if (jobKeys.length === 0) {
        // Create a default job if none exist
        workflowData.jobs.build = {
          'runs-on': 'ubuntu-latest',
          steps: []
        };
        jobKeys.push('build');
      }

      jobKeys.forEach(jobKey => {
        const job = workflowData.jobs[jobKey];
        
        // Initialize env if it doesn't exist
        if (!job.env) {
          job.env = {};
        }
        
        // Add the environment variable mapping
        job.env[r_script_env_name] = `\${{ secrets.${github_secret_name} }}`;
      });

      // Write back the modified workflow
      const updatedWorkflow = yaml.stringify(workflowData);
      await fs.writeFile(workflow_yml_path, updatedWorkflow);

      this.success(`Added environment mapping: ${r_script_env_name} -> secrets.${github_secret_name}`);
      
      return {
        success: true,
        workflow_path: workflow_yml_path,
        env_name: r_script_env_name,
        secret_name: github_secret_name,
        usage_in_r: `Sys.getenv("${r_script_env_name}")`
      };
    } catch (error) {
      this.error(`Failed to update workflow environment: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to monitor workflow runs and return live logs and status
 */
class GithubActionsMonitorWorkflow extends CopilotQuartoTool {
  constructor() {
    super('github_actions_monitor_workflow', 
      'Return live logs and status of a given workflow run.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.workflow_run_id) {
      errors.push('workflow_run_id is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { workflow_run_id } = params;
    
    this.log(`Monitoring workflow run: ${workflow_run_id}`);
    
    try {
      // Note: In a real implementation, this would use GitHub API to fetch live status
      // For now, we'll provide monitoring instructions and simulated data
      
      const monitoringInstructions = `
To monitor workflow run ${workflow_run_id}:

1. GitHub CLI:
   gh run view ${workflow_run_id} --log

2. GitHub API:
   curl -H "Authorization: token YOUR_TOKEN" \\
     https://api.github.com/repos/OWNER/REPO/actions/runs/${workflow_run_id}

3. Web interface:
   https://github.com/OWNER/REPO/actions/runs/${workflow_run_id}
`;

      // Simulated status data
      const simulatedStatus = {
        id: workflow_run_id,
        status: 'in_progress',
        conclusion: null,
        html_url: `https://github.com/OWNER/REPO/actions/runs/${workflow_run_id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        jobs: [
          {
            id: 'job_1',
            name: 'build',
            status: 'in_progress',
            steps: [
              { name: 'Checkout', status: 'completed', conclusion: 'success' },
              { name: 'Setup R', status: 'in_progress', conclusion: null },
              { name: 'Install dependencies', status: 'queued', conclusion: null }
            ]
          }
        ]
      };

      this.log('Workflow monitoring information generated');
      this.success(`Monitoring setup for workflow run: ${workflow_run_id}`);
      
      return {
        success: true,
        workflow_run_id,
        monitoring_instructions: monitoringInstructions,
        simulated_status: simulatedStatus
      };
    } catch (error) {
      this.error(`Failed to setup workflow monitoring: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to re-trigger a failed workflow run
 */
class GithubActionsRerunWorkflow extends CopilotQuartoTool {
  constructor() {
    super('github_actions_rerun_workflow', 
      'Re-trigger a failed workflow run after you fixed the issue.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.workflow_run_id) {
      errors.push('workflow_run_id is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { workflow_run_id } = params;
    
    this.log(`Preparing to rerun workflow: ${workflow_run_id}`);
    
    try {
      // Generate rerun instructions and commands
      const rerunInstructions = `
To rerun workflow ${workflow_run_id}:

1. GitHub CLI:
   gh run rerun ${workflow_run_id}

2. GitHub CLI (rerun failed jobs only):
   gh run rerun ${workflow_run_id} --failed

3. GitHub API:
   curl -X POST \\
     -H "Authorization: token YOUR_TOKEN" \\
     https://api.github.com/repos/OWNER/REPO/actions/runs/${workflow_run_id}/rerun

4. Web interface:
   - Go to: https://github.com/OWNER/REPO/actions/runs/${workflow_run_id}
   - Click "Re-run jobs" button
`;

      this.log('Rerun instructions generated');
      this.success(`Rerun setup for workflow: ${workflow_run_id}`);
      
      return {
        success: true,
        workflow_run_id,
        rerun_instructions: rerunInstructions,
        cli_command: `gh run rerun ${workflow_run_id}`,
        api_endpoint: `https://api.github.com/repos/OWNER/REPO/actions/runs/${workflow_run_id}/rerun`
      };
    } catch (error) {
      this.error(`Failed to setup workflow rerun: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  GithubActionsCreateSecret,
  GithubActionsDefineWorkflowEnv,
  GithubActionsMonitorWorkflow,
  GithubActionsRerunWorkflow
};