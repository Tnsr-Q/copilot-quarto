# Copilot Quarto

A GitHub Copilot extension that provides specialized tools for creating and managing Quarto dashboards, websites, and projects. This extension enables autonomous creation of fully-hosted, self-updating dashboards with AI-generated themes and dynamic content.

## Features

### Project Management
- **Project Scaffolding**: Create new Quarto projects with renv and git initialization
- **Dependency Management**: Install and manage R packages with renv snapshots
- **Git Integration**: Initialize repositories and push to GitHub

### Dashboard Creation
- **Dashboard Formatting**: Convert QMD files to dashboard format
- **Layout Configuration**: Define complex dashboard layouts with rows and columns
- **Logo Integration**: Add custom logos to dashboard headers

### Theming & Styling
- **AI-Generated Themes**: Use OpenAI to generate custom color palettes and fonts
- **SCSS Generation**: Create custom stylesheets based on theme specifications
- **Theme Application**: Apply themes to Quarto projects

### GitHub Integration
- **Repository Creation**: Create new GitHub repositories
- **GitHub Actions**: Set up automated publishing workflows
- **GitHub Pages**: Configure deployment and hosting
- **Secrets Management**: Manage repository secrets for API keys

### OpenAI Integration
- **Theme Generation**: Generate color palettes and font recommendations
- **Image Generation**: Create logos and graphics using DALL-E
- **Cron Expression Generation**: Convert natural language to cron schedules

### Interactive Components
- **Observable JavaScript**: Add interactive OJS components
- **Dynamic Iframes**: Create responsive iframe content
- **Dropdown Menus**: Build interactive selection interfaces

## Tool Definitions

This extension defines 30+ specialized tools for Quarto development, as specified in `.github/copilot-tools.json`.

## Example Use Case: AI Tools Tracker Dashboard

The tools in this extension can be used to create a fully-automated AI Tools Tracker dashboard that:
- Lists the newest 50 trending AI repositories on GitHub
- Updates daily at 8:00 AM ET via GitHub Actions
- Allows users to select repos from a dropdown to view README content
- Uses an AI-generated "Cyberpunk Neon" theme
- Is hosted on GitHub Pages
- Includes reproducible dependency management with renv

## Installation and Usage

[Implementation details to be added]

## Contributing

[Contributing guidelines to be added]

## License

[License information to be added]