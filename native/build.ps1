param(
    [string]$Zig,
    [switch]$Development
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
if (!$Zig) {
    $Zig = Join-Path $root '.local/toolchain/zig-x86_64-windows-0.15.2/zig.exe'
    if (!(Test-Path -LiteralPath $Zig)) { $Zig = (Get-Command zig.exe -ErrorAction Stop).Source }
}
$Zig = (Resolve-Path -LiteralPath $Zig).Path
$compiler = Join-Path $env:WINDIR 'Microsoft.NET/Framework64/v4.0.30319/csc.exe'
$work = Join-Path $root '.local/native-build'
$vendor = Join-Path $PSScriptRoot 'vendor/ooz'
$release = Join-Path $root 'release'
New-Item -ItemType Directory -Force $work,$release | Out-Null
$env:ZIG_GLOBAL_CACHE_DIR = Join-Path $root '.local/zig-cache'
$env:ZIG_LOCAL_CACHE_DIR = Join-Path $work 'zig-cache'
$dll = Join-Path $work 'PBZ.Native.dll'
$data = Join-Path $work 'guides.json'
$node = (Get-Command node.exe -ErrorAction Stop).Source
& $node (Join-Path $PSScriptRoot 'build-data.mjs') $data
if ($LASTEXITCODE) { throw 'Guide data build failed.' }
$version = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
$exe = Join-Path $release "PBZ-Quest-Guard-$version-native-win-x64.exe"
if ($Development) { $exe = Join-Path $work 'PBZ-Quest-Guard-dev.exe' }
$compiled = Join-Path $work (Split-Path -Leaf $exe)

$sources = @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.cs' | ForEach-Object FullName)
& $compiler /nologo /target:library /platform:x64 /codepage:65001 /optimize+ "/out:$dll" "/resource:$data,PBZ.Guides" /reference:System.Web.Extensions.dll /reference:System.Windows.Forms.dll /reference:System.Drawing.dll @sources
if ($LASTEXITCODE) { throw 'Managed application build failed.' }

Push-Location -LiteralPath $work
try {
    $windowsVersion = $version.Replace('.', ',') + ',0'
    $resource = @"
101 RCDATA "PBZ.Native.dll"
1 VERSIONINFO
FILEVERSION $windowsVersion
PRODUCTVERSION $windowsVersion
FILEOS 0x40004L
FILETYPE 0x1L
BEGIN
    BLOCK "StringFileInfo"
    BEGIN
        BLOCK "040904B0"
        BEGIN
            VALUE "FileDescription", "PBZ Quest Guard"
            VALUE "FileVersion", "$version"
            VALUE "ProductName", "PBZ Quest Guard"
            VALUE "ProductVersion", "$version"
            VALUE "OriginalFilename", "$(Split-Path -Leaf $exe)"
        END
    END
    BLOCK "VarFileInfo"
    BEGIN
        VALUE "Translation", 0x0409, 1200
    END
END
"@
    [IO.File]::WriteAllText((Join-Path $work 'App.rc'), $resource)
    & $Zig rc /fo App.res App.rc
    if ($LASTEXITCODE) { throw 'Application resource build failed.' }
    $cpp = @(Get-ChildItem -LiteralPath $vendor -Filter '*.cpp' | ForEach-Object FullName)
    & $Zig c++ -target x86_64-windows-gnu -std=c++17 -O2 -DNDEBUG -msse2 -static -s -municode '-Wl,--subsystem,windows' -I $vendor (Join-Path $PSScriptRoot 'Host.cpp') @cpp App.res -lole32 -loleaut32 -o $compiled
    if ($LASTEXITCODE) { throw 'Native executable build failed.' }
}
finally { Pop-Location }
if (!$Development) {
    Copy-Item -LiteralPath $compiled -Destination $exe -Force
    $hash = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLowerInvariant()
    [IO.File]::WriteAllText("$exe.sha256", "$hash  $(Split-Path -Leaf $exe)`r`n")
}
Write-Output $exe
