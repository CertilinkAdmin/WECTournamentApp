# OPUX Quick Reference

## Quick Start

When you need to optimize your app's performance and UX, follow the OPUX workflow:

### Step 1: Audit
```
"Run OPUX Step 1: Lighthouse audit on [URL]"
```

### Step 2: Fix Layout
```
"Run OPUX Step 2: Fix responsive issues found in Lighthouse report"
```

### Step 3: Optimize Tailwind
```
"Run OPUX Step 3: Clean up and normalize Tailwind classes"
```

### Step 4: Verify
```
"Run OPUX Step 4: Re-run Lighthouse to verify improvements"
```

## Common Commands

### Full OPUX Workflow
```
"Run full OPUX workflow on [URL]"
```

### Specific Issue Fix
```
"Run OPUX to fix [specific issue: overflow/CLS/viewport/performance]"
```

### Mobile Optimization
```
"Run OPUX mobile optimization workflow"
```

## Expected Outputs

### Step 1 Output
- JSON report with issues
- Markdown summary
- Specific selectors and URLs
- Priority rankings

### Step 2 Output
- Modified component files
- Responsive breakpoints added
- Mobile-first improvements
- Overflow fixes

### Step 3 Output
- Normalized Tailwind classes
- Reduced duplication
- Design system alignment
- Theme config updates

### Step 4 Output
- Updated Lighthouse scores
- Comparison with baseline
- Remaining issues (if any)
- Recommendations

## Integration Points

- **Pre-commit**: Run OPUX Step 1 before commits
- **CI/CD**: Run full OPUX workflow in pipeline
- **Code Review**: Reference OPUX reports
- **Release**: Verify with OPUX Step 4

## Tips

1. Always start with Step 1 (audit) to get baseline
2. Fix issues in order of priority
3. Don't skip Step 3 (Tailwind optimization)
4. Verify with Step 4 before considering done
5. Iterate if scores don't meet targets

