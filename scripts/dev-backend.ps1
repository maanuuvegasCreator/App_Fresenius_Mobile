$ErrorActionPreference = "Stop"
$Root = Join-Path $PSScriptRoot ".." | Resolve-Path
Set-Location (Join-Path $Root "backend")
npm run dev
