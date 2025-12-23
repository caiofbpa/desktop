# Liquid Glass Icon Support for macOS Tahoe

This document describes how to create and update the Liquid Glass icons for GitHub Desktop on macOS Tahoe (macOS 26+).

## Overview

macOS Tahoe introduces "Liquid Glass" icons, which are layered icons that adapt to different appearances (light, dark, and tinted). These icons provide:

- **Dynamic depth**: Layered elements create a sense of dimension
- **Appearance variants**: Icons that look great in light mode, dark mode, and tinted mode
- **System integration**: Icons receive system-provided highlights, shadows, and reflections

## Current Implementation

GitHub Desktop now supports Liquid Glass icons through two mechanisms:

### 1. Icon Composer File (`.icon`) - Preferred

Icon Composer is Apple's new tool included with Xcode 26+ for creating layered Liquid Glass icons. The Icon Composer file is located at:

```
app/static/logos/icon-logo.icon/
```

To create or update the Icon Composer file:

1. Open Xcode 26 or later
2. Choose **Xcode → Open Developer Tool → Icon Composer**
3. Import your icon layers (SVG or PNG format)
4. Configure Liquid Glass effects and appearance variants
5. Save the file as `icon-logo.icon` in the logos directory

### 2. Asset Catalog (Fallback)

For backwards compatibility or when Icon Composer is not available, an Asset Catalog is also provided:

```
app/static/logos/Assets.xcassets/AppIcon.appiconset/
```

This catalog contains:
- `icon_*.png` - Standard light mode icons at various sizes
- `icon_*_dark.png` - Dark mode variants
- `icon_*_tinted.png` - Tinted (grayscale) variants for tinted mode

## Icon Requirements

### For Icon Composer

1. **Canvas Size**: 1024x1024 pixels for iOS/iPadOS/macOS
2. **Layers**: Organize graphics into groups (max 4 groups)
3. **Format**: SVG preferred for scalability, PNG for complex artwork
4. **No Custom Effects**: Remove blurs, shadows, and gradients from source files
5. **Separate Artwork**: Keep text, colors, and graphics in separate layers

### For Asset Catalog

| Size | Filename | Scale | Usage |
|------|----------|-------|-------|
| 16x16 | icon_16x16.png | 1x | Finder, Spotlight |
| 32x32 | icon_16x16@2x.png | 2x | Finder Retina |
| 32x32 | icon_32x32.png | 1x | Finder |
| 64x64 | icon_32x32@2x.png | 2x | Finder Retina |
| 128x128 | icon_128x128.png | 1x | Finder |
| 256x256 | icon_128x128@2x.png | 2x | Finder Retina |
| 256x256 | icon_256x256.png | 1x | Finder |
| 512x512 | icon_256x256@2x.png | 2x | Finder Retina |
| 512x512 | icon_512x512.png | 1x | Finder |
| 1024x1024 | icon_512x512@2x.png | 2x | App Store |

### Dark Mode Variant

The dark mode icon should:
- Use complementary colors that work on dark backgrounds
- Have a color background (not transparent) for contrast
- Feel subdued compared to the light mode version
- Maintain the core visual identity

### Tinted Mode Variant

The tinted icon should be:
- **Grayscale only** - no colors
- High contrast to remain visible
- Designed to work with any user-selected tint color
- Slightly more simplified than the color versions

## Creating Icons

### Using Icon Composer (Recommended)

1. **Export Layers from Design Tool**
   - Use Figma, Sketch, or Illustrator
   - Export each layer as SVG or PNG
   - Name files with numbers for ordering (e.g., `01-background.svg`, `02-octocat.svg`)

2. **Import into Icon Composer**
   - Drag files into the sidebar
   - Organize into groups (background, midground, foreground)
   - Each group becomes a distinct layer in the final icon

3. **Configure Appearances**
   - Select **Default** appearance and set colors/effects for light mode
   - Select **Dark** appearance and adjust colors as needed
   - Select **Mono** appearance and verify grayscale looks correct

4. **Apply Liquid Glass Effects**
   - Toggle **Specular** for glass-like highlights
   - Adjust **Blur** and **Translucency** for depth
   - Use **Shadow** to create separation between layers

5. **Test and Export**
   - Preview on different backgrounds using toolbar controls
   - Save the `.icon` file to `app/static/logos/icon-logo.icon`

### Using Asset Catalog

If you need to update the Asset Catalog manually:

1. Export icons at all required sizes from your design tool
2. Create dark and tinted variants
3. For tinted variants, convert to grayscale (Gray Gamma 2.2 color space)
4. Update the PNG files in `Assets.xcassets/AppIcon.appiconset/`
5. Run the build to verify icons are compiled correctly

## Development Icon

For development builds, a yellow version of the icon is used:
- Icon Composer file: `icon-logo-yellow.icon`
- Asset Catalog: Update `AppIcon.appiconset` accordingly

The build system automatically selects the appropriate icon based on the channel.

## Build Process

The build script (`script/build.ts`) handles icons as follows:

1. **electron-packager** uses the `.icns` file for the base icon
2. **post-package-macos.ts** adds Liquid Glass support by:
   - Copying the Icon Composer file if available (`.icon`)
   - Compiling the Asset Catalog if available (`.xcassets`)
   - Falling back to the standard `.icns` if neither is present

## Testing

To test Liquid Glass icons:

1. Build the app on macOS
2. Check the icon in Finder (right-click → Get Info)
3. Switch between Light, Dark, and Tinted appearance in System Settings
4. Verify the icon adapts correctly to each mode

## Resources

- [Apple HIG: App Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Creating your app icon using Icon Composer](https://developer.apple.com/documentation/xcode/creating-your-app-icon-using-icon-composer)
- [Configuring your app icon using an asset catalog](https://developer.apple.com/documentation/xcode/configuring-your-app-icon)
- [WWDC 2025: Say hello to the new look of app icons](https://developer.apple.com/videos/play/wwdc2025/220/)
- [WWDC 2025: Create icons with Icon Composer](https://developer.apple.com/videos/play/wwdc2025/361/)

## Troubleshooting

### Icon not updating on macOS

macOS caches app icons. To clear the cache:

```bash
sudo rm -rfv /Library/Caches/com.apple.iconservices.store
sudo find /private/var/folders/ -name com.apple.iconservices -exec rm -rfv {} \;
sudo find /private/var/folders/ -name com.apple.dock.iconcache -exec rm -rfv {} \;
killall Dock
killall Finder
```

### Asset Catalog not compiling

Ensure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

### Tinted icon looks wrong

The tinted icon should be pure grayscale. Check that:
- The color space is "Gray Gamma 2.2"
- There are no embedded color profiles
- The image has good contrast
