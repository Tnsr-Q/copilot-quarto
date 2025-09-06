const { CopilotQuartoTool } = require('../core');

/**
 * Tool to transpose R to OJS data into a tidy OJS array
 */
class OjsTransposeData extends CopilotQuartoTool {
  constructor() {
    super('ojs_transpose_data', 
      'Transpose R ➜ OJS data into a tidy OJS array.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.ojs_data_variable) {
      errors.push('ojs_data_variable is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { ojs_data_variable } = params;
    
    this.log(`Transposing OJS data variable: ${ojs_data_variable}`);
    
    try {
      // Generate the OJS code to transpose the data
      const ojsCode = `
// Transpose ${ojs_data_variable} into a tidy array format
${ojs_data_variable}_transposed = {
  const data = ${ojs_data_variable};
  if (!data || data.length === 0) return [];
  
  // Convert object-based data to array of objects
  if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
    return data; // Already in correct format
  }
  
  // Handle column-based data (R-style)
  const keys = Object.keys(data);
  const length = data[keys[0]].length;
  
  return Array.from({length}, (_, i) => {
    const row = {};
    keys.forEach(key => {
      row[key] = data[key][i];
    });
    return row;
  });
}`;

      this.success(`Generated transpose code for ${ojs_data_variable}`);
      
      return {
        success: true,
        ojs_code: ojsCode,
        transposed_variable: `${ojs_data_variable}_transposed`
      };
    } catch (error) {
      this.error(`Failed to generate transpose code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to create a dropdown menu bound to an OJS array
 */
class OjsCreateDropdownMenu extends CopilotQuartoTool {
  constructor() {
    super('ojs_create_dropdown_menu', 
      'Build an Inputs.select dropdown bound to an OJS array.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.options_data) {
      errors.push('options_data is required');
    }
    
    if (!params.label) {
      errors.push('label is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { 
      options_data, 
      label, 
      unique_options_flag = true 
    } = params;
    
    this.log(`Creating dropdown menu with label: ${label}`);
    
    try {
      // Generate the unique variable name for the dropdown
      const dropdownVar = label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_dropdown';
      
      // Generate the OJS code for the dropdown
      const ojsCode = `
// Create dropdown for ${label}
viewof ${dropdownVar} = {
  const data = ${options_data};
  let options = data;
  
  ${unique_options_flag ? `
  // Get unique values if flag is true
  if (Array.isArray(data) && data.length > 0) {
    if (typeof data[0] === 'object') {
      // If data is array of objects, extract unique values from first property
      const firstKey = Object.keys(data[0])[0];
      options = [...new Set(data.map(d => d[firstKey]))];
    } else {
      // If data is array of primitives, get unique values
      options = [...new Set(data)];
    }
  }
  ` : ''}
  
  return Inputs.select(options, {
    label: "${label}",
    format: d => d.toString()
  });
}`;

      this.success(`Generated dropdown menu: ${dropdownVar}`);
      
      return {
        success: true,
        ojs_code: ojsCode,
        dropdown_variable: dropdownVar,
        variable_name: `viewof ${dropdownVar}`
      };
    } catch (error) {
      this.error(`Failed to create dropdown menu: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to dynamically update iframe src with dropdown selection
 */
class OjsDynamicIframeUpdate extends CopilotQuartoTool {
  constructor() {
    super('ojs_dynamic_iframe_update', 
      'Swap a placeholder inside an iframe src with the ID that matches the current dropdown selection.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.dropdown_variable) {
      errors.push('dropdown_variable is required');
    }
    
    if (!params.data_set) {
      errors.push('data_set is required');
    }
    
    if (!params.iframe_html_template) {
      errors.push('iframe_html_template is required');
    }
    
    if (!params.placeholder_string) {
      errors.push('placeholder_string is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { 
      dropdown_variable, 
      data_set, 
      iframe_html_template, 
      placeholder_string 
    } = params;
    
    this.log(`Creating dynamic iframe update for dropdown: ${dropdown_variable}`);
    
    try {
      // Generate the OJS code for dynamic iframe
      const iframeVar = `${dropdown_variable}_iframe`;
      
      const ojsCode = `
// Dynamic iframe that updates based on ${dropdown_variable} selection
${iframeVar} = {
  const selectedValue = ${dropdown_variable};
  const data = ${data_set};
  
  // Find the matching record in the dataset
  let matchingRecord = null;
  if (Array.isArray(data)) {
    matchingRecord = data.find(record => {
      // Try to match against various properties
      return Object.values(record).some(value => 
        value.toString().toLowerCase() === selectedValue.toString().toLowerCase()
      );
    });
  }
  
  // Get the replacement value (could be an ID or other identifier)
  const replacementValue = matchingRecord ? 
    (matchingRecord.id || matchingRecord.ID || matchingRecord.value || selectedValue) : 
    selectedValue;
  
  // Replace placeholder in the template
  const iframeHtml = \`${iframe_html_template}\`.replace(
    /${placeholder_string}/g, 
    replacementValue
  );
  
  return html\`\${iframeHtml}\`;
}`;

      this.success(`Generated dynamic iframe: ${iframeVar}`);
      
      return {
        success: true,
        ojs_code: ojsCode,
        iframe_variable: iframeVar,
        placeholder_replaced: placeholder_string
      };
    } catch (error) {
      this.error(`Failed to create dynamic iframe: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  OjsTransposeData,
  OjsCreateDropdownMenu,
  OjsDynamicIframeUpdate
};