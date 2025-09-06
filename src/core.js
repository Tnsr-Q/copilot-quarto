const fs = require('fs-extra');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');

/**
 * Base class for all Copilot Quarto tools
 */
class CopilotQuartoTool {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  /**
   * Validate parameters before execution
   * @param {Object} params - Tool parameters
   * @returns {Object} Validation result
   */
  validateParams(params) {
    return { valid: true, errors: [] };
  }

  /**
   * Execute the tool with given parameters
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Execution result
   */
  async execute(params) {
    throw new Error('execute method must be implemented by subclass');
  }

  /**
   * Log info message
   * @param {string} message 
   */
  log(message) {
    console.log(chalk.blue(`[${this.name}]`), message);
  }

  /**
   * Log error message
   * @param {string} message 
   */
  error(message) {
    console.error(chalk.red(`[${this.name}] ERROR:`), message);
  }

  /**
   * Log success message
   * @param {string} message 
   */
  success(message) {
    console.log(chalk.green(`[${this.name}] SUCCESS:`), message);
  }
}

/**
 * Tool registry and executor
 */
class CopilotQuartoToolRegistry {
  constructor() {
    this.tools = new Map();
  }

  /**
   * Register a tool
   * @param {CopilotQuartoTool} tool 
   */
  register(tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute a tool by name
   * @param {string} toolName 
   * @param {Object} params 
   * @returns {Promise<Object>}
   */
  async execute(toolName, params) {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found`);
    }

    const validation = tool.validateParams(params);
    if (!validation.valid) {
      throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
    }

    return await tool.execute(params);
  }

  /**
   * Get list of all registered tools
   * @returns {Array<string>}
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }
}

module.exports = {
  CopilotQuartoTool,
  CopilotQuartoToolRegistry
};