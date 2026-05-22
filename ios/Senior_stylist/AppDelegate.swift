import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import FirebaseAuth
import FirebaseCore
import FirebaseMessaging

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

 var window: UIWindow?
 var reactNativeDelegate: ReactNativeDelegate?
 var reactNativeFactory: RCTReactNativeFactory?

 func application(
 _ application: UIApplication,
 didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
 ) -> Bool {

 // ------------------------------------------------
 // Firebase configuration (DEV / PROD)
 // Use bundle identifier to avoid scheme/flag drift.
 // ------------------------------------------------
 let bundleIdentifier = Bundle.main.bundleIdentifier ?? ""
 let isDevBundle = bundleIdentifier.hasSuffix(".dev")
 let firebasePlistName = isDevBundle ? "GoogleService-Info-Dev" : "GoogleService-Info-Prod"
 print(" Firebase ENV: \(isDevBundle ? "DEV" : "PROD") bundle=\(bundleIdentifier)")

 guard
  let filePath = Bundle.main.path(forResource: firebasePlistName, ofType: "plist"),
  let firebaseOptions = FirebaseOptions(contentsOfFile: filePath)
 else {
  fatalError(" Firebase plist not found: \(firebasePlistName).plist")
 }

 FirebaseApp.configure(options: firebaseOptions)

 // ------------------------------------------------
 // React Native bootstrap (UNCHANGED)
 // ------------------------------------------------
 let delegate = ReactNativeDelegate()
 let factory = RCTReactNativeFactory(delegate: delegate)
 delegate.dependencyProvider = RCTAppDependencyProvider()

 reactNativeDelegate = delegate
 reactNativeFactory = factory

 window = UIWindow(frame: UIScreen.main.bounds)

 factory.startReactNative(
  withModuleName: "Senior_stylist",
  in: window,
  launchOptions: launchOptions
 )

 application.registerForRemoteNotifications()

 return true
 }

 /// Phone Auth (reCAPTCHA): return from Safari must be delivered to Firebase Auth.
 func application(
 _ application: UIApplication,
 open url: URL,
 options: [UIApplication.OpenURLOptionsKey: Any] = [:]
 ) -> Bool {
 if Auth.auth().canHandle(url) {
 return true
 }
 return false
 }

 // ------------------------------------------------
 // Push Notifications (Firebase Messaging)
 // ------------------------------------------------
 func application(
 _ application: UIApplication,
 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
 ) {
 Messaging.messaging().apnsToken = deviceToken
 }

 func application(
 _ application: UIApplication,
 didFailToRegisterForRemoteNotificationsWithError error: Error
 ) {
 print(" Failed to register for remote notifications:", error)
 }
}

// ------------------------------------------------
// React Native delegate (UNCHANGED)
// ------------------------------------------------
class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {

 override func sourceURL(for bridge: RCTBridge) -> URL? {
 return self.bundleURL()
 }

override func bundleURL() -> URL? {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings()
        .jsBundleURL(
          forBundleRoot: "index",
          fallbackExtension: nil
        )
    #else
      return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

}
