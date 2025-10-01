#!/bin/bash
# Cleanup script to remove unnecessary packages for minimal mobile backend

set -e

echo "🧹 Cleaning up Theia fork for minimal mobile backend..."

# Packages to KEEP (11 core packages + our mobile package)
KEEP_PACKAGES=(
    "core"
    "core-mobile"
    "filesystem"
    "messages"
    "plugin"
    "plugin-ext"
    "plugin-ext-vscode"
    "vsx-registry"
    "workspace"
    "process"
    "terminal"
)

# Move to repository root
cd "$(dirname "$0")/.."

echo "📦 Removing unnecessary packages..."

# Remove all AI packages
rm -rf packages/ai-*
echo "  ✓ Removed AI packages"

# Remove UI/Frontend packages
for pkg in browser console debug editor editor-preview external-terminal markers \
           monaco navigator outline output preferences property-view scm scm-extra \
           search-in-workspace; do
    if [ -d "packages/$pkg" ]; then
        rm -rf "packages/$pkg"
        echo "  ✓ Removed packages/$pkg"
    fi
done

# Remove development packages
for pkg in plugin-dev plugin-metrics api-tests playwright test toolbar; do
    if [ -d "packages/$pkg" ]; then
        rm -rf "packages/$pkg"
        echo "  ✓ Removed packages/$pkg"
    fi
done

# Remove optional feature packages
for pkg in bulk-edit callhierarchy collaboration getting-started keymaps \
           memory-inspector metrics mini-browser notebook remote remote-wsl \
           scanoss secondary-window task timeline typehierarchy userstorage \
           variable-resolver; do
    if [ -d "packages/$pkg" ]; then
        rm -rf "packages/$pkg"
        echo "  ✓ Removed packages/$pkg"
    fi
done

# Clean up examples
echo "📁 Cleaning examples directory..."
if [ -d "examples/browser" ]; then rm -rf examples/browser; fi
if [ -d "examples/electron" ]; then rm -rf examples/electron; fi
if [ -d "examples/playwright" ]; then rm -rf examples/playwright; fi
echo "  ✓ Cleaned examples"

# Clean up dev-packages (keep only essential)
echo "🔧 Cleaning dev-packages..."
for pkg in ovsx-client localization-manager; do
    if [ -d "dev-packages/$pkg" ]; then
        rm -rf "dev-packages/$pkg"
        echo "  ✓ Removed dev-packages/$pkg"
    fi
done

# Remove sample plugins
if [ -d "sample-plugins" ]; then
    rm -rf sample-plugins
    echo "  ✓ Removed sample-plugins"
fi

# Remove old docs
if [ -d "doc" ]; then
    rm -rf doc
    echo "  ✓ Removed old doc directory"
fi

# Clean IDE configurations
echo "🗑️  Removing IDE configurations..."
rm -rf .vscode .idea .theia
echo "  ✓ Removed IDE configs"

# Create workspace directory if it doesn't exist
mkdir -p workspace
echo "  ✓ Created workspace directory"

# Create plugins directory
mkdir -p plugins/java plugins/csharp
echo "  ✓ Created plugins directory"

# Count remaining packages
REMAINING=$(ls -1 packages | wc -l | tr -d ' ')
echo ""
echo "✨ Cleanup complete!"
echo "📊 Remaining packages: $REMAINING"
echo ""
echo "Kept packages:"
for pkg in "${KEEP_PACKAGES[@]}"; do
    if [ -d "packages/$pkg" ]; then
        echo "  ✓ packages/$pkg"
    fi
done

echo ""
echo "⚠️  Next steps:"
echo "  1. Review changes: git status"
echo "  2. Update package.json workspaces"
echo "  3. Run: npm install"
echo "  4. Run: npm run build"
echo "  5. Test Docker: cd docker && docker-compose up"
