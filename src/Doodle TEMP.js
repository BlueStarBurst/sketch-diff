import CanvasDraw from "react-canvas-draw";
import React from 'react'
import './Doodle.css';
import { useRef } from 'react'
import { useEffect, useState } from "react";
import Title from "./Title"
// import modelJSON from "./model/model.json"
import * as tf from '@tensorflow/tfjs';
import { classes } from "./classes";

// import test from "./envelope.png"

// ok nvm it has to be in an asycn function

// hehe oops


export default function Doodle(props) {
  function clearCanvas() {
    ref.current.eraseAll()
  }
  function undoCanvas() {
    ref.current.undo()
  }

  const [model, setModel] = useState(null)

  const [imgUrl, setImgURL] = useState("")
  const [greyScaleURL, setGreyScaleURL] = useState("")
  const [classList, setClassList] = useState(classes.split(' ', 100))


  async function loadModel() {
    var models = await tf.loadLayersModel("model/model.json")
    console.log("LOADED MODEL")
    setModel(models)
    
  }

  useEffect(() => {
    loadModel() // noice
  }, [])

  useEffect(() => {
    document.title = "Team Name";
  }, [imgUrl, greyScaleURL]);


  const ref = useRef(null)

  const getImageData = async () => {

    const imgurl = await ref.current.getDataURL()

    // preprocess(imgurl)
    
    // predictImage(document.getElementById("canv").children[0].children[1])
    // predictImage(document.getElementById("test"))
    // return;
    // const imgThing = await ref.current.get
    setImgURL(imgurl)
    // predictImage(document.getElementById("canv").children[0].children[1]);
    // return

    const img = document.createElement('img');
    img.src = imgurl

    var imgData

    img.addEventListener('load', async () => {

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0, img.width, img.height)

      document.body.appendChild(canvas)

      const dpi = window.devicePixelRatio
      // const imgData = canvas.contextContainer.getImageData(0, 0, canvas.width, canvas.height);


      imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      var minX = 1000000
      var minY = 1000000
      var maxX = 0
      var maxY = 0

      for (var y = 0; y < canvas.height; y++) {
        for (var x = 0; x < canvas.width; x++) {
          var i = (y * 4) * canvas.width + x * 4;
          var avg = 255 - (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;

          imgData.data[i] = avg;
          imgData.data[i + 1] = avg;
          imgData.data[i + 2] = avg;
          if (avg != 0) {
            if (x < minX) {
              minX = x
            }
            if (x > maxX) {
              maxX = x
            }
            if (y < minY) {
              minY = y
            }
            if (y > maxY) {
              maxY = y
            }
          }
        }
      }

      console.log(minX, minY, maxX, maxY)

      ctx.putImageData(imgData, 0, 0, 0, 0, canvas.width, canvas.height)

      imgData = ctx.getImageData(minX * dpi, minY * dpi, (maxX - minX) * dpi, (maxY - minY) * dpi)


      predictImage(imgData)



      //define width and height of image
      // canvas.width = 28
      // canvas.height = 28

      // ctx.drawImage(img, 0, 0, 28, 28) //draws image of dimensions 28 * 28

      // imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // console.log(imgData)



      // ctx.putImageData(imgData, 0, 0, 0, 0, canvas.width, canvas.height)
      // console.log(ctx.getImageData(0, 0, canvas.width, canvas.height))

      // const url = canvas.toDataURL(0, 0, canvas.width, canvas.height)

      // setGreyScaleURL(url) // here

      // console.log(imgData)



      // // canvas.remove()
      // // img.remove()

    })

    // console.log(greyScaleURL)
    console.log("hit end")

  }

  function predictImage(imgData) {
    const pred = model.predict(preprocess(imgData)).dataSync() // we should display the result on the screen
    console.log(pred)

    let max = -100
    let maxIdx = 0

    for (let i = 0; i < pred.length; i++) {
      if (pred[i] > max) {
        max = pred[i]
        maxIdx = i
      }
    }


    console.log(classList[maxIdx])
  }


  function preprocess(imgData) {
    return tf.tidy(() => {
      //convert to a tensor 
      let tensor = tf.browser.fromPixels(imgData, 1)

      //resize 
      const resized = tf.image.resizeBilinear(tensor, [28, 28]).toFloat()

      //normalize 
      const offset = tf.scalar(255.0);
      const normalized = tf.scalar(1.0).sub(resized.div(offset));

      tf.browser.toPixels(normalized, document.getElementById("test"))

      //We add a dimension to get a batch shape 
      const batched = normalized.expandDims(0)
      return batched
    })
  }




  return (
    <div className="canvas" id="canv">
      <CanvasDraw brushColor="#000000" ref={ref} brushRadius={props.brushSize} hideGrid style={{ boxShadow: "0 13px 27px -5px rgba(50, 50, 93, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.3)" }} />
      <canvas id="test" />
      <button className="clear bg-purple-600" onClick={clearCanvas}>Clear</button>
      &nbsp;&nbsp;&nbsp;
      <button className="undo bg-purple-600" onClick={undoCanvas}>Undo</button>
      &nbsp;&nbsp;&nbsp;
      <button className="bg-purple-600" onClick={getImageData}>Click</button>
      <img src={imgUrl} />
      <img src={greyScaleURL} />
    </div>
  )
}


