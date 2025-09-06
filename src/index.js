const { CopilotQuartoToolRegistry } = require('./core');

// Import all tool implementations
const QuartoCreateProjectWithRenvAndGit = require('./tools/quarto-project');
const { 
  RPackageRenvInstallPackage, 
  RPackageRenvSnapshot, 
  RPackageRenvStatus 
} = require('./tools/r-packages');
const {
  QuartoDefineDashboardFormat,
  QuartoDefineDashboardLayout,
  QuartoAddDashboardLogo
} = require('./tools/dashboard');
const {
  QuartoConfigureSiteYml,
  QuartoRenderLocal,
  QuartoCreateGitignore,
  QuartoDefineOjsChunk,
  QuartoApplyScssTheme,
  QuartoConfigureChunkOutput,
  QuartoNameCodeChunk,
  QuartoGenerateRevealJsSlides
} = require('./tools/quarto-config');
const {
  GithubCreateRepository,
  GitPushProject,
  GithubCreateGhPagesBranch,
  GithubActionsConfigurePublishingWorkflow,
  GithubActionsScheduleWorkflow,
  GithubPagesConfigureDeploymentSource
} = require('./tools/github');
const {
  OpenaiGenerateThemeRecommendations,
  OpenaiGenerateImage,
  QuartoGenerateCustomScss
} = require('./tools/openai');
const {
  ChatgptGenerateCronExpression
} = require('./tools/utils');

// Import new tool modules
const {
  OjsTransposeData,
  OjsCreateDropdownMenu,
  OjsDynamicIframeUpdate
} = require('./tools/ojs');
const {
  GithubActionsCreateSecret,
  GithubActionsDefineWorkflowEnv,
  GithubActionsMonitorWorkflow,
  GithubActionsRerunWorkflow
} = require('./tools/github-advanced');
const {
  RStoreLocalSecretsRenviron,
  RGetEnvironmentVariable,
  ROjsDefineData,
  RPackageHttr2ApiAccess,
  RPackageGtCreateTable,
  RDownloadFile,
  RJsonParse,
  RZipFilesForDownload
} = require('./tools/r-advanced');
const {
  QuartoEmbedYoutubeIframe,
  QuartoEmbedSpotifyIframe,
  QuartoEmbedShinyAppIframe
} = require('./tools/embedding');
const {
  HtmlIframeCustomizeAttributes
} = require('./tools/html');

/**
 * Main entry point for copilot-quarto tools
 */
class CopilotQuarto {
  constructor() {
    this.registry = new CopilotQuartoToolRegistry();
    this.initializeTools();
  }

  /**
   * Register all available tools
   */
  initializeTools() {
    // Project management tools
    this.registry.register(new QuartoCreateProjectWithRenvAndGit());
    
    // R package management tools
    this.registry.register(new RPackageRenvInstallPackage());
    this.registry.register(new RPackageRenvSnapshot());
    this.registry.register(new RPackageRenvStatus());
    
    // Dashboard tools
    this.registry.register(new QuartoDefineDashboardFormat());
    this.registry.register(new QuartoDefineDashboardLayout());
    this.registry.register(new QuartoAddDashboardLogo());
    
    // Quarto configuration tools
    this.registry.register(new QuartoConfigureSiteYml());
    this.registry.register(new QuartoRenderLocal());
    this.registry.register(new QuartoCreateGitignore());
    this.registry.register(new QuartoDefineOjsChunk());
    this.registry.register(new QuartoApplyScssTheme());
    this.registry.register(new QuartoConfigureChunkOutput());
    this.registry.register(new QuartoNameCodeChunk());
    this.registry.register(new QuartoGenerateRevealJsSlides());
    
    // GitHub integration tools
    this.registry.register(new GithubCreateRepository());
    this.registry.register(new GitPushProject());
    this.registry.register(new GithubCreateGhPagesBranch());
    this.registry.register(new GithubActionsConfigurePublishingWorkflow());
    this.registry.register(new GithubActionsScheduleWorkflow());
    this.registry.register(new GithubPagesConfigureDeploymentSource());
    
    // OpenAI integration tools
    this.registry.register(new OpenaiGenerateThemeRecommendations());
    this.registry.register(new OpenaiGenerateImage());
    this.registry.register(new QuartoGenerateCustomScss());
    
    // Utility tools
    this.registry.register(new ChatgptGenerateCronExpression());
    
    // OJS data manipulation tools
    this.registry.register(new OjsTransposeData());
    this.registry.register(new OjsCreateDropdownMenu());
    this.registry.register(new OjsDynamicIframeUpdate());
    
    // Advanced GitHub Actions tools
    this.registry.register(new GithubActionsCreateSecret());
    this.registry.register(new GithubActionsDefineWorkflowEnv());
    this.registry.register(new GithubActionsMonitorWorkflow());
    this.registry.register(new GithubActionsRerunWorkflow());
    
    // Enhanced R environment tools
    this.registry.register(new RStoreLocalSecretsRenviron());
    this.registry.register(new RGetEnvironmentVariable());
    this.registry.register(new ROjsDefineData());
    this.registry.register(new RPackageHttr2ApiAccess());
    this.registry.register(new RPackageGtCreateTable());
    this.registry.register(new RDownloadFile());
    this.registry.register(new RJsonParse());
    this.registry.register(new RZipFilesForDownload());
    
    // Content embedding tools
    this.registry.register(new QuartoEmbedYoutubeIframe());
    this.registry.register(new QuartoEmbedSpotifyIframe());
    this.registry.register(new QuartoEmbedShinyAppIframe());
    
    // HTML/iframe customization tools
    this.registry.register(new HtmlIframeCustomizeAttributes());
  }

  /**
   * Execute a tool by name
   * @param {string} toolName 
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async execute(toolName, params = {}) {
    return await this.registry.execute(toolName, params);
  }

  /**
   * Get list of all available tools
   * @returns {Array<string>}
   */
  getAvailableTools() {
    return this.registry.getToolNames();
  }

  /**
   * Get tool definitions matching the copilot-tools.json format
   * @returns {Array<Object>}
   */
  getToolDefinitions() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const toolsJsonPath = path.join(__dirname, '../.github/copilot-tools.json');
      const toolsJson = JSON.parse(fs.readFileSync(toolsJsonPath, 'utf8'));
      return toolsJson;
    } catch (error) {
      console.error('Failed to load tool definitions:', error.message);
      return [];
    }
  }

  /**
   * Validate that all defined tools are implemented
   * @returns {Object} Validation result
   */
  validateImplementation() {
    const definitions = this.getToolDefinitions();
    const implemented = this.getAvailableTools();
    
    const missing = definitions
      .map(def => def.name)
      .filter(name => !implemented.includes(name));
    
    const extra = implemented
      .filter(name => !definitions.find(def => def.name === name));
    
    return {
      allImplemented: missing.length === 0,
      missing,
      extra,
      implemented: implemented.length,
      defined: definitions.length
    };
  }
}

module.exports = CopilotQuarto;

// CLI support
if (require.main === module) {
  const copilot = new CopilotQuarto();
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Available tools:', copilot.getAvailableTools());
    
    const validation = copilot.validateImplementation();
    console.log('\nImplementation status:');
    console.log(`✅ Implemented: ${validation.implemented}/${validation.defined}`);
    
    if (validation.missing.length > 0) {
      console.log(`❌ Missing: ${validation.missing.join(', ')}`);
    }
    
    if (validation.extra.length > 0) {
      console.log(`ℹ️  Extra: ${validation.extra.join(', ')}`);
    }
    
    process.exit(0);
  }
  
  const toolName = args[0];
  const params = args[1] ? JSON.parse(args[1]) : {};
  
  copilot.execute(toolName, params)
    .then(result => {
      console.log('Result:', JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Error:', error.message);
      process.exit(1);
    });
}