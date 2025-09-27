param(
  [Parameter(Mandatory = $true)] [string] $DatabaseUrl,
  [string] $SchemaPath = "supabase/schema.sql"
)

Write-Host "Applying schema to Supabase..." -ForegroundColor Cyan

if (-not (Test-Path $SchemaPath)) {
  Write-Error "Schema file not found at $SchemaPath"
  exit 1
}

# Require psql
$psql = (Get-Command psql -ErrorAction SilentlyContinue)
if (-not $psql) {
  Write-Error "psql not found. Install PostgreSQL client or use Supabase SQL editor."
  exit 1
}

$env:PGSSLMODE = "require"

& psql $DatabaseUrl -f $SchemaPath
if ($LASTEXITCODE -ne 0) {
  Write-Error "Schema apply failed."
  exit $LASTEXITCODE
}

Write-Host "Schema applied successfully." -ForegroundColor Green













