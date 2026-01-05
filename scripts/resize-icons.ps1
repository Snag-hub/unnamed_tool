# Check and resize extension icons to match manifest requirements
# Firefox requires icons to be exactly the size declared in manifest

Add-Type -AssemblyName System.Drawing

$iconsDir = "d:\Git\unnamed_tool\extension\icons"
$iconSizes = @{
    "icon-16.png"  = 16
    "icon-32.png"  = 32
    "icon-48.png"  = 48
    "icon-128.png" = 128
}

Write-Host "Checking current icon sizes..."
Write-Host ""

foreach ($iconFile in $iconSizes.Keys) {
    $iconPath = Join-Path $iconsDir $iconFile
    $expectedSize = $iconSizes[$iconFile]
    
    if (Test-Path $iconPath) {
        $img = [System.Drawing.Image]::FromFile($iconPath)
        $currentWidth = $img.Width
        $currentHeight = $img.Height
        
        Write-Host "$iconFile : ${currentWidth}x${currentHeight} (expected: ${expectedSize}x${expectedSize})"
        
        if ($currentWidth -ne $expectedSize -or $currentHeight -ne $expectedSize) {
            Write-Host "  → Resizing to ${expectedSize}x${expectedSize}..."
            
            # Create new bitmap with correct size
            $newBitmap = New-Object System.Drawing.Bitmap($expectedSize, $expectedSize)
            $graphics = [System.Drawing.Graphics]::FromImage($newBitmap)
            
            # Set high quality rendering
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            
            # Draw resized image
            $graphics.DrawImage($img, 0, 0, $expectedSize, $expectedSize)
            
            # Dispose original image so we can overwrite the file
            $img.Dispose()
            
            # Save resized image
            $newBitmap.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
            
            # Cleanup
            $graphics.Dispose()
            $newBitmap.Dispose()
            
            Write-Host "  ✓ Resized successfully"
        }
        else {
            $img.Dispose()
            Write-Host "  ✓ Already correct size"
        }
    }
    else {
        Write-Host "$iconFile : NOT FOUND"
    }
    
    Write-Host ""
}

Write-Host "Icon resizing complete!"
