import UIKit
import React_RCTAppDelegate

@objc(GradientView)
class GradientView: UIView {
  private var gradientLayer: CAGradientLayer?
  
  @objc var colors: [String] = [] {
    didSet {
      updateGradient()
    }
  }
  
  @objc var startX: NSNumber = 0 {
    didSet {
      updateGradient()
    }
  }
  
  @objc var startY: NSNumber = 0 {
    didSet {
      updateGradient()
    }
  }
  
  @objc var endX: NSNumber = 1 {
    didSet {
      updateGradient()
    }
  }
  
  @objc var endY: NSNumber = 1 {
    didSet {
      updateGradient()
    }
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    gradientLayer?.frame = bounds
  }
  
  private func updateGradient() {
    gradientLayer?.removeFromSuperlayer()
    
    guard colors.count >= 2 else { return }
    
    let gradient = CAGradientLayer()
    gradient.frame = bounds
    gradient.colors = colors.map { UIColor(hex: $0)?.cgColor ?? UIColor.clear.cgColor }
    gradient.startPoint = CGPoint(x: CGFloat(truncating: startX), y: CGFloat(truncating: startY))
    gradient.endPoint = CGPoint(x: CGFloat(truncating: endX), y: CGFloat(truncating: endY))
    
    layer.insertSublayer(gradient, at: 0)
    gradientLayer = gradient
  }
}

extension UIColor {
  convenience init?(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let a, r, g, b: UInt64
    switch hex.count {
    case 3: // RGB (12-bit)
      (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
    case 6: // RGB (24-bit)
      (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
    case 8: // ARGB (32-bit)
      (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
    default:
      return nil
    }
    self.init(
      red: CGFloat(r) / 255,
      green: CGFloat(g) / 255,
      blue: CGFloat(b) / 255,
      alpha: CGFloat(a) / 255
    )
  }
}
