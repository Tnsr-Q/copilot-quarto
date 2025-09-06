const { CopilotQuartoTool } = require('../core');

/**
 * Tool to customize iframe attributes
 */
class HtmlIframeCustomizeAttributes extends CopilotQuartoTool {
  constructor() {
    super('html_iframe_customize_attributes', 
      'Modify any attribute on an existing iframe tag.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.iframe_html) {
      errors.push('iframe_html is required');
    }
    
    if (!params.attribute_name) {
      errors.push('attribute_name is required');
    }
    
    if (!params.attribute_value) {
      errors.push('attribute_value is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { iframe_html, attribute_name, attribute_value } = params;
    
    this.log(`Customizing iframe attribute: ${attribute_name}`);
    
    try {
      // Validate that the input is an iframe
      if (!iframe_html.includes('<iframe')) {
        throw new Error('Provided HTML does not contain an iframe tag');
      }
      
      // Parse the iframe to extract existing attributes
      const iframeMatch = iframe_html.match(/<iframe([^>]*)>/i);
      if (!iframeMatch) {
        throw new Error('Could not parse iframe tag');
      }
      
      let iframeAttributes = iframeMatch[1];
      let modifiedHtml = iframe_html;
      
      // Check if attribute already exists
      const attributePattern = new RegExp(`\\s${attribute_name}\\s*=\\s*["']([^"']*)["']`, 'i');
      const existingMatch = iframeAttributes.match(attributePattern);
      
      if (existingMatch) {
        // Replace existing attribute
        modifiedHtml = iframe_html.replace(
          attributePattern,
          ` ${attribute_name}="${attribute_value}"`
        );
        this.log(`Updated existing attribute: ${attribute_name}`);
      } else {
        // Add new attribute
        const closingTagIndex = iframe_html.indexOf('>');
        modifiedHtml = iframe_html.slice(0, closingTagIndex) + 
                      ` ${attribute_name}="${attribute_value}"` + 
                      iframe_html.slice(closingTagIndex);
        this.log(`Added new attribute: ${attribute_name}`);
      }
      
      // Generate common attribute customizations
      const commonCustomizations = {
        responsive: {
          style: 'width: 100%; max-width: 100%; height: auto; aspect-ratio: 16/9;',
          description: 'Makes iframe responsive'
        },
        fullscreen: {
          allowfullscreen: 'true',
          description: 'Enables fullscreen capability'
        },
        security: {
          sandbox: 'allow-scripts allow-same-origin',
          description: 'Adds security restrictions'
        },
        loading: {
          loading: 'lazy',
          description: 'Enables lazy loading'
        },
        seamless: {
          frameborder: '0',
          scrolling: 'no',
          style: 'border: none;',
          description: 'Removes borders and scrollbars'
        }
      };
      
      // Generate usage examples
      const usageExamples = `
## Common iframe customizations:

### Make responsive:
${this.customizeIframe(iframe_html, 'style', 'width: 100%; max-width: 100%; height: auto; aspect-ratio: 16/9;')}

### Enable fullscreen:
${this.customizeIframe(iframe_html, 'allowfullscreen', 'true')}

### Add security sandbox:
${this.customizeIframe(iframe_html, 'sandbox', 'allow-scripts allow-same-origin')}

### Enable lazy loading:
${this.customizeIframe(iframe_html, 'loading', 'lazy')}

### Remove borders:
${this.customizeIframe(iframe_html, 'frameborder', '0')}
`;

      this.success(`Modified iframe attribute: ${attribute_name} = "${attribute_value}"`);
      
      return {
        success: true,
        original_html: iframe_html,
        modified_html: modifiedHtml,
        attribute_name,
        attribute_value,
        attribute_existed: !!existingMatch,
        common_customizations: commonCustomizations,
        usage_examples: usageExamples
      };
    } catch (error) {
      this.error(`Failed to customize iframe: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper method to customize iframe attributes
   * @param {string} iframeHtml 
   * @param {string} attrName 
   * @param {string} attrValue 
   * @returns {string}
   */
  customizeIframe(iframeHtml, attrName, attrValue) {
    const attributePattern = new RegExp(`\\s${attrName}\\s*=\\s*["']([^"']*)["']`, 'i');
    const existingMatch = iframeHtml.match(attributePattern);
    
    if (existingMatch) {
      return iframeHtml.replace(attributePattern, ` ${attrName}="${attrValue}"`);
    } else {
      const closingTagIndex = iframeHtml.indexOf('>');
      return iframeHtml.slice(0, closingTagIndex) + 
             ` ${attrName}="${attrValue}"` + 
             iframeHtml.slice(closingTagIndex);
    }
  }
}

module.exports = {
  HtmlIframeCustomizeAttributes
};