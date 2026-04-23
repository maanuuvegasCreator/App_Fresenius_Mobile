# APK release (JS embebido, __DEV__ = false). Junction corta en C: para MAX_PATH.
$ErrorActionPreference = "Stop"
$Mobile = Join-Path $PSScriptRoot "..\mobile" | Resolve-Path
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$shortRoot = "C:\b"
$shortMobile = Join-Path $shortRoot "f"
if (Test-Path $shortMobile) {
  cmd /c "rmdir `"$shortMobile`"" 2>$null
}
if (-not (Test-Path $shortRoot)) {
  New-Item -ItemType Directory -Path $shortRoot -Force | Out-Null
}
cmd /c "mklink /J `"$shortMobile`" `"$($Mobile.Path)`"" | Out-Null
if (-not (Test-Path $shortMobile)) {
  throw "No se pudo crear junction $shortMobile -> $($Mobile.Path)"
}

try {
  Set-Location (Join-Path $shortMobile "android")
  .\gradlew.bat assembleRelease --no-daemon
  if ($LASTEXITCODE -ne 0) {
    throw "Gradle fallo con codigo $LASTEXITCODE"
  }
  $apkSrc = Join-Path $shortMobile "android\app\build\outputs\apk\release\app-release.apk"
  $outDir = Join-Path $PSScriptRoot "..\dist" | Resolve-Path
  $out = Join-Path $outDir "app-release.apk"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  Copy-Item -Force $apkSrc $out
  Write-Host "APK release generado en: $out"
}
finally {
  Set-Location $env:USERPROFILE
  if (Test-Path $shortMobile) {
    cmd /c "rmdir `"$shortMobile`"" 2>$null
  }
}
