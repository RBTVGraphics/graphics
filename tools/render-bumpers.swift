import AppKit
import AVFoundation
import CoreGraphics
import CoreVideo

struct Segment: Decodable {
    let id, title, label, strap, group, icon: String
    let lines: [String]
    let file: String?
}

let args = CommandLine.arguments
guard args.count >= 4 else { fatalError("Usage: render-bumpers catalog.json logo.png output-folder [segment-id]") }
let catalog = try JSONDecoder().decode([Segment].self, from: Data(contentsOf: URL(fileURLWithPath: args[1])))
let logo = NSImage(contentsOfFile: args[2])!
let output = URL(fileURLWithPath: args[3], isDirectory: true)
let width = 1920, height = 1080, fps: Int32 = 30
let rgb = CGColorSpace(name: CGColorSpace.sRGB)!
func col(_ hex: Int, _ alpha: CGFloat = 1) -> CGColor {
    CGColor(srgbRed: CGFloat((hex >> 16) & 255)/255, green: CGFloat((hex >> 8) & 255)/255, blue: CGFloat(hex & 255)/255, alpha: alpha)
}
let navy = 0x0b1b3b, royal = 0x2364b9, mid = 0x5d91cd
func ramp(_ t: Double, _ a: Double, _ b: Double) -> CGFloat { CGFloat(max(0,min(1,(t-a)/(b-a)))) }
func ease(_ p: CGFloat) -> CGFloat { 1-pow(1-p,3) }
func poly(_ c: CGContext, _ points: [(CGFloat,CGFloat)], _ color: CGColor) {
    c.beginPath()
    c.move(to: CGPoint(x:points[0].0,y:points[0].1))
    for (x,y) in points.dropFirst() { c.addLine(to: CGPoint(x:x,y:y)) }
    c.closePath(); c.setFillColor(color); c.fillPath()
}
func rect(_ c: CGContext,_ x: CGFloat,_ y: CGFloat,_ w: CGFloat,_ h: CGFloat,_ color: CGColor) {
    c.setFillColor(color); c.fill(CGRect(x:x,y:y,width:w,height:h))
}
func stroke(_ c: CGContext,_ pts: [(CGFloat,CGFloat)],_ color: CGColor,_ width: CGFloat = 3) {
    c.beginPath(); c.move(to:CGPoint(x:pts[0].0,y:pts[0].1))
    for (x,y) in pts.dropFirst() { c.addLine(to:CGPoint(x:x,y:y)) }
    c.setStrokeColor(color);c.setLineWidth(width);c.setLineJoin(.round);c.setLineCap(.round);c.strokePath()
}
func ring(_ c: CGContext,_ x: CGFloat,_ y: CGFloat,_ r: CGFloat,_ color: CGColor,_ line: CGFloat = 2) {
    c.setStrokeColor(color);c.setLineWidth(line);c.strokeEllipse(in:CGRect(x:x-r,y:y-r,width:r*2,height:r*2))
}
func dot(_ c: CGContext,_ x: CGFloat,_ y: CGFloat,_ r: CGFloat,_ color: CGColor) {
    c.setFillColor(color); c.fillEllipse(in:CGRect(x:x-r,y:y-r,width:r*2,height:r*2))
}
func box(_ c: CGContext,_ x: CGFloat,_ y: CGFloat,_ w: CGFloat,_ h: CGFloat,_ color: CGColor,_ line: CGFloat = 5) {
    c.setStrokeColor(color); c.setLineWidth(line); c.stroke(CGRect(x:x,y:y,width:w,height:h))
}
func text(_ s: String,_ x: CGFloat,_ y: CGFloat,_ size: CGFloat,_ hex: Int,_ maxWidth: CGFloat = 1800,_ tight: Bool = false,_ kern: CGFloat = 3,_ right: Bool = false) {
    var pt = size
    func attributed() -> NSAttributedString {
        let font = tight ? (NSFont(name:"AvenirNextCondensed-HeavyItalic",size:pt) ?? .systemFont(ofSize:pt,weight:.black))
            : (NSFont(name:"AvenirNext-Bold",size:pt) ?? .boldSystemFont(ofSize:pt))
        return NSAttributedString(string:s,attributes:[.font:font,.foregroundColor:NSColor(cgColor:col(hex))!, .kern:kern])
    }
    var a=attributed()
    if a.size().width > maxWidth { pt *= maxWidth/a.size().width; a=attributed() }
    a.draw(at: NSPoint(x:right ? x-a.size().width : x,y:y))
}
func graphic(_ c: CGContext,_ kind: String,_ time: Double,_ accent: Int) {
    let ink=col(accent), faint=col(accent,0.35)
    for r: CGFloat in [100,144,204] {ring(c,0,0,r,col(accent,r==204 ? 0.38 : 0.17))}
    for i in 0..<32 {
        let a=CGFloat(i)*(.pi/16), r:CGFloat=i%4==0 ? 217 : 211
        stroke(c,[(cos(a)*204,sin(a)*204),(cos(a)*r,sin(a)*r)],faint,i%4==0 ? 3:1)
    }
    let angle=CGFloat(time*1.1)-1.7
    stroke(c,[(cos(angle)*158,sin(angle)*158),(cos(angle)*200,sin(angle)*200)],ink,4)
    dot(c,cos(angle)*202,sin(angle)*202,6,ink)
    let p=ease(ramp(time,0.45,1.15))
    c.saveGState();c.setAlpha(p);c.scaleBy(x:0.8+0.2*p,y:0.8+0.2*p)
    switch kind {
    case "chat":
        stroke(c,[(-108,-59),(42,-59),(42,43),(-55,43),(-83,72),(-83,43),(-108,43),(-108,-59)],ink,6)
        stroke(c,[(58,-21),(106,-21),(106,72),(81,72),(81,99),(50,72),(-8,72),(-8,58)],faint,6)
        for x:CGFloat in [-76,-33,10]{dot(c,x,-9,7,ink)}
    case "boost":
        stroke(c,[(-96,81),(-96,16),(-58,16),(-58,81),(-19,81),(-19,-23),(19,-23),(19,81),(58,81),(58,-61),(96,-61),(96,81)],ink,6)
        stroke(c,[(-92,-17),(-14,-79),(28,-79),(86,-131),(86,-96)],faint,5)
    case "dial":
        ring(c,0,0,112,ink,6); ring(c,0,0,11,ink,5)
        stroke(c,[(0,0),(48,-56)],ink,7)
        for i in 0..<12 {let a=CGFloat(i)*(.pi/6);stroke(c,[(cos(a)*91,sin(a)*91),(cos(a)*103,sin(a)*103)],faint,3)}
    case "lock":
        box(c,-82,-18,164,111,ink,7)
        c.setStrokeColor(ink);c.setLineWidth(7);c.beginPath()
        c.addArc(center:.init(x:0,y:-20),radius:52,startAngle:.pi,endAngle:2 * .pi,clockwise:false);c.strokePath()
        dot(c,0,27,10,ink);stroke(c,[(0,27),(0,58)],ink,7)
    case "frame":
        for (x,y) in [(-1.0,-1.0),(1.0,-1.0),(-1.0,1.0),(1.0,1.0)] {
            stroke(c,[(x*67,y*89),(x*109,y*89),(x*109,y*48)],ink,7)
        }
        poly(c,[(-28,-45),(47,0),(-28,45)],ink)
    case "bars":
        for i in 0..<4 {
            let h=(CGFloat(i)*41+49)*p
            rect(c,CGFloat(i)*57-110,81-h,39,h,i==3 ? ink : col(accent,0.46+CGFloat(i)*0.10))
        }
        stroke(c,[(-118,93),(122,93)],faint,4)
    case "upset":
        stroke(c,[(-110,69),(-59,22),(-19,53),(89,-80)],ink,9)
        stroke(c,[(31,-76),(91,-82),(92,-23)],ink,9);ring(c,-109,69,15,faint,4)
    case "count":
        rect(c,-107,3,60,76,faint);rect(c,-30,-50,60,129,ink);rect(c,47,27,60,52,faint)
        text("2",-92,8,37,navy);text("1",-12,-40,46,0xffffff);text("3",63,30,37,navy)
    case "turn":
        stroke(c,[(-114,56),(-42,56),(8,-38),(100,-38)],ink,8)
        stroke(c,[(69,-65),(99,-38),(69,-10)],ink,8);ring(c,-42,56,17,ink,5);ring(c,8,-38,16,faint,5)
    case "number":
        stroke(c,[(-38,100),(-2,-101)],ink,8);stroke(c,[(28,100),(64,-101)],ink,8)
        stroke(c,[(-89,-28),(103,-28)],ink,8);stroke(c,[(-103,34),(88,34)],ink,8)
    case "map":
        stroke(c,[(-67,-115),(43,-115),(50,-83),(62,-68),(62,27),(49,54),(38,78),(20,105),(7,116),(-17,94),(-26,61),(-59,36),(-59,15),(-79,-3),(-72,-35),(-52,-63),(-52,-89),(-67,-115)],ink,5)
        stroke(c,[(-43,-52),(0,-3),(28,55)],faint,5)
        for (x,y) in [(-43.0,-52.0),(0.0,-3.0),(28.0,55.0)] {dot(c,x,y,8,ink);ring(c,x,y,18,faint,2)}
    case "check":
        box(c,-74,-104,148,211,ink,6)
        for y:CGFloat in [-63,-20,24] {stroke(c,[(-48,y),(35,y)],faint,5)}
        stroke(c,[(-15,62),(4,81),(46,39)],ink,8)
    default:
        ring(c,0,-35,40,ink,8);rect(c,-40,-35,80,34,ink);dot(c,0,-5,40,ink)
        stroke(c,[(-65,-5),(-65,27),(-45,57),(0,67),(45,57),(65,27),(65,-5)],faint,6)
        stroke(c,[(0,67),(0,105),(-37,105),(37,105)],ink,6)
    }
    c.restoreGState()
}
func frame(_ c: CGContext,_ segment: Segment,_ n: Int,_ time: Double) {
    let grad=CGGradient(colorsSpace:rgb,colors:[col(0xd3e1ef),col(0xf5f9fd),col(0xd6e2f0)] as CFArray,locations:[0,0.52,1])!
    c.drawLinearGradient(grad,start:.init(x:0,y:920),end:.init(x:1920,y:250),options:[.drawsBeforeStartLocation,.drawsAfterEndLocation])
    for i in -2...9 {
        let x=CGFloat(i)*262+CGFloat(time)*13
        poly(c,[(x,1080),(x+73,1080),(x+515,0),(x+442,0)],col(navy,i%2==0 ? 0.059 : 0.035))
    }
    let accent = segment.group=="bonus" ? 0x2259a0 : royal
    let a=ease(ramp(time,0.0,0.55))
    let b=ease(ramp(time,0.22,0.77))
    let sweep=CGFloat(time)*1300-300
    poly(c,[(sweep-125,1080),(sweep-45,1080),(sweep+400,0),(sweep+320,0)],col(0xffffff,0.27))
    c.saveGState();c.translateBy(x:-260*(1-a),y:0)
    poly(c,[(0,0),(473,0),(188,326),(0,326)],col(accent))
    poly(c,[(0,0),(400,0),(158,278),(0,278)],col(navy));c.restoreGState()
    c.saveGState();c.translateBy(x:270*(1-a),y:0)
    poly(c,[(1920,754),(1748,754),(1447,1080),(1920,1080)],col(accent))
    poly(c,[(1920,804),(1774,804),(1519,1080),(1920,1080)],col(navy));c.restoreGState()
    for row in 0..<7 { for j in 0..<22 {
        dot(c,CGFloat(1370+j*17),CGFloat(225+row*16),1.4,col(mid,0.26*b))
        dot(c,CGFloat(128+j*17),CGFloat(822+row*16),1.4,col(mid,0.23*b))
    }}
    rect(c,130,238,1660*b,2,col(accent,0.25))
    c.saveGState();c.setAlpha(b)
    let ns=NSGraphicsContext(cgContext:c,flipped:true)
    NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=ns
    // Respect the padding and colors in the supplied show logo.
    logo.draw(in:CGRect(x:402,y:70,width:465,height:155),from:.zero,operation:.sourceOver,fraction:1,respectFlipped:true,hints:nil)
    text(String(format:"%02d",n)+"  /  "+segment.label.uppercased(),1740,145,24,navy,620,false,3,true)
    NSGraphicsContext.restoreGraphicsState()
    c.restoreGState()
    c.saveGState();c.translateBy(x:427,y:550);c.setAlpha(b);graphic(c,segment.icon,time,accent);c.restoreGState()
    let t=ease(ramp(time,0.43,1.0)), u=ease(ramp(time,0.62,1.2)), v=ease(ramp(time,0.87,1.42))
    c.saveGState();c.clip(to:CGRect(x:710,y:373,width:1020,height:438))
    NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=ns
    c.saveGState();c.setAlpha(t);text(segment.lines[0],717+126*(1-t),400,125,navy,935,true,-0.5);c.restoreGState()
    c.saveGState();c.setAlpha(u);text(segment.lines[1],714+146*(1-u),535,149,accent,935,true,-0.5);c.restoreGState()
    c.saveGState();c.setAlpha(v);text(segment.strap,719,730,22,navy,920,false,3);c.restoreGState()
    NSGraphicsContext.restoreGraphicsState();c.restoreGState()
    rect(c,716,705,889*v,3,col(accent));rect(c,716,700,126*v,10,col(accent))
    let out=ease(ramp(time,4.22,4.50))
    if out>0 {
        let x=2500*out-530
        poly(c,[(-900,0),(x,0),(x-470,1080),(-900,1080)],col(navy))
        poly(c,[(x-55,0),(x,0),(x-470,1080),(x-525,1080)],col(accent))
    }
}
func render(_ item:Segment,_ index:Int) throws {
    let url=output.appendingPathComponent(item.id+".mp4")
    let writer=try AVAssetWriter(outputURL:url,fileType:.mp4)
    let input=AVAssetWriterInput(mediaType:.video,outputSettings:[
        AVVideoCodecKey:AVVideoCodecType.h264,AVVideoWidthKey:width,AVVideoHeightKey:height,
        AVVideoCompressionPropertiesKey:[AVVideoAverageBitRateKey:3_600_000,AVVideoExpectedSourceFrameRateKey:fps]
    ])
    let adapter=AVAssetWriterInputPixelBufferAdaptor(assetWriterInput:input,sourcePixelBufferAttributes:[
        kCVPixelBufferPixelFormatTypeKey as String:kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String:width,kCVPixelBufferHeightKey as String:height,
        kCVPixelBufferCGImageCompatibilityKey as String:true,kCVPixelBufferCGBitmapContextCompatibilityKey as String:true
    ])
    writer.add(input); guard writer.startWriting() else { throw writer.error! }
    writer.startSession(atSourceTime:.zero)
    for i in 0..<135 {
        while !input.isReadyForMoreMediaData {
            if writer.status != .writing { throw writer.error! }
            Thread.sleep(forTimeInterval:0.003)
        }
        try autoreleasepool {
            var buffer:CVPixelBuffer?
            guard CVPixelBufferPoolCreatePixelBuffer(nil,adapter.pixelBufferPool!,&buffer)==kCVReturnSuccess, let px=buffer else {fatalError("Pixel buffer allocation failed")}
            CVPixelBufferLockBaseAddress(px,[])
            let flags=CGBitmapInfo.byteOrder32Little.rawValue | CGImageAlphaInfo.noneSkipFirst.rawValue
            let ctx=CGContext(data:CVPixelBufferGetBaseAddress(px),width:width,height:height,bitsPerComponent:8,bytesPerRow:CVPixelBufferGetBytesPerRow(px),space:rgb,bitmapInfo:flags)!
            ctx.translateBy(x:0,y:CGFloat(height));ctx.scaleBy(x:1,y:-1)
            frame(ctx,item,index,Double(i)/Double(fps))
            CVPixelBufferUnlockBaseAddress(px,[])
            guard adapter.append(px,withPresentationTime:CMTime(value:Int64(i),timescale:fps)) else {
                throw writer.error ?? NSError(domain:"RBTV",code:1)
            }
        }
    }
    writer.endSession(atSourceTime:CMTime(value:135,timescale:fps));input.markAsFinished()
    let finished=DispatchSemaphore(value:0);writer.finishWriting{finished.signal()};finished.wait()
    if writer.status != .completed {throw writer.error!}
    print("Rendered "+item.title)
}
for (i,s) in catalog.enumerated() where s.file==nil && (args.count==4 || s.id==args[4]) {try render(s,i+1)}
