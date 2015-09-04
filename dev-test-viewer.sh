# Remove core dependencies
rm -rf node_modules/tonic-data-manager/lib
rm -rf node_modules/tonic-image-builder/lib
rm -rf node_modules/tonic-query-data-model/lib
rm -rf node_modules/tonic-widgets/lib

# Replace core dependencies with dev ones
cp -r ../../tonic-utils/tonic-data-manager/lib     ./node_modules/tonic-data-manager/
cp -r ../../tonic-utils/tonic-image-builder/lib    ./node_modules/tonic-image-builder/
cp -r ../../tonic-utils/tonic-query-data-model/lib ./node_modules/tonic-query-data-model/
cp -r ../../tonic-widgets/lib                      ./node_modules/tonic-widgets/

# Build new viewer
npm run build

# Run local code base
./bin/arctic-viewer-cli.js -s -d $1
