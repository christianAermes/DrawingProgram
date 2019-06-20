$(document).ready(()=>{
  let move = [] // current move of the user
  let history = [] // history of all moves performed by the user
  
  // RGB values of the initial color
  let r0 = 62
  let g0 = 130
  let b0 = 124
  
  let buttons =  [$("#drawCircle"), $("#drawRect"), $("#drawTriangle"), $("#drawLine")]
  
  // highlight the active drawing shape
  let active = $("#drawCircle")
  $("#drawCircle").addClass("active")
  $(".drawShape").on("click", function() {
    $(".drawShape").removeClass("active")
    $(this).addClass("active")
  })
  
  // Define and change the drawing shapes on click
  // Default: Circle
  let form = "circle"
  $("#drawCircle").on("click", ()=>{
    form = "circle"
    active = $("#drawCircle")
  })
  $("#drawRect").on("click", ()=>{
    form = "rect"
    active = $("#drawRect")
  })
  $("#drawTriangle").on("click", ()=>{
    form = "triangle"
    active = $("#drawTriangle")
  })
  $("#drawLine").on("click", ()=>{
    form = "line"
    active = $("#drawLine")
  })
  
  // Undo Button: remove last element from history array
  $("#undo").on("click", ()=>{
    if (history.length > 0) {
      history = history.slice(0, history.length-1)
    }
  })
  
  // Controlling the sliders for Thickness, Ratio, and Rotation
  // of the drawing shapes
  // On change, display the respective values
  $("#thicknessValue").html("\t"+$("#thickness").val()+"px")
  $("#thickness").on("change", ()=>{
    $("#thicknessValue").html("\t"+$("#thickness").val()+"px")
  })
  
  $("#ratioValue").html("\t"+$("#ratio").val())
  $("#ratio").on("change", ()=>{
    $("#ratioValue").html("\t"+$("#ratio").val())
  })
  
  $("#rotationValue").html("\t"+$("#rotation").val()+"°")
  $("#rotation").on("change", ()=>{
    $("#rotationValue").html("\t"+$("#rotation").val()+"°")
  })

  // Functions to convert RGB to HEX colors
  function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  
  function updateShapeColor(r,g,b) {
    let color = "rgb("+r+","+g+","+b+")"

    $("#drawCircle").css("background", color)
    $("#drawRect").css("background", color)
    $("#TrBody").css("border-bottom", "37px solid "+color)
    $("#drawLine").css("background", color)
  }
  // Setup the colorpicker
  $("#colorpicker").spectrum({
    color: rgbToHex(r0, g0, b0),
    showButtons: false,
    preferredFormat: "rgb",
    flat: true,
    showAlpha: true,
    showInput: true,
  })
  
  
  // Set up the sketch
  let sketch = function(p) { 
    let x0, y0, x1, y1 // coordinates of the shapes
    let locked // is mouse pressed down?
    let canvas // canvas for drawing
    // p5js Setup function
    // initialize everything, create a canvas for drawing
    p.setup = function() {
      p.angleMode(p.DEGREES)
      p.rectMode(p.CENTER)
      p.colorMode("RGBA")
      updateShapeColor(r0, g0, b0)
      locked = false
      let width = parseFloat($("#canvasContainer").css("width").replace("px",""))
      let height = parseFloat($("#canvasContainer").css("height").replace("px",""))

      canvas = p.createCanvas(width,height);
      canvas.background(255)
      
      canvas.mousePressed(() => {
        // Can only draw when the mouse is pressed inside of the canvas
        x0 = p.mouseX
        y0 = p.mouseY
        move = []
        locked = true
      })
    }
    
    p.windowResized = function() {
      // Responsive Canvas --> change canvas size on window resize
      let width = parseFloat($("#canvasContainer").css("width").replace("px", ""))
      let height = parseFloat($("#canvasContainer").css("height").replace("px", ""))
      p.resizeCanvas(width, height);
    }
    
    p.mouseReleased = function() {
      // when the mouse is released, stop drawing
      if (move.length > 0) {
        history.push(move)
      }
      move = []
      locked = false
    }
    
    $("#clearBtn").on("click", ()=>{
      // Clear the canvas
      p.clear()
      canvas.background(255)
      history = []
    })
    
    p.draw = function() {
      // only draw when the mouse is pressed down
      let colorCP = $("#colorpicker").spectrum('get')
      let r = Math.round(colorCP._r)
      let g = Math.round(colorCP._g)
      let b = Math.round(colorCP._b)
      let a = Math.round(colorCP._a*255)
      
      updateShapeColor(r,g,b)
      let color = p.color(r,g,b,a)
      
      if (locked) {
        // if user presses mouse, draw whatever the user is drawing
        let rotation = parseFloat($("#rotation").val())
        let ratio = parseFloat($("#ratio").val())
        let thickness = parseFloat($("#thickness").val())

        let w = ratio < 1 ? thickness*ratio : thickness
        let h = ratio < 1 ? thickness : thickness/ratio
        
        p.fill(color)
        p.noStroke()
        
        x1 = p.mouseX
        y1 = p.mouseY
        
        p.push()
        p.translate(p.mouseX, p.mouseY)
        p.rotate(rotation)
        if (form === "circle") {
          p.ellipse(0, 0, w, h)
        } else if (form === "rect") {
          p.rect(0, 0, w, h)
        } else if (form === "triangle") {
          p.triangle(-w/2,Math.sqrt(3)/4*h, 0,-Math.sqrt(3)/4*h, w/2,Math.sqrt(3)/4*h)
        }
        p.pop()
        if (form === "line") {
          p.stroke(color)
          p.strokeWeight(thickness)
          p.line(x0,y0, x1,y1)
        }
        x0 = x1
        y0 = y1
        
        move.push({
          form: form,
          thickness: thickness,
          ratio: ratio,
          rotation: rotation,
          color: color,
          x0: x0,
          y0: y0,
          x1: x1,
          y1: y1
        })
      }
      else {
        // if user is not pressing the mouse, draw everything that is stored in the history array
        p.clear()
        canvas.background(255)
        for (let i=0; i<history.length; i++) {
          let step = history[i]
          for (let j=0; j<step.length; j++) {
            let s = step[j]
            let rotation = s.rotation
            let ratio = s.ratio
            let thickness = s.thickness

            let w = ratio < 1 ? thickness*ratio : thickness
            let h = ratio < 1 ? thickness : thickness/ratio

            p.fill(s.color)
            p.noStroke()

            p.push()
            p.translate(s.x0, s.y0)
            p.rotate(s.rotation)
            if (s.form === "circle") {
              p.ellipse(0, 0, w, h)
            } else if (s.form === "rect") {
              p.rect(0, 0, w, h)
            } else if (s.form === "triangle") {
              p.triangle(-w/2,Math.sqrt(3)/4*h, 0,-Math.sqrt(3)/4*h, w/2,Math.sqrt(3)/4*h)
            }
            p.pop()
            if (s.form === "line") {
              p.stroke(s.color)
              p.strokeWeight(s.thickness)
              if (j > 1) {
                let s_ = step[j-1]
                p.line(s.x0,s.y0, s_.x0,s_.y0)
              }
            }
          }
        }
      }
    }
  }

  new p5(sketch, window.document.getElementById("canvasContainer"))
})