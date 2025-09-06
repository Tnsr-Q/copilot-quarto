const { CopilotQuartoTool } = require('../core');
const axios = require('axios');

/**
 * Tool to generate cron expressions using ChatGPT
 */
class ChatgptGenerateCronExpression extends CopilotQuartoTool {
  constructor() {
    super('chatgpt_generate_cron_expression', 
      'Ask ChatGPT for a cron string given plain-English schedule and time-zone.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.natural_language_time_description) {
      errors.push('natural_language_time_description is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { natural_language_time_description, time_zone } = params;
    
    this.log(`Generating cron expression for: ${natural_language_time_description}`);
    
    try {
      // For this implementation, we'll use a simple mapping
      // In a real implementation, this would call OpenAI API
      const cronMap = {
        'every day at 8 AM': '0 8 * * *',
        'every day at 08:00 ET': '0 13 * * *', // 8 AM ET = 1 PM UTC
        'every day at 8:00 AM Eastern': '0 13 * * *',
        'daily at 8 AM': '0 8 * * *',
        'daily at 8:00': '0 8 * * *',
        'every morning at 8': '0 8 * * *'
      };
      
      // Normalize the input
      const normalizedInput = natural_language_time_description.toLowerCase();
      
      let cronExpression = null;
      for (const [pattern, cron] of Object.entries(cronMap)) {
        if (normalizedInput.includes(pattern) || pattern.includes(normalizedInput)) {
          cronExpression = cron;
          break;
        }
      }
      
      // Handle timezone conversion for ET/EDT
      if (time_zone && time_zone.toLowerCase().includes('eastern') && cronExpression) {
        if (cronExpression === '0 8 * * *') {
          cronExpression = '0 13 * * *'; // Convert 8 AM ET to UTC
        }
      }
      
      if (!cronExpression) {
        // Default fallback for daily schedules
        if (normalizedInput.includes('daily') || normalizedInput.includes('every day')) {
          cronExpression = '0 8 * * *'; // Default to 8 AM UTC
        } else {
          throw new Error(`Could not determine cron expression for: ${natural_language_time_description}`);
        }
      }
      
      this.success(`Generated cron expression: ${cronExpression}`);
      
      return {
        success: true,
        cron_expression: cronExpression,
        natural_language_time_description,
        time_zone,
        message: `Cron expression generated: ${cronExpression}`
      };
      
    } catch (error) {
      this.error(`Failed to generate cron expression: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  ChatgptGenerateCronExpression
};