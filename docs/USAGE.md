# Copilot Quarto - Usage Guide

This guide shows how to use the copilot-quarto tools to create sophisticated Quarto dashboards.

## Quick Start

```bash
# Install dependencies
npm install

# Run the tool status check
node src/index.js

# Create an AI Tools Tracker dashboard (demo)
node examples/ai-tools-tracker-demo.js
```

## Available Tools (21/44 implemented)

### Project Management
- ✅ `quarto_create_project_with_renv_and_git` - Create new Quarto project
- ✅ `quarto_configure_site_yml` - Configure site settings
- ✅ `quarto_render_local` - Render project locally
- ✅ `quarto_create_gitignore` - Create gitignore file

### Dashboard Creation
- ✅ `quarto_define_dashboard_format` - Convert QMD to dashboard
- ✅ `quarto_define_dashboard_layout` - Configure dashboard layout
- ✅ `quarto_add_dashboard_logo` - Add logo to dashboard
- ✅ `quarto_define_ojs_chunk` - Add Observable JS components

### R Package Management
- ✅ `r_package_renv_install_package` - Install R packages
- ✅ `r_package_renv_snapshot` - Create renv snapshot
- ✅ `r_package_renv_status` - Check renv status

### GitHub Integration
- ✅ `github_create_repository` - Create GitHub repo
- ✅ `git_push_project` - Push project to GitHub
- ✅ `github_create_gh_pages_branch` - Create gh-pages branch
- ✅ `github_actions_configure_publishing_workflow` - Setup Actions
- ✅ `github_actions_schedule_workflow` - Add cron scheduling
- ✅ `github_pages_configure_deployment_source` - Configure Pages

### Theming & AI
- ✅ `openai_generate_theme_recommendations` - AI theme generation
- ✅ `openai_generate_image` - Generate images with DALL-E
- ✅ `quarto_generate_custom_scss` - Create custom themes

### Utilities
- ✅ `chatgpt_generate_cron_expression` - Generate cron schedules

## Usage Examples

### Create a Basic Project
```javascript
const copilot = new CopilotQuarto();

await copilot.execute('quarto_create_project_with_renv_and_git', {
  project_directory_name: 'my-dashboard',
  create_git_repo: true,
  use_renv: true
});
```

### Convert to Dashboard
```javascript
await copilot.execute('quarto_define_dashboard_format', {
  qmd_file_path: 'my-dashboard/index.qmd',
  format_type: 'dashboard'
});
```

### Generate AI Theme
```javascript
const theme = await copilot.execute('openai_generate_theme_recommendations', {
  api_key: process.env.OPENAI_API_KEY,
  user_theme_input: 'Cyberpunk Neon with dark blues, hot pinks and terminal green'
});

await copilot.execute('quarto_generate_custom_scss', {
  target_folder: 'my-dashboard',
  font_family: theme.theme_data.font_family,
  primary_color: theme.theme_data.primary_color,
  secondary_color: theme.theme_data.secondary_color,
  accent_color: theme.theme_data.accent_color
});
```

### Setup GitHub Integration
```javascript
// Create repository
const repo = await copilot.execute('github_create_repository', {
  repository_name: 'my-dashboard',
  visibility: 'public'
});

// Push project
await copilot.execute('git_push_project', {
  local_project_path: 'my-dashboard',
  github_repo_url: repo.clone_url
});

// Setup automated publishing
await copilot.execute('github_actions_configure_publishing_workflow', {
  workflow_file_path: 'my-dashboard/.github/workflows/publish.yml'
});
```

## Environment Variables

For full functionality, set these environment variables:

```bash
# For GitHub integration
export GITHUB_TOKEN="your_github_token"

# For OpenAI features
export OPENAI_API_KEY="your_openai_key"
```

## Dependencies

- Node.js 16+
- Git
- R (optional, for renv features)
- Quarto (for rendering)

## AI Tools Tracker Demo

The included demo creates a complete dashboard that:
- Fetches trending AI repositories from GitHub
- Updates daily via GitHub Actions
- Uses a cyberpunk neon theme
- Includes interactive components
- Deploys to GitHub Pages

Run with: `node examples/ai-tools-tracker-demo.js`

## Coming Soon

Additional tools being implemented:
- OJS data manipulation tools
- More GitHub Actions features
- R environment management
- Iframe embedding tools
- Content management tools

## Contributing

See the main README.md for contributing guidelines.