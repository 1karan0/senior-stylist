import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
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
 // ------------------------------------------------
 #if DEV
  let firebasePlistName = "GoogleService-Info-Dev"
  print(" Firebase ENV: DEV (Simulator / TestFlight)")
 #else
  let firebasePlistName = "GoogleService-Info-Prod"
  print(" Firebase ENV: PROD (App Store)")
 #endif

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
 self.bundleURL()
 }

 override func bundleURL() -> URL? {
 #if DEBUG
  return RCTBundleURLProvider.sharedSettings()
  .jsBundleURL(forBundleRoot: "index")
 #else
  return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
 #endif
 }
}