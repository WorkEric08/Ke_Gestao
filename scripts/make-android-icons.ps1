# Gera os ícones de launcher do Android a partir de design/icone_batom.png.
# Saída: native/android/res/mipmap-*/ (versionada; o patcher copia para android/ depois do `cap add`).
# Uso, na raiz do projeto:  powershell -File scripts/make-android-icons.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot
$src = [System.Drawing.Image]::FromFile((Join-Path $root 'design\icone_batom.png'))

# densidade = (lado do ícone legado/redondo em px, lado da camada adaptativa de 108 dp em px)
$densities = [ordered]@{ mdpi = @(48, 108); hdpi = @(72, 162); xhdpi = @(96, 216); xxhdpi = @(144, 324); xxxhdpi = @(192, 432) }

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.SmoothingMode = 'HighQuality'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
  $g.Clear([System.Drawing.Color]::Transparent)
  return @($bmp, $g)
}

function Save-Png($bmp, $g, [string]$path) {
  New-Item -ItemType Directory -Force (Split-Path $path) | Out-Null
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

foreach ($d in $densities.Keys) {
  $legacy = $densities[$d][0]; $fg = $densities[$d][1]
  $dir = Join-Path $root "native\android\res\mipmap-$d"

  # legado (Android < 8): o ícone como está, com os cantos arredondados transparentes
  $bmp, $g = New-Canvas $legacy
  $g.DrawImage($src, 0, 0, $legacy, $legacy)
  Save-Png $bmp $g (Join-Path $dir 'ic_launcher.png')

  # redondo: círculo preto com o batom dentro
  $bmp, $g = New-Canvas $legacy
  $circle = New-Object System.Drawing.Drawing2D.GraphicsPath
  $circle.AddEllipse(0, 0, $legacy, $legacy)
  $g.SetClip($circle)   # sem o recorte, os cantos do quadrado interno vazam para fora do círculo
  $g.Clear([System.Drawing.Color]::Black)
  $inner = [int]($legacy * 0.86); $off = [int](($legacy - $inner) / 2)
  $g.DrawImage($src, $off, $off, $inner, $inner)
  Save-Png $bmp $g (Join-Path $dir 'ic_launcher_round.png')

  # adaptativo (Android 8+): camada de frente de 108 dp; o fundo é o preto de ic_launcher_background.
  # O batom fica a ~64% da altura, dentro da zona segura de 66 dp.
  $bmp, $g = New-Canvas $fg
  $inner = [int]($fg * 0.92); $off = [int](($fg - $inner) / 2)
  $g.DrawImage($src, $off, $off, $inner, $inner)
  Save-Png $bmp $g (Join-Path $dir 'ic_launcher_foreground.png')
}
$src.Dispose()

$values = Join-Path $root 'native\android\res\values'
New-Item -ItemType Directory -Force $values | Out-Null
Set-Content -Path (Join-Path $values 'ic_launcher_background.xml') -Encoding UTF8 -Value @'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#000000</color>
</resources>
'@
"ícones gerados em native/android/res"
