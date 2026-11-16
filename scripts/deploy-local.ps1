# Deploy dsh-image-gen from this checkout to the stable install directory.
#
# The desktop profile depends on the STABLE path (under ~/.dsh/plugins) rather than this
# checkout, so moving or deleting the checkout cannot break the installed plugin.
# Run this after changing lib/ ; it copies, then prints what changed.
#
#   pwsh -File scripts/deploy-local.ps1            # copy
#   pwsh -File scripts/deploy-local.ps1 -Check     # only report drift, copy nothing
[CmdletBinding()]
param(
  [string]$Target = (Join-Path $env:USERPROFILE '.dsh\plugins\dsh-image-gen'),
  [switch]$Check
)

$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $PSScriptRoot

function Assert-SafeTarget([string]$path) {
  if ([string]::IsNullOrWhiteSpace($path)) { throw 'empty target' }
  $full = [IO.Path]::GetFullPath($path)
  if ($path -match '[.][.]' -or $full -match '[*?]') { throw "bad path: $full" }
  $allowedRoot = [IO.Path]::GetFullPath((Join-Path $env:USERPROFILE '.dsh\plugins'))
  if (-not $full.StartsWith($allowedRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
    throw "target must live under $allowedRoot (got $full)"
  }
  if ($full.TrimEnd('\') -ieq $allowedRoot.TrimEnd('\')) { throw "refusing to use the root itself: $full" }
  return $full
}

$dest = Assert-SafeTarget $Target
$items = @('package.json', 'cordis.patch.yml', 'README.md', 'LICENSE', 'CHANGELOG.md', 'lib')

$drift = @()
foreach ($item in $items) {
  $from = Join-Path $source $item
  $to = Join-Path $dest $item
  if (-not (Test-Path -LiteralPath $from)) { continue }
  if (-not (Test-Path -LiteralPath $to)) { $drift += "missing: $item"; continue }
  if ((Get-Item -LiteralPath $from).PSIsContainer) {
    $a = Get-ChildItem -LiteralPath $from -Recurse -File
    foreach ($f in $a) {
      $rel = $f.FullName.Substring($from.Length)
      $mirror = Join-Path $to $rel
      if (-not (Test-Path -LiteralPath $mirror)) { $drift += "missing: $item$rel"; continue }
      if ((Get-FileHash -LiteralPath $f.FullName).Hash -ne (Get-FileHash -LiteralPath $mirror).Hash) { $drift += "differs: $item$rel" }
    }
  } else {
    if ((Get-FileHash -LiteralPath $from).Hash -ne (Get-FileHash -LiteralPath $to).Hash) { $drift += "differs: $item" }
  }
}

if ($drift.Count -eq 0) { Write-Output "stable copy is up to date: $dest"; return }
Write-Output ("drift ({0}):" -f $drift.Count)
$drift | ForEach-Object { Write-Output ("  " + $_) }
if ($Check) { Write-Output 'check mode: nothing copied'; exit 1 }

New-Item -ItemType Directory -Force -Path $dest | Out-Null
foreach ($item in $items) {
  $from = Join-Path $source $item
  if (-not (Test-Path -LiteralPath $from)) { continue }
  $to = Join-Path $dest $item
  if ((Get-Item -LiteralPath $from).PSIsContainer) {
    if (Test-Path -LiteralPath $to) { Remove-Item -LiteralPath $to -Recurse -Force }
    Copy-Item -LiteralPath $from -Destination $to -Recurse
  } else {
    Copy-Item -LiteralPath $from -Destination $to -Force
  }
}
Write-Output "copied to $dest"
Write-Output 'restart the DSH app (or reload the profile) for the installed copy to take effect'
