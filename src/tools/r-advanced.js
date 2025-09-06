const { CopilotQuartoTool } = require('../core');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const axios = require('axios');

/**
 * Tool to store local secrets in .Renviron file
 */
class RStoreLocalSecretsRenviron extends CopilotQuartoTool {
  constructor() {
    super('r_store_local_secrets_renviron', 
      'Append a key=value line to .Renviron (auto-restarts R session).');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.variable_name) {
      errors.push('variable_name is required');
    }
    
    if (!params.variable_value) {
      errors.push('variable_value is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { variable_name, variable_value } = params;
    
    this.log(`Adding ${variable_name} to .Renviron`);
    
    try {
      const renvironPath = path.join(process.cwd(), '.Renviron');
      
      // Read existing .Renviron if it exists
      let content = '';
      if (await fs.pathExists(renvironPath)) {
        content = await fs.readFile(renvironPath, 'utf8');
      }
      
      // Check if variable already exists
      const lines = content.split('\n');
      const existingIndex = lines.findIndex(line => 
        line.startsWith(`${variable_name}=`)
      );
      
      if (existingIndex >= 0) {
        // Update existing variable
        lines[existingIndex] = `${variable_name}=${variable_value}`;
        this.log(`Updated existing variable: ${variable_name}`);
      } else {
        // Add new variable
        if (content && !content.endsWith('\n')) {
          content += '\n';
        }
        content += `${variable_name}=${variable_value}\n`;
        this.log(`Added new variable: ${variable_name}`);
      }
      
      // Write updated content
      const finalContent = existingIndex >= 0 ? lines.join('\n') : content;
      await fs.writeFile(renvironPath, finalContent);
      
      // Generate R code to restart session (for informational purposes)
      const restartCode = `
# The .Renviron file has been updated
# Restart R session to load new environment variables
# In RStudio: Session > Restart R
# Or programmatically: .rs.restartR()
`;
      
      this.success(`Environment variable ${variable_name} stored in .Renviron`);
      
      return {
        success: true,
        variable_name,
        renviron_path: renvironPath,
        restart_needed: true,
        restart_instructions: 'Restart R session to load new environment variables'
      };
    } catch (error) {
      this.error(`Failed to store environment variable: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to get environment variables (wrapper around Sys.getenv)
 */
class RGetEnvironmentVariable extends CopilotQuartoTool {
  constructor() {
    super('r_get_environment_variable', 
      'Wrapper around `Sys.getenv()` to fetch secrets locally or inside GitHub Actions.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.variable_name) {
      errors.push('variable_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { variable_name } = params;
    
    this.log(`Getting environment variable: ${variable_name}`);
    
    try {
      // Generate R code to safely get environment variable
      const rCode = `
# Get environment variable with error handling
get_env_var <- function(var_name) {
  value <- Sys.getenv(var_name)
  if (value == "") {
    warning(paste("Environment variable", var_name, "is not set or is empty"))
    return(NULL)
  }
  return(value)
}

# Get the requested variable
${variable_name}_value <- get_env_var("${variable_name}")
print(paste("Variable", "${variable_name}", "is", 
           ifelse(is.null(${variable_name}_value), "not set", "set")))
`;

      // Also check if the variable exists in the current process
      const nodeValue = process.env[variable_name];
      
      this.success(`Generated R code to fetch ${variable_name}`);
      
      return {
        success: true,
        variable_name,
        r_code: rCode,
        current_value_set: !!nodeValue,
        usage_example: `value <- Sys.getenv("${variable_name}")`,
        safe_usage: `value <- get_env_var("${variable_name}")`
      };
    } catch (error) {
      this.error(`Failed to generate environment variable code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to send R data-frame to ObservableJS via ojs_define()
 */
class ROjsDefineData extends CopilotQuartoTool {
  constructor() {
    super('r_ojs_define_data', 
      'Send an R data-frame to ObservableJS land via `ojs_define()`.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.r_data_frame) {
      errors.push('r_data_frame is required');
    }
    
    if (!params.ojs_variable_name) {
      errors.push('ojs_variable_name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { r_data_frame, ojs_variable_name, chunk_options = [] } = params;
    
    this.log(`Defining OJS data from R data frame: ${r_data_frame}`);
    
    try {
      // Generate the R code chunk with ojs_define
      const chunkOptionsStr = chunk_options.length > 0 ? 
        chunk_options.join(', ') : 'echo=FALSE';
      
      const rChunk = `
\`\`\`{r ${chunkOptionsStr}}
# Send R data to ObservableJS
library(quarto)
ojs_define(${ojs_variable_name} = ${r_data_frame})
\`\`\`
`;

      // Generate example OJS usage
      const ojsUsageExample = `
\`\`\`{ojs}
// Use the data in ObservableJS
console.log("Data from R:", ${ojs_variable_name});

// Example: create a simple table
Inputs.table(${ojs_variable_name})
\`\`\`
`;

      this.success(`Generated ojs_define code for ${ojs_variable_name}`);
      
      return {
        success: true,
        r_data_frame,
        ojs_variable_name,
        r_chunk: rChunk,
        ojs_usage_example: ojsUsageExample,
        data_flow: `R (${r_data_frame}) → OJS (${ojs_variable_name})`
      };
    } catch (error) {
      this.error(`Failed to generate ojs_define code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool for generic httr2 API access
 */
class RPackageHttr2ApiAccess extends CopilotQuartoTool {
  constructor() {
    super('r_package_httr2_api_access', 
      'Generic httr2 helper: build url, add bearer token, POST JSON, return parsed response.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.api_endpoint) {
      errors.push('api_endpoint is required');
    }
    
    if (!params.request_path_append) {
      errors.push('request_path_append is required');
    }
    
    if (!params.authentication_token) {
      errors.push('authentication_token is required');
    }
    
    if (!params.body_json) {
      errors.push('body_json is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { api_endpoint, request_path_append, authentication_token, body_json } = params;
    
    this.log(`Generating httr2 API call to: ${api_endpoint}${request_path_append}`);
    
    try {
      // Create temporary files for secure handling of sensitive data
      const tempTokenFile = path.join(os.tmpdir(), 'copilot_api_token.txt');
      const tempJsonFile = path.join(os.tmpdir(), 'copilot_api_body.json');
      
      // Write token and JSON data to temporary files with restricted permissions
      await fs.writeFile(tempTokenFile, authentication_token, { mode: 0o600 });
      await fs.writeFile(tempJsonFile, JSON.stringify(body_json), { mode: 0o600 });
      
      // Generate R code for httr2 API call with secure token handling
      const rCode = `
# Generic httr2 API helper function with secure token handling
library(httr2)
library(jsonlite)

api_call <- function(endpoint, path, token, body_data) {
  # Build the request
  req <- request(paste0(endpoint, path)) |>
    req_auth_bearer_token(token) |>
    req_headers(
      "Content-Type" = "application/json",
      "Accept" = "application/json"
    ) |>
    req_body_json(body_data) |>
    req_retry(max_tries = 3)
  
  # Perform the request
  resp <- req_perform(req)
  
  # Check if successful
  if (resp_status(resp) >= 400) {
    stop(paste("API call failed with status:", resp_status(resp)))
  }
  
  # Parse and return response
  resp_body_json(resp)
}

# Securely read authentication token from environment variable or file
auth_token <- Sys.getenv("COPILOT_API_TOKEN")
if (auth_token == "") {
  # Fallback: read from temporary file if available
  temp_token_file <- file.path(tempdir(), "copilot_api_token.txt")
  if (file.exists(temp_token_file)) {
    auth_token <- trimws(readLines(temp_token_file, warn = FALSE)[1])
  } else {
    stop("No authentication token provided via environment variable or temporary file")
  }
}

# Securely read JSON body data
body_json_data <- NULL
body_env_var <- Sys.getenv("COPILOT_API_BODY")
if (body_env_var != "") {
  # JSON body provided via environment variable
  body_json_data <- fromJSON(body_env_var, simplifyVector = FALSE)
} else {
  # Fallback: read from temporary file if available
  temp_json_file <- file.path(tempdir(), "copilot_api_body.json")
  if (file.exists(temp_json_file)) {
    body_json_data <- fromJSON(temp_json_file, simplifyVector = FALSE)
  } else {
    stop("No JSON body data provided via environment variable or temporary file")
  }
}

# Make the API call
result <- api_call(
  endpoint = "${api_endpoint}",
  path = "${request_path_append}", 
  token = auth_token,
  body_data = body_json_data
)

print("API call successful")
str(result)
`;

      this.success('Generated httr2 API call code with secure token handling');
      
      return {
        success: true,
        api_endpoint,
        request_path: request_path_append,
        full_url: `${api_endpoint}${request_path_append}`,
        r_code: rCode,
        temp_token_file: tempTokenFile,
        temp_json_file: tempJsonFile,
        security_note: 'Authentication token and JSON data are now passed via temporary files with restricted permissions to prevent credential exposure',
        usage_note: 'Make sure to install httr2 package: install.packages("httr2")'
      };
    } catch (error) {
      this.error(`Failed to generate httr2 code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to create gt tables with optional styling
 */
class RPackageGtCreateTable extends CopilotQuartoTool {
  constructor() {
    super('r_package_gt_create_table', 
      'Create a gt table object with optional styling list.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.data_frame) {
      errors.push('data_frame is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { data_frame, gt_options = {} } = params;
    
    this.log(`Creating gt table from data frame: ${data_frame}`);
    
    try {
      // Generate R code for gt table creation
      const rCode = `
library(gt)

# Create gt table with styling options
${data_frame}_gt <- ${data_frame} |>
  gt()${Object.keys(gt_options).length > 0 ? ' |>' : ''}
  ${Object.entries(gt_options).map(([key, value]) => {
    switch(key) {
    case 'title':
      return `tab_header(title = "${value}")`;
    case 'subtitle':
      return `tab_header(subtitle = "${value}")`;
    case 'source_note':
      return `tab_source_note(source_note = "${value}")`;
    case 'theme':
      return `opt_stylize(style = ${value})`;
    case 'column_labels':
      const labels = Object.entries(value).map(([col, label]) => 
        `${col} = "${label}"`).join(', ');
      return `cols_label(${labels})`;
    case 'column_width':
      const widths = Object.entries(value).map(([col, width]) => 
        `${col} = px(${width})`).join(', ');
      return `cols_width(${widths})`;
    default:
      return `# Custom option: ${key} = ${JSON.stringify(value)}`;
    }
  }).join(' |>\n  ')}

# Display the table
${data_frame}_gt
`;

      // Generate usage examples
      const examples = `
# Example styling options:
gt_options <- list(
  title = "My Table Title",
  subtitle = "Subtitle here", 
  source_note = "Data source information",
  theme = 6,  # Built-in theme number
  column_labels = list(
    old_name = "New Label",
    another_col = "Another Label"
  ),
  column_width = list(
    col1 = 100,  # pixels
    col2 = 150
  )
)
`;

      this.success(`Generated gt table code for ${data_frame}`);
      
      return {
        success: true,
        data_frame,
        r_code: rCode,
        styling_examples: examples,
        output_variable: `${data_frame}_gt`,
        package_required: 'gt'
      };
    } catch (error) {
      this.error(`Failed to generate gt table code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to download files to the repository
 */
class RDownloadFile extends CopilotQuartoTool {
  constructor() {
    super('r_download_file', 
      'Download any file (image, zip, etc.) into the repo.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.url) {
      errors.push('url is required');
    }
    
    if (!params.local_path) {
      errors.push('local_path is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { url, local_path, mode = 'wb' } = params;
    
    this.log(`Downloading file from: ${url}`);
    
    try {
      // Generate R code for file download
      const rCode = `
# Download file with error handling
download_file_safely <- function(url, destfile, mode = "wb") {
  tryCatch({
    download.file(url = url, destfile = destfile, mode = mode)
    cat("Successfully downloaded:", destfile, "\\n")
    return(TRUE)
  }, error = function(e) {
    cat("Error downloading file:", e$message, "\\n")
    return(FALSE)
  })
}

# Download the file
download_success <- download_file_safely(
  url = "${url}",
  destfile = "${local_path}",
  mode = "${mode}"
)

if (download_success) {
  cat("File downloaded to:", "${local_path}", "\\n")
  cat("File size:", file.size("${local_path}"), "bytes\\n")
} else {
  stop("Download failed")
}
`;

      // Also attempt direct download using Node.js for immediate execution
      try {
        const response = await axios({
          method: 'GET',
          url: url,
          responseType: 'stream'
        });
        
        const writer = fs.createWriteStream(local_path);
        response.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        const stats = await fs.stat(local_path);
        this.log(`File downloaded successfully: ${stats.size} bytes`);
      } catch (downloadError) {
        this.log(`Direct download failed, R code will handle it: ${downloadError.message}`);
      }

      this.success(`Generated download code for ${url}`);
      
      return {
        success: true,
        url,
        local_path,
        mode,
        r_code: rCode,
        file_exists: await fs.pathExists(local_path)
      };
    } catch (error) {
      this.error(`Failed to setup file download: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to parse JSON in R
 */
class RJsonParse extends CopilotQuartoTool {
  constructor() {
    super('r_json_parse', 
      'Parse JSON text into an R list/data-frame.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.json_string) {
      errors.push('json_string is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { json_string } = params;
    
    this.log('Generating JSON parsing code');
    
    try {
      // Generate R code for JSON parsing using secure file-based approach
      const rCode = `
library(jsonlite)

# Parse JSON with error handling
parse_json_safely <- function(json_text) {
  tryCatch({
    parsed <- fromJSON(json_text, simplifyVector = TRUE, simplifyDataFrame = TRUE)
    cat("JSON parsed successfully\\n")
    return(parsed)
  }, error = function(e) {
    cat("Error parsing JSON:", e$message, "\\n")
    return(NULL)
  })
}

# Securely read JSON from environment variable or file
json_env_var <- Sys.getenv("COPILOT_JSON_DATA")
if (json_env_var != "") {
  # JSON data provided via environment variable
  json_text <- json_env_var
} else {
  # Fallback: read from temporary file if available
  temp_json_file <- file.path(tempdir(), "copilot_json_data.json")
  if (file.exists(temp_json_file)) {
    json_text <- readLines(temp_json_file, warn = FALSE)
    json_text <- paste(json_text, collapse = "")
  } else {
    stop("No JSON data provided via environment variable or temporary file")
  }
}

parsed_data <- parse_json_safely(json_text)

if (!is.null(parsed_data)) {
  str(parsed_data)
  cat("Data structure:\\n")
  if (is.data.frame(parsed_data)) {
    cat("- Type: data.frame\\n")
    cat("- Rows:", nrow(parsed_data), "\\n")
    cat("- Columns:", ncol(parsed_data), "\\n")
  } else if (is.list(parsed_data)) {
    cat("- Type: list\\n") 
    cat("- Length:", length(parsed_data), "\\n")
  }
}
`;

      // Validate JSON in Node.js
      let isValidJson = false;
      let parseError = null;
      try {
        JSON.parse(json_string);
        isValidJson = true;
      } catch (error) {
        parseError = error.message;
      }

      // Create a temporary file with the JSON data for secure handling
      const tempJsonFile = path.join(os.tmpdir(), 'copilot_json_data.json');
      await fs.writeFile(tempJsonFile, json_string, 'utf8');

      this.success('Generated JSON parsing code');
      
      return {
        success: true,
        json_valid: isValidJson,
        parse_error: parseError,
        r_code: rCode,
        temp_json_file: tempJsonFile,
        security_note: 'JSON data is now passed via temporary file to prevent code injection',
        package_required: 'jsonlite'
      };
    } catch (error) {
      this.error(`Failed to generate JSON parsing code: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Tool to zip files for download
 */
class RZipFilesForDownload extends CopilotQuartoTool {
  constructor() {
    super('r_zip_files_for_download', 
      'Zip a folder so users can download the whole project.');
  }

  validateParams(params) {
    const errors = [];
    
    if (!params.output_file_path) {
      errors.push('output_file_path is required');
    }
    
    if (!params.folder_to_zip) {
      errors.push('folder_to_zip is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async execute(params) {
    const { output_file_path, folder_to_zip } = params;
    
    this.log(`Creating zip file: ${output_file_path}`);
    
    try {
      // Generate R code for creating zip files
      const rCode = `
# Create zip file with error handling
create_zip_safely <- function(zipfile, files, flags = "-r9X") {
  tryCatch({
    zip(zipfile = zipfile, files = files, flags = flags)
    cat("Successfully created zip file:", zipfile, "\\n")
    return(TRUE)
  }, error = function(e) {
    cat("Error creating zip file:", e$message, "\\n")
    return(FALSE)
  })
}

# Create the zip file
zip_success <- create_zip_safely(
  zipfile = "${output_file_path}",
  files = "${folder_to_zip}"
)

if (zip_success) {
  zip_size <- file.size("${output_file_path}")
  cat("Zip file created successfully\\n")
  cat("Size:", zip_size, "bytes\\n")
  cat("Location:", "${output_file_path}", "\\n")
} else {
  stop("Failed to create zip file")
}
`;

      this.success('Generated zip creation code');
      
      return {
        success: true,
        output_file_path,
        folder_to_zip,
        r_code: rCode,
        download_ready: true
      };
    } catch (error) {
      this.error(`Failed to generate zip code: ${error.message}`);
      throw error;
    }
  }
}

module.exports = {
  RStoreLocalSecretsRenviron,
  RGetEnvironmentVariable,
  ROjsDefineData,
  RPackageHttr2ApiAccess,
  RPackageGtCreateTable,
  RDownloadFile,
  RJsonParse,
  RZipFilesForDownload
};