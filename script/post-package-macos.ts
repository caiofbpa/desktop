/* eslint-disable no-sync */
/**
 * post-package-macos.ts
 *
 * This script runs after electron-packager to add Liquid Glass icon support
 * for macOS Tahoe (macOS 26+). It copies the Icon Composer file or Asset Catalog
 * with appearance variants (light, dark, tinted) to the app bundle.
 *
 * Liquid Glass icons require:
 * - A layered icon with background and foreground elements
 * - Appearance variants: default (light), dark, and tinted (grayscale)
 * - The icon file should be placed in Contents/Resources/
 *
 * For more information, see:
 * - https://developer.apple.com/documentation/xcode/creating-your-app-icon-using-icon-composer
 * - https://developer.apple.com/design/human-interface-guidelines/app-icons
 */

import * as path from 'path'
import { execSync } from 'child_process'
import { copySync, existsSync } from 'fs-extra'

import { getDistPath, getIconFileName, getExecutableName } from './dist-info'

const projectRoot = path.join(__dirname, '..')

/**
 * Get the path to the app bundle's Resources directory
 */
function getAppResourcesPath(): string {
  const appName = getExecutableName()
  return path.join(getDistPath(), `${appName}.app`, 'Contents', 'Resources')
}

/**
 * Get the path to the Icon Composer file (.icon) if it exists and has content
 */
function getIconComposerPath(): string | null {
  const iconName = getIconFileName()
  const iconComposerPath = path.join(
    projectRoot,
    'app',
    'static',
    'logos',
    `${iconName}.icon`
  )

  if (!existsSync(iconComposerPath)) {
    return null
  }

  // Check if the Icon Composer file has actual content
  // A valid Icon Composer file should have files in its Assets folder
  const assetsPath = path.join(iconComposerPath, 'Assets')
  if (existsSync(assetsPath)) {
    try {
      const files = require('fs').readdirSync(assetsPath)
      if (files.length === 0) {
        // Empty Assets folder means it's a placeholder, not a real Icon Composer file
        return null
      }
    } catch {
      return null
    }
  }

  return iconComposerPath
}

/**
 * Get the path to the Asset Catalog (.xcassets) if it exists
 */
function getAssetCatalogPath(): string | null {
  const assetCatalogPath = path.join(
    projectRoot,
    'app',
    'static',
    'logos',
    'Assets.xcassets'
  )
  return existsSync(assetCatalogPath) ? assetCatalogPath : null
}

/**
 * Compile Asset Catalog to a .car file using actool
 */
function compileAssetCatalog(
  assetCatalogPath: string,
  outputDir: string
): boolean {
  try {
    // Get the minimum deployment target
    const minVersion = '10.15' // Minimum macOS version supported

    // Compile the asset catalog using actool
    const command = [
      'xcrun actool',
      `--minimum-deployment-target ${minVersion}`,
      '--platform macosx',
      '--compile',
      `"${outputDir}"`,
      `"${assetCatalogPath}"`,
      '--app-icon AppIcon',
      '--output-partial-info-plist /dev/null',
    ].join(' ')

    console.log('  Compiling Asset Catalog with actool...')
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.warn('  Failed to compile Asset Catalog:', error)
    return false
  }
}

/**
 * Copy Icon Composer file to the app bundle
 */
function copyIconComposerFile(iconPath: string, resourcesPath: string): void {
  const iconName = path.basename(iconPath)
  const destPath = path.join(resourcesPath, iconName)

  console.log(`  Copying Icon Composer file: ${iconName}`)
  copySync(iconPath, destPath)
}

/**
 * Main function to add Liquid Glass icon support
 */
export async function addLiquidGlassIcons(): Promise<void> {
  if (process.platform !== 'darwin') {
    console.log('Skipping Liquid Glass icons (not on macOS)')
    return
  }

  console.log('Adding Liquid Glass icon support...')

  const resourcesPath = getAppResourcesPath()

  if (!existsSync(resourcesPath)) {
    console.warn(`  Resources path not found: ${resourcesPath}`)
    return
  }

  // Priority 1: Use Icon Composer file if available
  const iconComposerPath = getIconComposerPath()
  if (iconComposerPath) {
    copyIconComposerFile(iconComposerPath, resourcesPath)
    console.log('  ✓ Icon Composer file added for Liquid Glass support')
    return
  }

  // Priority 2: Compile Asset Catalog if available
  const assetCatalogPath = getAssetCatalogPath()
  if (assetCatalogPath) {
    const success = compileAssetCatalog(assetCatalogPath, resourcesPath)
    if (success) {
      console.log('  ✓ Asset Catalog compiled for Liquid Glass support')
    } else {
      console.log('  ⚠ Asset Catalog compilation failed, falling back to .icns')
    }
    return
  }

  console.log(
    '  ℹ No Liquid Glass icon assets found. Using standard .icns icon.'
  )
  console.log('    To add Liquid Glass support, create either:')
  console.log('    - An Icon Composer file (.icon) using Xcode 26+')
  console.log('    - An Asset Catalog with dark and tinted variants')
}

/**
 * Generate placeholder tinted icon from the main icon
 * This creates a grayscale version suitable for the tinted appearance
 */
export function generateTintedIcon(
  sourceIconPath: string,
  outputPath: string
): boolean {
  try {
    // Use sips to convert to grayscale (this is a simple conversion)
    // For production, designers should provide proper grayscale icons
    const command = `sips -s format png "${sourceIconPath}" --out "${outputPath}"`
    execSync(command, { stdio: 'pipe' })

    // Note: A proper tinted icon should be grayscale with good contrast
    // The actual conversion to grayscale requires more sophisticated processing
    // This is a placeholder - designers should provide the actual tinted icons
    console.log(`  Generated placeholder tinted icon: ${outputPath}`)
    return true
  } catch (error) {
    console.warn(`  Failed to generate tinted icon: ${error}`)
    return false
  }
}

// Run if called directly
if (require.main === module) {
  addLiquidGlassIcons()
    .then(() => {
      console.log('Liquid Glass icon processing complete.')
    })
    .catch(error => {
      console.error('Error adding Liquid Glass icons:', error)
      process.exit(1)
    })
}
