/**
 * OPUX Diagnostic Script
 * 
 * Runs Lighthouse audit to identify performance, accessibility, and responsive design issues
 * Follows the OPUX workflow:
 * 1. Lighthouse MCP → Find Problems
 * 2. Responsive Refactor MCP → Fix Layout (manual step)
 * 3. Tailwind Optimizer MCP → Clean Up & Enforce Patterns (manual step)
 * 4. Lighthouse MCP (Again) → Verify (manual step)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface LighthouseResult {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  cls: number;
  issues: string[];
}

async function findChromePath(): Promise<string | null> {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/local/bin/google-chrome',
    '/usr/local/bin/chromium',
    process.env.CHROME_PATH || '',
    process.env.CHROME_BIN || '',
  ].filter(Boolean);

  for (const chromePath of possiblePaths) {
    try {
      await fs.access(chromePath);
      return chromePath;
    } catch {
      continue;
    }
  }

  // Try to find via which
  try {
    const { stdout } = await execAsync('which google-chrome chromium chromium-browser chrome 2>/dev/null | head -1');
    const found = stdout.trim();
    if (found) {
      return found;
    }
  } catch {
    // Ignore
  }

  return null;
}

async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  console.log(`🔍 Running Lighthouse audit on ${url}...`);
  
  const outputPath = path.join(process.cwd(), 'lighthouse-report.json');
  
  try {
    // Try to find Chrome
    const chromePath = await findChromePath();
    let lighthouseCmd = `npx lighthouse "${url}" --output=json --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance,accessibility,best-practices,seo`;
    
    if (chromePath) {
      lighthouseCmd = `CHROME_PATH="${chromePath}" ${lighthouseCmd}`;
      console.log(`   Using Chrome at: ${chromePath}`);
    } else {
      console.warn('   ⚠️  Chrome not found. Lighthouse will try to find it automatically.');
      console.warn('   💡 To set Chrome path manually: export CHROME_PATH=/path/to/chrome');
    }
    
    // Run Lighthouse CLI
    const { stdout, stderr } = await execAsync(lighthouseCmd, {
      env: {
        ...process.env,
        ...(chromePath ? { CHROME_PATH: chromePath } : {})
      }
    });
    
    if (stderr) {
      console.warn('Lighthouse warnings:', stderr);
    }
    
    // Read the report
    const reportContent = await fs.readFile(outputPath, 'utf-8');
    const report = JSON.parse(reportContent);
    
    const audits = report.audits || {};
    const categories = report.categories || {};
    
    const result: LighthouseResult = {
      url,
      performance: Math.round(categories.performance?.score * 100) || 0,
      accessibility: Math.round(categories.accessibility?.score * 100) || 0,
      bestPractices: Math.round(categories['best-practices']?.score * 100) || 0,
      seo: Math.round(categories.seo?.score * 100) || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      issues: []
    };
    
    // Collect issues
    const issueTypes = {
      performance: categories.performance?.score < 0.9,
      accessibility: categories.accessibility?.score < 0.95,
      bestPractices: categories['best-practices']?.score < 0.95,
      seo: categories.seo?.score < 0.9,
      cls: audits['cumulative-layout-shift']?.numericValue > 0.1
    };
    
    if (issueTypes.performance) {
      result.issues.push(`Performance score ${result.performance}/100 (target: 90+)`);
    }
    if (issueTypes.accessibility) {
      result.issues.push(`Accessibility score ${result.accessibility}/100 (target: 95+)`);
    }
    if (issueTypes.bestPractices) {
      result.issues.push(`Best Practices score ${result.bestPractices}/100 (target: 95+)`);
    }
    if (issueTypes.seo) {
      result.issues.push(`SEO score ${result.seo}/100 (target: 90+)`);
    }
    if (issueTypes.cls) {
      result.issues.push(`CLS (Cumulative Layout Shift) ${result.cls.toFixed(3)} (target: <0.1)`);
    }
    
    // Check for mobile-specific issues
    const viewportAudit = audits['viewport'];
    if (viewportAudit?.score !== 1) {
      result.issues.push(`Viewport configuration issue: ${viewportAudit?.description || 'Missing viewport meta tag'}`);
    }
    
    const contentWidthAudit = audits['content-width'];
    if (contentWidthAudit?.score !== 1) {
      result.issues.push(`Content width issue: Content may overflow on mobile devices`);
    }
    
    return result;
  } catch (error: any) {
    const errorMsg = error.message || error.toString();
    
    if (errorMsg.includes('CHROME_PATH') || errorMsg.includes('Chrome') || errorMsg.includes('Chromium')) {
      console.error('\n❌ Chrome/Chromium not found!');
      console.error('\n📋 To fix this, you have a few options:');
      console.error('\n1. Install Chrome/Chromium:');
      console.error('   Ubuntu/Debian: sudo apt-get install -y google-chrome-stable chromium-browser');
      console.error('   Or download from: https://www.google.com/chrome/');
      console.error('\n2. Set CHROME_PATH environment variable:');
      console.error('   export CHROME_PATH=/usr/bin/google-chrome');
      console.error('   bun run opux:diagnostic');
      console.error('\n3. Use Lighthouse MCP server (if available):');
      console.error('   The OPUX workflow can use MCP servers for Lighthouse audits.');
      console.error('\n4. Run Lighthouse in a different environment:');
      console.error('   Use CI/CD or a machine with Chrome installed.');
    } else {
      console.error('Error running Lighthouse:', errorMsg);
    }
    throw error;
  }
}

async function generateReport(result: LighthouseResult): Promise<string> {
  const reportPath = path.join(process.cwd(), 'OPUX_DIAGNOSTIC_REPORT.md');
  
  const report = `# OPUX Diagnostic Report

**Generated:** ${new Date().toISOString()}
**URL:** ${result.url}

## Scores

| Metric | Score | Target | Status |
|--------|-------|--------|--------|
| Performance | ${result.performance}/100 | 90+ | ${result.performance >= 90 ? '✅' : '❌'} |
| Accessibility | ${result.accessibility}/100 | 95+ | ${result.accessibility >= 95 ? '✅' : '❌'} |
| Best Practices | ${result.bestPractices}/100 | 95+ | ${result.bestPractices >= 95 ? '✅' : '❌'} |
| SEO | ${result.seo}/100 | 90+ | ${result.seo >= 90 ? '✅' : '❌'} |
| CLS | ${result.cls.toFixed(3)} | <0.1 | ${result.cls < 0.1 ? '✅' : '❌'} |

## Issues Found

${result.issues.length > 0 
  ? result.issues.map(issue => `- ❌ ${issue}`).join('\n')
  : '- ✅ No issues found! All metrics meet targets.'
}

## Next Steps

1. **If issues found:**
   - Run Responsive Refactor MCP to fix layout issues
   - Run Tailwind Optimizer MCP to clean up styles
   - Re-run this diagnostic to verify improvements

2. **If all clear:**
   - Continue with development
   - Re-run before major releases

## OPUX Workflow

\`\`\`
Lighthouse MCP (Audit) → Find Problems
    ↓
Responsive Refactor MCP → Fix Layout Issues
    ↓
Tailwind Optimizer MCP → Clean & Normalize
    ↓
Lighthouse MCP (Verify) → Confirm Improvements
\`\`\`
`;

  await fs.writeFile(reportPath, report, 'utf-8');
  return reportPath;
}

async function main() {
  const url = process.argv[2] || 'http://localhost:5000';
  
  console.log('🚀 Starting OPUX Diagnostic...\n');
  console.log('Step 1: Running Lighthouse audit (mobile)...\n');
  
  try {
    const result = await runLighthouseAudit(url);
    
    console.log('\n📊 Results:');
    console.log(`   Performance: ${result.performance}/100 ${result.performance >= 90 ? '✅' : '❌'}`);
    console.log(`   Accessibility: ${result.accessibility}/100 ${result.accessibility >= 95 ? '✅' : '❌'}`);
    console.log(`   Best Practices: ${result.bestPractices}/100 ${result.bestPractices >= 95 ? '✅' : '❌'}`);
    console.log(`   SEO: ${result.seo}/100 ${result.seo >= 90 ? '✅' : '❌'}`);
    console.log(`   CLS: ${result.cls.toFixed(3)} ${result.cls < 0.1 ? '✅' : '❌'}`);
    
    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('\n✅ No issues found! All metrics meet targets.');
    }
    
    const reportPath = await generateReport(result);
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log('\n✅ OPUX Diagnostic complete!');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runLighthouseAudit, generateReport };

