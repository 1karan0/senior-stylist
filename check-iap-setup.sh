#!/bin/bash

# Quick script to check IAP setup and build release APK

echo "🔍 Checking IAP Setup for Google Play"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 Step 1: Checking Android package name..."
PACKAGE_NAME=$(grep -A 5 "defaultConfig" android/app/build.gradle | grep "applicationId" | sed 's/.*applicationId "\(.*\)".*/\1/' | head -1)
echo "   Package Name: $PACKAGE_NAME"
echo ""

echo "📦 Step 2: Checking for product IDs in API..."
echo "   Make a GET request to: /api/subscription-plans"
echo "   Look for 'google_product_id' field in the response"
echo "   Example product IDs you might see:"
echo "   - premium_monthly"
echo "   - standard_monthly"
echo ""

echo "🔨 Step 3: Building release APK..."
cd android

if [ -f "gradlew" ]; then
    echo "   Running: ./gradlew assembleRelease"
    ./gradlew assembleRelease
    
    if [ $? -eq 0 ]; then
        APK_PATH="app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
            echo "   ✅ Release APK built successfully!"
            echo "   📍 Location: $APK_PATH"
            echo "   📊 Size: $APK_SIZE"
            echo ""
            echo "   To install: adb install -r $APK_PATH"
        else
            echo "   ⚠️  Build completed but APK not found at expected location"
        fi
    else
        echo "   ❌ Build failed. Check the error messages above."
        exit 1
    fi
else
    echo "   ❌ gradlew not found. Make sure you're in the android directory."
    exit 1
fi

cd ..

echo ""
echo "✅ Setup Check Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Check Google Play Console for subscription products"
echo "   2. Verify Product IDs match exactly (case-sensitive)"
echo "   3. Add your account as a license tester"
echo "   4. Install the release APK on your device"
echo "   5. Test the purchase flow"
echo ""
echo "📖 For detailed instructions, see: GOOGLE_PLAY_IAP_TESTING_GUIDE.md"






<<<<<<< HEAD

<<<<<<< HEAD
=======
>>>>>>> 15876e7531ab0e29c228b2f2da1d5a3bc086aaea
=======


>>>>>>> 077fe46 (fix: fixing the subscription billing)




