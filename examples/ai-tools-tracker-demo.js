#!/usr/bin/env node

/**
 * Demo script showing how to create an AI Tools Tracker dashboard
 * using the copilot-quarto tools
 */

const CopilotQuarto = require('../src/index');
const path = require('path');
const fs = require('fs-extra');

async function createAIToolsTracker() {
  const copilot = new CopilotQuarto();
  
  console.log('🚀 Creating AI Tools Tracker Dashboard...\n');
  
  try {
    // Step 1: Create project with renv and git
    console.log('Step 1: Creating Quarto project...');
    const projectResult = await copilot.execute('quarto_create_project_with_renv_and_git', {
      project_directory_name: 'ai-tools-tracker',
      create_git_repo: true,
      use_renv: false // Skip renv for demo to avoid R dependency
    });
    console.log('✅ Project created\n');
    
    const projectPath = projectResult.project_path;
    
    // Step 2: Convert to dashboard format
    console.log('Step 2: Converting to dashboard format...');
    await copilot.execute('quarto_define_dashboard_format', {
      qmd_file_path: path.join(projectPath, 'index.qmd'),
      format_type: 'dashboard'
    });
    console.log('✅ Dashboard format configured\n');
    
    // Step 3: Define dashboard layout
    console.log('Step 3: Setting up dashboard layout...');
    await copilot.execute('quarto_define_dashboard_layout', {
      qmd_file_path: path.join(projectPath, 'index.qmd'),
      orientation: 'columns',
      layout_structure: {
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
    });
    console.log('✅ Dashboard layout configured\n');
    
    // Step 4: Generate theme (demo without OpenAI)
    console.log('Step 4: Generating custom theme...');
    await copilot.execute('quarto_generate_custom_scss', {
      target_folder: projectPath,
      font_family: 'JetBrains Mono',
      primary_color: '#00d4ff',
      secondary_color: '#1a1a2e',
      accent_color: '#ff006e'
    });
    console.log('✅ Cyberpunk theme generated\n');
    
    // Step 5: Configure site settings
    console.log('Step 5: Configuring site settings...');
    await copilot.execute('quarto_configure_site_yml', {
      quarto_yml_path: path.join(projectPath, '_quarto.yml'),
      project_type: 'website',
      output_dir: '_site',
      navigation_type: 'navbar',
      pages_list: ['index.qmd'],
      theme_config: '[cosmo, custom.scss]'
    });
    console.log('✅ Site configuration updated\n');
    
    // Step 6: Create GitHub Actions workflow
    console.log('Step 6: Setting up GitHub Actions...');
    await copilot.execute('github_actions_configure_publishing_workflow', {
      workflow_file_path: path.join(projectPath, '.github/workflows/publish.yml')
    });
    console.log('✅ GitHub Actions workflow created\n');
    
    // Step 7: Add cron schedule
    console.log('Step 7: Adding daily schedule...');
    const cronResult = await copilot.execute('chatgpt_generate_cron_expression', {
      natural_language_time_description: 'every day at 8 AM',
      time_zone: 'Eastern Daylight Time'
    });
    
    await copilot.execute('github_actions_schedule_workflow', {
      workflow_yml_path: path.join(projectPath, '.github/workflows/publish.yml'),
      cron_expression: cronResult.cron_expression
    });
    console.log(`✅ Scheduled to run daily at ${cronResult.cron_expression}\n`);
    
    // Step 8: Create AI repo fetching R script
    console.log('Step 8: Creating data fetching script...');
    const fetchScript = `library(httr2)
library(jsonlite)
library(dplyr)

# Fetch trending AI repositories from GitHub
res <- request("https://api.github.com/search/repositories") %>%
  req_url_query(
    q = "AI language:python OR machine learning OR artificial intelligence", 
    sort = "updated", 
    per_page = 50
  ) %>%
  req_perform() %>%
  resp_body_json()

# Extract relevant data
ai_repos <- res$items %>% 
  select(full_name, html_url, description, stargazers_count, updated_at) %>%
  arrange(desc(stargazers_count))

# Make data available to OJS
ojs_define(ai_repos)`;
    
    fs.writeFileSync(path.join(projectPath, 'fetch_github.R'), fetchScript);
    console.log('✅ Data fetching script created\n');
    
    // Step 9: Add OJS interactive components
    console.log('Step 9: Adding interactive components...');
    const ojsChunk = await copilot.execute('quarto_define_ojs_chunk', {
      ojs_code_content: `
viewof repo_select = Inputs.select(
  ai_repos.map(d => d.full_name), 
  {label: "Select AI Repository", unique: true}
)

selectedRepo = ai_repos.find(d => d.full_name === repo_select)

html\`<div class="repo-info">
  <h3>\${selectedRepo.full_name}</h3>
  <p>\${selectedRepo.description}</p>
  <p>⭐ \${selectedRepo.stargazers_count} stars</p>
  <a href="\${selectedRepo.html_url}" target="_blank">View on GitHub</a>
</div>\``,
      chunk_options: 'echo: false'
    });
    console.log('✅ Interactive components ready\n');
    
    // Step 10: Update index.qmd with full dashboard content
    console.log('Step 10: Updating dashboard content...');
    const dashboardContent = `---
title: "AI Tools Tracker"
format: dashboard
orientation: columns
logo: images/ai-logo.png
layout:
  columns:
    - width: 12
      rows:
        - height: 1
        - height: 4
---

# 🤖 AI Tools Tracker

Track the latest and greatest AI tools and repositories from GitHub.

\`\`\`{r}
#| echo: false
#| warning: false
#| message: false

${fetchScript}
\`\`\`

## Interactive Repository Explorer

${ojsChunk.chunk_content}

## README Preview

\`\`\`{ojs}
//| echo: false
readme_url = \`https://raw.githubusercontent.com/\${repo_select}/main/README.md\`
\`\`\`

<iframe id="readme-frame" width="100%" height="600px" style="border:1px solid #00d4ff; border-radius: 8px;"></iframe>

\`\`\`{ojs}
//| echo: false
{
  const frame = document.getElementById('readme-frame');
  if (frame && repo_select) {
    frame.src = \`https://raw.githubusercontent.com/\${repo_select}/main/README.md\`;
  }
}
\`\`\`
`;
    
    fs.writeFileSync(path.join(projectPath, 'index.qmd'), dashboardContent);
    console.log('✅ Dashboard content updated\n');
    
    // Create images directory and placeholder
    fs.ensureDirSync(path.join(projectPath, 'images'));
    const placeholderSvg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#1a1a2e"/>
  <text x="50" y="50" text-anchor="middle" fill="#00d4ff" font-family="monospace" font-size="12">AI</text>
</svg>`;
    fs.writeFileSync(path.join(projectPath, 'images/ai-logo.svg'), placeholderSvg);
    
    console.log('🎉 AI Tools Tracker Dashboard Created Successfully!');
    console.log(`📁 Project location: ${projectPath}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Install R and required packages (httr2, jsonlite, dplyr)');
    console.log('2. Install Quarto: https://quarto.org/docs/get-started/');
    console.log('3. Run: quarto render (to build the dashboard)');
    console.log('4. Run: quarto preview (to preview locally)');
    console.log('5. Push to GitHub and enable GitHub Pages for hosting');
    console.log('');
    console.log('🌟 Features included:');
    console.log('- ✅ Cyberpunk neon theme');
    console.log('- ✅ Daily auto-refresh via GitHub Actions');
    console.log('- ✅ Interactive repository selector');
    console.log('- ✅ README preview iframe');
    console.log('- ✅ GitHub Pages deployment ready');
    
  } catch (error) {
    console.error('❌ Error creating AI Tools Tracker:', error.message);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  createAIToolsTracker();
}

module.exports = createAIToolsTracker;