import UIKit
import React_RCTAppDelegate

@objc(GradientViewManager)
class GradientViewManager: RCTViewManager {
  
  override func view() -> UIView! {
    return GradientView()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  override static func moduleName() -> String! {
    return "GradientView"
  }
}
