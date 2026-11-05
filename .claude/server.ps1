# PRP Uni local preview static server (dev only).
# NOTE: keep this file ASCII-only - PowerShell 5.1 reads BOM-less UTF-8 as ANSI.
# Site root = parent folder of this .claude folder.
$root = Split-Path -Parent $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8756/")
$listener.Start()
Write-Output "Serving $root at http://localhost:8756/"

$mime = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".png"  = "image/png"; ".jpg" = "image/jpeg"; ".svg" = "image/svg+xml"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  try {
    $path = [System.Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $root ($path -replace "/", "\")
    if (Test-Path $file -PathType Leaf) {
      $bytes = [System.IO.File]::ReadAllBytes($file)
      $ext = [System.IO.Path]::GetExtension($file).ToLower()
      if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] }
      $ctx.Response.ContentLength64 = $bytes.Length
      # Writing a body to a HEAD request throws ProtocolViolationException and kills the loop
      if ($ctx.Request.HttpMethod -ne "HEAD") {
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } else {
      $ctx.Response.StatusCode = 404
    }
  } catch {
    try { $ctx.Response.StatusCode = 500 } catch {}
  }
  try { $ctx.Response.OutputStream.Close() } catch {}
}
