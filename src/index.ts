// Dependencies
import * as fs from "fs"
import * as path from "path"
import express from "express"

// Create app
const port = 80
const app = express()
const fileExt = path.extname(__filename)

//
async function ImportRoutes(directory = __dirname){
    // Loop through directory
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})){
        // Repeat if is directory
        if (entry.isDirectory()){
            await ImportRoutes(`${directory}/${entry.name}`)
            continue
        }

        // Make sure is a file
        const file = entry.name
        if (path.extname(file) != fileExt){
            continue
        }

        //
        const filePath = `${directory}/${file}`
        const RouteData = (await import(filePath)).RouterData
        app.use(RouteData.Path, RouteData.Route)
    }
}
ImportRoutes(`${__dirname}/routes`)

// Default
app.get("/", (req, res) => {
    return res.send("Hello world!")
})

// Listen on port
app.listen(port, () => {
    console.log(`Server running on port ${port}.`)
})