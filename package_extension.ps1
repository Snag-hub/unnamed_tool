
$source = "$PSScriptRoot\extension"
$destination = "$PSScriptRoot\dayos-extension.zip"

if (Test-Path $destination) {
    Remove-Item $destination
}

Compress-Archive -Path "$source\*" -DestinationPath $destination
Write-Host "Extension packaged to $destination"
