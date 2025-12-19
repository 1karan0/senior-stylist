# Fix: "All uploaded bundles must be signed" Error

## 🔍 Problem

Google Play Console requires all APKs/AABs to be **signed with a release keystore**. Your build isn't being signed because the `keystore.properties` file is missing.

## ✅ Solution: Create keystore.properties

### Step 1: Check Your Keystore

You already have `release.keystore` file. Now you need to create `keystore.properties` with the keystore details.

### Step 2: Create keystore.properties File

**Option A: If You Know Your Keystore Details**

1. Create the file:

   ```bash
   cd /home/codedrill/senior-stylist/senior-stylist/android/app
   nano keystore.properties
   ```

2. Add this content (replace with YOUR actual values):

   ```properties
   storeFile=release.keystore
   storePassword=YOUR_KEYSTORE_PASSWORD
   keyAlias=YOUR_KEY_ALIAS
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Save and exit (Ctrl+X, then Y, then Enter)

**Option B: If You Don't Know Your Keystore Details**

If you don't remember the password/alias, you have two options:

#### Option B1: Create a New Keystore (Recommended for Dev)

```bash
cd /home/codedrill/senior-stylist/senior-stylist/android/app

# Create new keystore
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore release.keystore \
  -alias senior-stylist-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (use same as keystore password)
# - Your name, organization, etc.
```

Then create `keystore.properties`:

```properties
storeFile=release.keystore
storePassword=YOUR_PASSWORD_HERE
keyAlias=senior-stylist-key
keyPassword=YOUR_PASSWORD_HERE
```

#### Option B2: Find Existing Keystore Details

If the keystore was created before, try to find the details:

```bash
# Try to list keystore info (will prompt for password)
cd android/app
keytool -list -v -keystore release.keystore
```

This will show you the alias name. You'll need to know the password.

### Step 3: Verify keystore.properties

Make sure the file exists and has correct values:

```bash
cd android/app
cat keystore.properties
```

Should show:

```
storeFile=release.keystore
storePassword=your_password
keyAlias=your_alias
keyPassword=your_password
```

### Step 4: Add to .gitignore (IMPORTANT!)

**Never commit keystore.properties to git!** It contains sensitive passwords.

```bash
# Check if .gitignore exists and add keystore.properties
echo "android/app/keystore.properties" >> .gitignore
echo "android/app/*.keystore" >> .gitignore  # Also ignore keystore files
```

### Step 5: Build Signed Release Bundle

Now build the signed release:

```bash
cd android
./gradlew bundleRelease
```

You should see:

- No warnings about missing keystore
- Build completes successfully
- AAB file created at: `app/build/outputs/bundle/release/app-release.aab`

### Step 6: Verify the AAB is Signed

```bash
# Check if AAB is signed
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab
```

Should show: `jar verified.`

### Step 7: Upload to Play Console

1. Go to Google Play Console
2. **Test and release** → **Internal testing**
3. **Create new release**
4. Upload `app-release.aab`
5. Should work now! ✅

---

## 🔒 Security Best Practices

1. **Never commit keystore files or properties to git**
2. **Backup your keystore** - if you lose it, you can't update your app!
3. **Use different keystores for dev and prod** (you're already doing this with flavors)
4. **Store keystore password securely** (password manager, etc.)

---

## 🚨 Common Issues

### Issue: "keystore.properties not found"

**Fix:** Make sure the file is at `android/app/keystore.properties` (not in root)

### Issue: "Wrong password"

**Fix:** Double-check the password in `keystore.properties` matches your keystore

### Issue: "Alias not found"

**Fix:** Check the alias name using:

```bash
keytool -list -v -keystore release.keystore
```

### Issue: "Keystore file not found"

**Fix:** Make sure `release.keystore` is in `android/app/` directory

---

## 📋 Quick Checklist

- [ ] `keystore.properties` file created in `android/app/`
- [ ] All values filled in (storeFile, storePassword, keyAlias, keyPassword)
- [ ] `release.keystore` file exists in `android/app/`
- [ ] `keystore.properties` added to `.gitignore`
- [ ] Build release bundle: `./gradlew bundleRelease`
- [ ] Verify AAB is signed: `jarsigner -verify ...`
- [ ] Upload to Play Console - should work! ✅

---

## 🎯 Quick Command Summary

```bash
# 1. Create keystore.properties (edit with your values)
cd android/app
nano keystore.properties

# 2. Build signed release
cd ..
./gradlew bundleRelease

# 3. Verify signing
jarsigner -verify -verbose -certs app/build/outputs/bundle/release/app-release.aab

# 4. Upload app-release.aab to Play Console
```

---

Once you create `keystore.properties` with the correct values, your builds will be properly signed and you can upload to Play Console! 🚀
