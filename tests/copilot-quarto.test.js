const CopilotQuarto = require('../src/index');
const fs = require('fs-extra');
const path = require('path');

describe('CopilotQuarto', () => {
  let copilot;
  let testDir;

  beforeEach(() => {
    copilot = new CopilotQuarto();
    testDir = path.join(__dirname, 'test-projects');
    fs.ensureDirSync(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.removeSync(testDir);
    }
  });

  describe('Core functionality', () => {
    test('should initialize with available tools', () => {
      const tools = copilot.getAvailableTools();
      expect(tools).toContain('quarto_create_project_with_renv_and_git');
      expect(tools).toContain('quarto_define_dashboard_format');
      expect(tools.length).toBeGreaterThan(0);
    });

    test('should validate implementation status', () => {
      const validation = copilot.validateImplementation();
      expect(validation).toHaveProperty('allImplemented');
      expect(validation).toHaveProperty('missing');
      expect(validation).toHaveProperty('implemented');
      expect(validation.implemented).toBeGreaterThan(0);
    });
  });

  describe('Project creation', () => {
    test('should create a basic Quarto project', async () => {
      const projectName = 'test-basic-project';
      const projectPath = path.join(testDir, projectName);

      const result = await copilot.execute('quarto_create_project_with_renv_and_git', {
        project_directory_name: projectPath,
        create_git_repo: true,
        use_renv: false
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(projectPath)).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'index.qmd'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, '_quarto.yml'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, '.git'))).toBe(true);
    });

    test('should fail with invalid parameters', async () => {
      await expect(
        copilot.execute('quarto_create_project_with_renv_and_git', {
          // Missing required parameters
        })
      ).rejects.toThrow();
    });
  });

  describe('Dashboard configuration', () => {
    let projectPath;

    beforeEach(async () => {
      projectPath = path.join(testDir, 'dashboard-test');
      await copilot.execute('quarto_create_project_with_renv_and_git', {
        project_directory_name: projectPath,
        create_git_repo: false,
        use_renv: false
      });
    });

    test('should convert QMD to dashboard format', async () => {
      const qmdPath = path.join(projectPath, 'index.qmd');
      
      const result = await copilot.execute('quarto_define_dashboard_format', {
        qmd_file_path: qmdPath,
        format_type: 'dashboard'
      });

      expect(result.success).toBe(true);
      
      const content = fs.readFileSync(qmdPath, 'utf8');
      expect(content).toContain('format: dashboard');
    });

    test('should set dashboard layout', async () => {
      const qmdPath = path.join(projectPath, 'index.qmd');
      
      // First convert to dashboard
      await copilot.execute('quarto_define_dashboard_format', {
        qmd_file_path: qmdPath
      });

      // Then set layout
      const result = await copilot.execute('quarto_define_dashboard_layout', {
        qmd_file_path: qmdPath,
        orientation: 'columns',
        layout_structure: {
          columns: [{ width: 12, rows: [{ height: 1 }] }]
        }
      });

      expect(result.success).toBe(true);
      
      const content = fs.readFileSync(qmdPath, 'utf8');
      expect(content).toContain('orientation: columns');
    });
  });

  describe('Theme generation', () => {
    test('should generate custom SCSS', async () => {
      const targetDir = path.join(testDir, 'theme-test');
      fs.ensureDirSync(targetDir);

      const result = await copilot.execute('quarto_generate_custom_scss', {
        target_folder: targetDir,
        font_family: 'Inter',
        primary_color: '#007acc',
        secondary_color: '#f8f9fa',
        accent_color: '#28a745'
      });

      expect(result.success).toBe(true);
      
      const scssPath = path.join(targetDir, 'custom.scss');
      expect(fs.existsSync(scssPath)).toBe(true);
      
      const scssContent = fs.readFileSync(scssPath, 'utf8');
      expect(scssContent).toContain('Inter');
      expect(scssContent).toContain('#007acc');
      expect(scssContent).toContain('#f8f9fa');
      expect(scssContent).toContain('#28a745');
    });
  });

  describe('Site configuration', () => {
    test('should configure Quarto site YAML', async () => {
      const configDir = path.join(testDir, 'config-test');
      fs.ensureDirSync(configDir);
      const yamlPath = path.join(configDir, '_quarto.yml');

      const result = await copilot.execute('quarto_configure_site_yml', {
        quarto_yml_path: yamlPath,
        project_type: 'website',
        output_dir: '_site',
        navigation_type: 'navbar',
        pages_list: ['index.qmd', 'about.qmd'],
        theme_config: '[cosmo, custom.scss]'
      });

      expect(result.success).toBe(true);
      expect(fs.existsSync(yamlPath)).toBe(true);
      
      const content = fs.readFileSync(yamlPath, 'utf8');
      expect(content).toContain('type: website');
      expect(content).toContain('output-dir: _site');
    });
  });

  describe('Utility functions', () => {
    test('should generate cron expressions', async () => {
      const result = await copilot.execute('chatgpt_generate_cron_expression', {
        natural_language_time_description: 'every day at 8 AM',
        time_zone: 'UTC'
      });

      expect(result.success).toBe(true);
      expect(result.cron_expression).toMatch(/^\d+ \d+ \* \* \*$/);
    });

    test('should create gitignore files', async () => {
      const targetDir = path.join(testDir, 'gitignore-test');
      
      const result = await copilot.execute('quarto_create_gitignore', {
        target_folder: targetDir
      });

      expect(result.success).toBe(true);
      
      const gitignorePath = path.join(targetDir, '.gitignore');
      expect(fs.existsSync(gitignorePath)).toBe(true);
      
      const content = fs.readFileSync(gitignorePath, 'utf8');
      expect(content).toContain('.quarto/');
      expect(content).toContain('_site/');
      expect(content).toContain('renv/library/');
    });
  });

  describe('OJS integration', () => {
    test('should create OJS chunks', async () => {
      const result = await copilot.execute('quarto_define_ojs_chunk', {
        ojs_code_content: 'viewof x = Inputs.range([0, 10])',
        chunk_options: 'echo: false'
      });

      expect(result.success).toBe(true);
      expect(result.chunk_content).toContain('```{ojs}');
      expect(result.chunk_content).toContain('viewof x = Inputs.range([0, 10])');
      expect(result.chunk_content).toContain('echo: false');
    });
  });

  describe('R-advanced security features', () => {
    test('should handle JSON parsing securely without code injection', async () => {
      const testJson = '{"name": "test", "value": 123, "description": "safe data"}';
      
      const result = await copilot.execute('r_json_parse', {
        json_string: testJson
      });

      expect(result.success).toBe(true);
      expect(result.json_valid).toBe(true);
      expect(result.r_code).not.toContain('${');
      expect(result.r_code).toContain('COPILOT_JSON_DATA');
      expect(result.r_code).toContain('tempdir()');
      expect(result.security_note).toContain('prevent code injection');
      expect(fs.existsSync(result.temp_json_file)).toBe(true);
    });

    test('should prevent code injection via malicious JSON strings', async () => {
      // This would be dangerous in the old version but safe now
      const maliciousJson = '{"cmd": "\'; evil_code(); exit(1); #"}';
      
      const result = await copilot.execute('r_json_parse', {
        json_string: maliciousJson
      });

      expect(result.success).toBe(true);
      // This should be valid JSON
      expect(result.json_valid).toBe(true);
      // But importantly, the R code should NOT contain the malicious string directly
      expect(result.r_code).not.toContain('evil_code');
      expect(result.r_code).not.toContain('exit(1)');
      // The R code should use secure file-based approach
      expect(result.r_code).toContain('tempdir()');
    });

    test('should handle API calls with secure token handling', async () => {
      const testToken = 'secret_token_12345';
      const testBody = { action: 'test', data: { id: 1 } };
      
      const result = await copilot.execute('r_package_httr2_api_access', {
        api_endpoint: 'https://api.example.com',
        request_path_append: '/test',
        authentication_token: testToken,
        body_json: testBody
      });

      expect(result.success).toBe(true);
      expect(result.r_code).not.toContain(testToken);
      expect(result.r_code).toContain('COPILOT_API_TOKEN');
      expect(result.r_code).toContain('auth_token');
      expect(result.security_note).toContain('prevent credential exposure');
      expect(fs.existsSync(result.temp_token_file)).toBe(true);
      expect(fs.existsSync(result.temp_json_file)).toBe(true);
      
      // Verify token file has restricted permissions
      const tokenStats = fs.statSync(result.temp_token_file);
      expect((tokenStats.mode & 0o077)).toBe(0); // No access for group/others
    });

    test('should reject invalid JSON gracefully', async () => {
      const invalidJson = '{"name": "test", "invalid": }';
      
      const result = await copilot.execute('r_json_parse', {
        json_string: invalidJson
      });

      expect(result.success).toBe(true);
      expect(result.json_valid).toBe(false);
      expect(result.parse_error).toBeDefined();
      expect(result.r_code).toContain('parse_json_safely');
    });
  });

  describe('Error handling', () => {
    test('should handle unknown tools', async () => {
      await expect(
        copilot.execute('nonexistent_tool', {})
      ).rejects.toThrow("Tool 'nonexistent_tool' not found");
    });

    test('should validate parameters', async () => {
      await expect(
        copilot.execute('quarto_create_project_with_renv_and_git', {
          // Missing required project_directory_name
          create_git_repo: true,
          use_renv: false
        })
      ).rejects.toThrow('Parameter validation failed');
    });
  });
});