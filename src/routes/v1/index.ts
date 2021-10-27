// Dependencies
import * as path from "path"
import * as cheerio from "cheerio"
import express from "express"
import got from "got"

// Create router
const router = express.Router()
router.use(express.json());
const fileExt = path.extname(__filename)

//
const sanitiseRegex = /[^\w\s-]+/g
router.post("/extract", async (req, res) => {
    // Get artist and title
    let Artist: string = req.body.artist
    let Title: string = req.body.title

    // Make sure they exist
    if (!Artist || !Title){
        return res.sendStatus(400)
    }

    // Parse
    Artist = Artist.toString().replace("&", "and").replace(" ", "-").replace(sanitiseRegex, "")
    Title = Title.toString().replace(" ", "-").replace(sanitiseRegex, "")

    // Get the lyrics
    const Response = await got(`https://genius.com/${Artist}-${Title}-lyrics`, {
        throwHttpErrors: false
    })
    const Body = Response.body

    // Make sure there was no errors
    if (Response.statusCode != 200){
        return res.status(Response.statusCode).send(Response.statusMessage)
    }

    // Parse the HTML Body
    const $ = cheerio.load(Body)

    // Method 1
    let Lyrics = $('div[class="lyrics"]').text().trim() || ""

    // Method 2 (if Method 1 did not work)
    if (Lyrics == ""){
        // Loop through each lyric container
        for (const Container of $('div[class^="Lyrics__Container"]')){
            // Parse container
            const ParsedContainter = $(Container)

            // Make sure is long enough
            if (ParsedContainter.text().length == 0){
                continue
            }

            // Convert to HTML, make sure worked
            const HTMLContainer = ParsedContainter.html()
            if (!HTMLContainer){
                continue
            }

            // Get the lyric and add it
            let Lyric = HTMLContainer
                .replace(/<br>/g, "\n")
                .replace(/<(?!\s*br\s*\/?)[^>]+>/gi, "");

            Lyrics += $("<textarea/>").html(Lyric).text().trim()
        }
    }

    // Return lyrics
    return res.send(Lyrics)
})

// Parse the route path
let Path = __dirname.split(path.sep)
Path.splice(0, Path.indexOf("routes") + 1)

const basename = path.basename(__filename, fileExt)
const File = basename == "index" ? "" : `/${basename}`

// Export
export const RouterData = {
    Path: `/${Path.join("/")}${File}`,
    Route: router
}