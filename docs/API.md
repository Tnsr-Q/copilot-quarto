# API Reference

## CopilotQuarto Class

Main class for executing copilot-quarto tools.

### Constructor
```javascript
const copilot = new CopilotQuarto();
```

### Methods

#### execute(toolName, params)
Execute a tool by name with given parameters.

**Parameters:**
- `toolName` (string) - Name of the tool to execute
- `params` (object) - Parameters for the tool

**Returns:** Promise<Object> - Tool execution result

**Example:**
```javascript
const result = await copilot.execute('quarto_create_project_with_renv_and_git', {
  project_directory_name: 'my-project',
  create_git_repo: true,
  use_renv: false
});
```

#### getAvailableTools()
Get list of all available tool names.

**Returns:** Array<string>

#### validateImplementation()
Check which tools are implemented vs defined.

**Returns:** Object with validation details

## Tool Reference

### Project Management Tools

#### quarto_create_project_with_renv_and_git

Create a new Quarto project with optional renv and git initialization.

**Parameters:**
- `project_directory_name` (string, required) - Project folder name
- `create_git_repo` (boolean, required) - Initialize git repository
- `use_renv` (boolean, required) - Initialize renv for R packages

**Returns:**
```javascript
{
  success: true,
  project_path: "/absolute/path/to/project",
  message: "Project created successfully"
}
```

#### quarto_configure_site_yml

Configure _quarto.yml site settings.

**Parameters:**
- `quarto_yml_path` (string, required) - Path to _quarto.yml
- `project_type` (string, required) - Project type (website, book, etc.)
- `output_dir` (string, optional) - Output directory (default: "_site")
- `navigation_type` (string, optional) - Navigation type (navbar, sidebar)
- `pages_list` (array, optional) - List of page files
- `theme_config` (string, optional) - Theme configuration

### Dashboard Tools

#### quarto_define_dashboard_format

Convert QMD file to dashboard format.

**Parameters:**
- `qmd_file_path` (string, required) - Path to QMD file
- `format_type` (string, optional) - Format type (default: "dashboard")

#### quarto_define_dashboard_layout

Define dashboard layout structure.

**Parameters:**
- `qmd_file_path` (string, required) - Path to QMD file
- `layout_structure` (object, required) - Layout configuration
- `orientation` (string, optional) - Layout orientation (default: "columns")

**Layout Structure Example:**
```javascript
{
  columns: [
    {
      width: 12,
      rows: [
        { height: 1 },
        { height: 4 }
      ]
    }
  ]
}
```

### R Package Tools

#### r_package_renv_install_package

Install R package using renv.

**Parameters:**
- `package_name` (string, required) - Name of R package to install

#### r_package_renv_snapshot

Create renv snapshot of current packages.

**Parameters:** None

### GitHub Tools

#### github_create_repository

Create new GitHub repository.

**Parameters:**
- `repository_name` (string, required) - Repository name
- `visibility` (string, required) - "public" or "private"

**Environment Variables:**
- `GITHUB_TOKEN` - GitHub personal access token

#### git_push_project

Push local project to GitHub repository.

**Parameters:**
- `local_project_path` (string, required) - Local project directory
- `github_repo_url` (string, required) - GitHub repository URL

#### github_actions_configure_publishing_workflow

Create GitHub Actions workflow for publishing.

**Parameters:**
- `workflow_file_path` (string, required) - Path for workflow file
- `quarto_docs_workflow_content` (string, optional) - Custom workflow content

### OpenAI Tools

#### openai_generate_theme_recommendations

Generate theme recommendations using OpenAI.

**Parameters:**
- `api_key` (string, required) - OpenAI API key
- `user_theme_input` (string, required) - Theme description
- `output_format` (string, optional) - Output format (default: "JSON")

**Returns:**
```javascript
{
  success: true,
  theme_data: {
    font_family: "JetBrains Mono",
    primary_color: "#00d4ff",
    secondary_color: "#1a1a2e", 
    accent_color: "#ff006e"
  }
}
```

#### openai_generate_image

Generate image using DALL-E.

**Parameters:**
- `api_key` (string, required) - OpenAI API key
- `prompt` (string, required) - Image description
- `output_file_path` (string, required) - Where to save image

#### quarto_generate_custom_scss

Generate custom SCSS theme file.

**Parameters:**
- `target_folder` (string, required) - Target directory
- `font_family` (string, required) - Font family name
- `primary_color` (string, required) - Primary color hex
- `secondary_color` (string, required) - Secondary color hex
- `accent_color` (string, required) - Accent color hex

### Utility Tools

#### chatgpt_generate_cron_expression

Generate cron expression from natural language.

**Parameters:**
- `natural_language_time_description` (string, required) - Time description
- `time_zone` (string, optional) - Timezone for conversion

**Example:**
```javascript
await copilot.execute('chatgpt_generate_cron_expression', {
  natural_language_time_description: 'every day at 8 AM',
  time_zone: 'Eastern Daylight Time'
});
// Returns: { cron_expression: '0 13 * * *' }
```

## Error Handling

All tools return a consistent result format:

**Success:**
```javascript
{
  success: true,
  // ... tool-specific data
  message: "Operation completed successfully"
}
```

**Error:**
Tools throw errors with descriptive messages. Wrap calls in try-catch:

```javascript
try {
  const result = await copilot.execute('tool_name', params);
  console.log('Success:', result);
} catch (error) {
  console.error('Tool failed:', error.message);
}
```

## Validation

All tools validate parameters before execution:

```javascript
const validation = tool.validateParams(params);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
}
```