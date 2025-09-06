const { CopilotQuartoTool } = require('../core');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Tool to install R packages using renv
 */
class RPackageRenvInstallPackage extends CopilotQuartoTool {
  constructor() {
    super('r_package_renv_install_package', 
      'Install an R package into the project renv library.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.package_name) {
      errors.push('package_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { package_name } = params;
    
    this.log(`Installing R package: ${package_name}`);
    
    try {
      // Check if R is available
      execSync('R --version', { stdio: 'ignore' });
      
      // Install package using renv
      const rScript = `
        if (!requireNamespace("renv", quietly = TRUE)) {
          install.packages("renv")
        }
        renv::install("${package_name}")
      `;
      
      execSync(`R --slave --no-restore -e '${rScript}'`, { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      
      this.success(`Package '${package_name}' installed successfully`);
      
      return {
        success: true,
        package: package_name,
        message: `R package ${package_name} installed`
      };
      
    } catch (error) {
      this.error(`Failed to install package '${package_name}': ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to create renv snapshot
 */
class RPackageRenvSnapshot extends CopilotQuartoTool {
  constructor() {
    super('r_package_renv_snapshot', 
      'Update renv.lock with currently loaded packages.');
  }

  validateParams(params) {
    return { valid: true, errors: [] };
  }

  async execute(params) {
    this.log('Creating renv snapshot');
    
    try {
      // Check if R is available
      execSync('R --version', { stdio: 'ignore' });
      
      // Create snapshot
      const rScript = `
        if (!requireNamespace("renv", quietly = TRUE)) {
          stop("renv is not available. Please initialize renv first.")
        }
        renv::snapshot()
      `;
      
      execSync(`R --slave --no-restore -e '${rScript}'`, { 
        stdio: 'inherit',
        timeout: 120000 // 2 minutes timeout
      });
      
      this.success('renv snapshot created successfully');
      
      return {
        success: true,
        message: 'renv snapshot updated'
      };
      
    } catch (error) {
      this.error(`Failed to create renv snapshot: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to check renv status
 */
class RPackageRenvStatus extends CopilotQuartoTool {
  constructor() {
    super('r_package_renv_status', 
      'Check if installed packages match renv.lock.');
  }

  validateParams(params) {
    return { valid: true, errors: [] };
  }

  async execute(params) {
    this.log('Checking renv status');
    
    try {
      // Check if R is available
      execSync('R --version', { stdio: 'ignore' });
      
      // Check status
      const rScript = `
        if (!requireNamespace("renv", quietly = TRUE)) {
          stop("renv is not available. Please initialize renv first.")
        }
        status <- renv::status()
        print(status)
      `;
      
      const output = execSync(`R --slave --no-restore -e '${rScript}'`, { 
        encoding: 'utf8',
        timeout: 60000 // 1 minute timeout
      });
      
      this.success('renv status checked successfully');
      
      return {
        success: true,
        status: output,
        message: 'renv status retrieved'
      };
      
    } catch (error) {
      this.error(`Failed to check renv status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  RPackageRenvInstallPackage,
  RPackageRenvSnapshot,
  RPackageRenvStatus
};