$ErrorActionPreference = 'Stop'
$mcp = Get-Content "C:\Users\gi_pr\.cursor\mcp.json" -Raw | ConvertFrom-Json
$key = $mcp.mcpServers.stitch.headers.PSObject.Properties['X-Goog-Api-Key'].Value
$project = '3384103249244904780'
$outDir = "C:\Users\gi_pr\Documents\Github\alugameubem\.stitch\designs"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$screens = @(
  @{ id = '0665ef60d9654b79bc9e977f902d0e3e'; slug = 'welcome' },
  @{ id = '11a561fa7f974a38a4274ca3504426a0'; slug = 'register' },
  @{ id = '78b8b7a14462465cab63a6eddd33eb3d'; slug = 'checkout' },
  @{ id = '8348b9f1d9494958bcc1fd0f63a49059'; slug = 'chat' },
  @{ id = '976c70b92bbf46cd8791d0599e642405'; slug = 'item-details' },
  @{ id = 'asset-stub-assets-1c61c1cd371a46809a63bd6e6c5152c5-1776000078547'; slug = 'design-system' },
  @{ id = 'f45be9b0af8843fd82cf3d48c270f1d1'; slug = 'publish' },
  @{ id = 'f88c65ec1e474c5d90717f3db2d15915'; slug = 'available-items' }
)

$manifest = @()
foreach ($s in $screens) {
  $jsonPath = Join-Path $outDir "$($s.slug).json"
  $code = curl.exe -sS -o $jsonPath -w "%{http_code}" -H "X-Goog-Api-Key: $key" -H "Accept: application/json" "https://stitch.googleapis.com/v1/projects/$project/screens/$($s.id)"
  if ($code -ne '200') {
    Write-Output ("FAIL $($s.slug) http=$code")
    continue
  }
  $data = Get-Content $jsonPath -Raw | ConvertFrom-Json
  $title = $data.title
  $htmlUrl = $data.htmlCode.downloadUrl
  $imgUrl = $data.screenshot.downloadUrl
  $width = $data.width
  if ($imgUrl -and $width) { $imgUrl = "$imgUrl=w$width" }

  $htmlPath = Join-Path $outDir "$($s.slug).html"
  $pngPath = Join-Path $outDir "$($s.slug).png"
  $htmlCode = 0
  $pngCode = 0
  if ($htmlUrl) {
    $htmlCode = curl.exe -sS -L -o $htmlPath -w "%{http_code}" $htmlUrl
  }
  if ($imgUrl) {
    $pngCode = curl.exe -sS -L -o $pngPath -w "%{http_code}" $imgUrl
  }
  $htmlSize = if (Test-Path $htmlPath) { (Get-Item $htmlPath).Length } else { 0 }
  $pngSize = if (Test-Path $pngPath) { (Get-Item $pngPath).Length } else { 0 }
  Write-Output ("OK $($s.slug) title=$title html=$htmlCode/$htmlSize png=$pngCode/$pngSize")
  $manifest += [pscustomobject]@{ slug = $s.slug; id = $s.id; title = $title; width = $data.width; height = $data.height }
}

$manifest | ConvertTo-Json | Set-Content (Join-Path $outDir "manifest.json")
Write-Output 'DONE'
