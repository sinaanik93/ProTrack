$ErrorActionPreference = 'Stop'
$bundledPython = 'C:\Users\yekta\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$python = if (Test-Path $bundledPython) { $bundledPython } else { 'python' }
Set-Location $PSScriptRoot
Write-Host 'Starting ProTrack AI Analyst at http://127.0.0.1:4173' -ForegroundColor Cyan
& $python '.\server.py'
