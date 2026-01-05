# Create Firefox extension zip with Unix-style paths (forward slashes)
# Firefox Add-ons requires forward slashes in zip archives

$extensionDir = "d:\Git\unnamed_tool\extension"
$outputZip = "d:\Git\unnamed_tool\public\dos4doers-extension-firefox.zip"
$tempDir = "d:\Git\unnamed_tool\extension\temp-firefox-build"

# Clean up any existing temp directory and output zip
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}
if (Test-Path $outputZip) {
    Remove-Item -Path $outputZip -Force
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy files for Firefox (using manifest.v2.json as manifest.json)
Copy-Item -Path "$extensionDir\manifest.v2.json" -Destination "$tempDir\manifest.json"
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

# Create zip file with proper Unix-style paths
try {
    $zip = [System.IO.Compression.ZipFile]::Open($outputZip, [System.IO.Compression.ZipArchiveMode]::Create)

    # Get all files recursively
    $files = Get-ChildItem -Path $tempDir -Recurse -File

    foreach ($file in $files) {
        # Calculate relative path from temp directory
        $relativePath = $file.FullName.Substring($tempDir.Length + 1)
    
        # Convert backslashes to forward slashes for Unix compatibility
        $entryName = $relativePath -replace '\\', '/'
    
        # Add file to zip with Unix-style path
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

Write-Host "`nFirefox extension created successfully: $outputZip"
Write-Host "All paths use forward slashes (/) for Firefox compatibility"

# Create .xpi version for direct installation
$outputXpi = $outputZip -replace '\.zip$', '.xpi'
Copy-Item -Path $outputZip -Destination $outputXpi -Force
Write-Host "`nAlso created .xpi version for direct installation: $outputXpi"

# Verify the zip contents
Write-Host "`nZip contents:"
$zipRead = [System.IO.Compression.ZipFile]::OpenRead($outputZip)
$zipRead.Entries | ForEach-Object { Write-Host "  $_" }
$zipRead.Dispose()

Write-Host "`n"
Write-Host "Files created:"
Write-Host "  - .zip file: For uploading to Firefox Add-ons store"
Write-Host "  - .xpi file: For direct installation in Firefox (drag & drop)"
