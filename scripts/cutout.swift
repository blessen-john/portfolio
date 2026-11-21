// Subject cut-out with Apple's Vision framework: keeps the person, makes the backdrop transparent.
import Foundation
import Vision
import CoreImage

let args = CommandLine.arguments
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
guard let image = CIImage(contentsOf: input) else { fatalError("cannot read input") }
let handler = VNImageRequestHandler(ciImage: image)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])
guard let result = request.results?.first else { fatalError("no subject found") }
let buffer = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
let cut = CIImage(cvPixelBuffer: buffer)
let ctx = CIContext()
try ctx.writePNGRepresentation(of: cut, to: output, format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("written", output.path)
