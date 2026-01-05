# Create Chrome/Edge extension zip
# Chrome/Edge uses Manifest V3

$extensionDir = "d:\Git\unnamed_tool\extension"
$outputZip = "d:\Git\unnamed_tool\public\dos4doers-extension-chromium.zip"
$tempDir = "d:\Git\unnamed_tool\extension\temp-chrome-build"

# Clean up any existing temp directory and output zip
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
if (Test-Path $outputZip) {
    Remove-Item -Path $outputZip -Force
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files for Chrome/Edge (using manifest.json - Manifest V3)
Copy-Item -Path "$extensionDir\manifest.json" -Destination "$tempDir\"
Copy-Item -Path "$extensionDir\background.js" -Destination "$tempDir\"
Copy-Item -Path "$extensionDir\popup.html" -Destination "$tempDir\"
Copy-Item -Path "$extensionDir\popup.js" -Destination "$tempDir\"
Copy-Item -Path "$extensionDir\styles.css" -Destination "$tempDir\"

# Copy icons directory
New-Item -ItemType Directory -Path "$tempDir\icons" -Force | Out-Null
Copy-Item -Path "$extensionDir\icons\*" -Destination "$tempDir\icons\" -Recurse

# Load required assemblies for zip creation
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Create zip file
try {
    $zip = [System.IO.Compression.ZipFile]::Open($outputZip, [System.IO.Compression.ZipArchiveMode]::Create)

    # Get all files recursively
    $files = Get-ChildItem -Path $tempDir -Recurse -File

    foreach ($file in $files) {
        # Calculate relative path from temp directory
        $relativePath = $file.FullName.Substring($tempDir.Length + 1)
    
        # Convert backslashes to forward slashes for cross-platform compatibility
        $entryName = $relativePath -replace '\\', '/'
    
        # Add file to zip
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName) | Out-Null
    
        Write-Host "Added: $entryName"
    }

    # Close the zip file
    $zip.Dispose()

}
catch {
    Write-Error "Error creating zip: $_"
    if ($zip) { $zip.Dispose() }
    exit 1
}

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "`nChrome/Edge extension created successfully: $outputZip"

# Verify the zip contents
Write-Host "`nZip contents:"
$zipRead = [System.IO.Compression.ZipFile]::OpenRead($outputZip)
$zipRead.Entries | ForEach-Object { Write-Host "  $_" }
$zipRead.Dispose()
