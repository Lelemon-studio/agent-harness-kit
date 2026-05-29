#!/usr/bin/env pwsh
# agent-harness-kit installer (Windows / PowerShell).
# Copies the harness into a target project. Run from the kit root:
#   ./install.ps1 -Target C:\path\to\your\project
# Defaults the target to the current directory.

param(
    [string]$Target = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
$kit = $PSScriptRoot
$src = Join-Path $kit "template"

if (-not (Test-Path $Target)) { throw "Target does not exist: $Target" }
Write-Host "Installing harness into: $Target" -ForegroundColor Cyan

# 1. Hooks + commands (safe to copy — additive)
New-Item -ItemType Directory -Force -Path (Join-Path $Target ".claude/hooks") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Target ".claude/commands") | Out-Null
Copy-Item (Join-Path $src ".claude/hooks/*") (Join-Path $Target ".claude/hooks") -Force
Copy-Item (Join-Path $src ".claude/commands/*") (Join-Path $Target ".claude/commands") -Force
Write-Host "  + .claude/hooks/ and .claude/commands/" -ForegroundColor Green

# 2. settings.json — don't clobber an existing one
$dstSettings = Join-Path $Target ".claude/settings.json"
if (Test-Path $dstSettings) {
    Copy-Item (Join-Path $src ".claude/settings.json") (Join-Path $Target ".claude/settings.kit.json") -Force
    Write-Host "  ! .claude/settings.json already exists — wrote settings.kit.json instead. Merge the hooks block by hand." -ForegroundColor Yellow
} else {
    Copy-Item (Join-Path $src ".claude/settings.json") $dstSettings -Force
    Write-Host "  + .claude/settings.json" -ForegroundColor Green
}

# 3. Spec templates
New-Item -ItemType Directory -Force -Path (Join-Path $Target "specs/_templates") | Out-Null
Copy-Item (Join-Path $src "specs/_templates/*") (Join-Path $Target "specs/_templates") -Force
Write-Host "  + specs/_templates/" -ForegroundColor Green

Write-Host ""
Write-Host "Done. Next steps:" -ForegroundColor Cyan
Write-Host "  1. Append gitignore-snippet.txt to your project's .gitignore"
Write-Host "  2. The memory system lives in Claude Code's auto-memory dir, not the repo."
Write-Host "     See docs/MEMORY-SYSTEM.md. Seed your MEMORY.md from template/memory/."
Write-Host "  3. Hooks require Python on PATH. Test: open Claude Code and try 'git push'."
